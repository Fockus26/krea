// La cola sin conexión en el navegador (D292–D295): el almacén IndexedDB, el candado entre
// pestañas (Web Locks; si no hay, un arriendo en localStorage), el estado que leen los
// formularios (`useOpCola`) y el drenaje contra las Server Actions de la cola. Solo cliente.
import { useSyncExternalStore } from "react";
import {
  enviarEntregaPendiente,
  type ResultadoEnvioCola,
  type ResultadoSubidaCola,
  subirImagenPendiente,
} from "@/lib/acciones/entregas";
import {
  guardarTareaPendiente,
  type ResultadoTareaCola,
} from "@/lib/acciones/tareas";
import { rutasImagen } from "@/lib/modelo";
import {
  type Candado,
  candadoEnMemoria,
  candadoPorArriendo,
  clasificar,
  type Drenaje,
  drenar,
  type Ejecucion,
  encolar,
  mensajeRechazoEntrega,
  type OpCola,
  opDe,
} from "@/lib/offline/cola";
import {
  almacenIndexedDB,
  hayIndexedDB,
  SinEspacioError,
} from "@/lib/offline/indexeddb";
import { type ErrorTarea, mensajeErrorTarea } from "@/lib/tareas-profe";

/* ---------- Estado compartido con los formularios ---------- */

let usuarioActual: string | null = null;
let ops: readonly OpCola[] = [];
const oyentes = new Set<() => void>();
const alDrenarOyentes = new Set<(d: Drenaje) => void>();

const avisar = () => {
  for (const o of oyentes) o();
};

let canal: BroadcastChannel | null = null;
function canalCola(): BroadcastChannel | null {
  if (canal || typeof BroadcastChannel === "undefined") return canal;
  canal = new BroadcastChannel("krea-cola");
  // Otra pestaña encoló, drenó o descartó: se relee
  canal.onmessage = () => void refrescar();
  return canal;
}

async function refrescar() {
  if (!hayIndexedDB()) return;
  try {
    ops = await almacenIndexedDB.todas();
  } catch {
    ops = [];
  }
  avisar();
}

function cambio() {
  canalCola()?.postMessage("cambio");
  return refrescar();
}

/** Cédula de la sesión (la pone `ColaOffline` desde el layout). Sin ella no se encola ni se drena. */
export function fijarUsuario(usuario: string | null) {
  usuarioActual = usuario;
  canalCola();
  void refrescar();
}

export function usuarioDeCola(): string | null {
  return usuarioActual;
}

function suscribir(o: () => void) {
  oyentes.add(o);
  return () => {
    oyentes.delete(o);
  };
}

/** La operación viva de esta clave (pendiente o rechazada) para la sesión actual. */
export function useOpCola(clave: string): OpCola | null {
  return useSyncExternalStore(
    suscribir,
    () => (usuarioActual ? opDe(ops, clave, usuarioActual) : null),
    () => null,
  );
}

/** Avisos del drenaje de ESTA pestaña (los toasts no se repiten en las otras). */
export function alDrenar(fn: (d: Drenaje) => void) {
  alDrenarOyentes.add(fn);
  return () => {
    alDrenarOyentes.delete(fn);
  };
}

/* ---------- Encolar y descartar ---------- */

export type ResultadoEncolar = "ok" | "sin-espacio" | "sin-cola";

/** Lo que pone el formulario; usuario, hora y estado los pone `encolarOp`. */
export type NuevaOp = OpCola extends infer T
  ? T extends OpCola
    ? Omit<T, "usuario" | "creadaEn" | "estado" | "motivo" | "mensaje">
    : never
  : never;

/**
 * Guarda la operación en IndexedDB (reemplaza la anterior de la misma clave). `sin-espacio`: la
 * cuota está llena (D295); `sin-cola`: no hay IndexedDB o no hay sesión conocida.
 */
export async function encolarOp(op: NuevaOp): Promise<ResultadoEncolar> {
  const usuario = usuarioActual;
  if (!usuario || !hayIndexedDB()) return "sin-cola";
  try {
    await encolar(almacenIndexedDB, {
      ...op,
      usuario,
      creadaEn: Date.now(),
      estado: "pendiente",
    } as OpCola);
  } catch (e) {
    return e instanceof SinEspacioError ? "sin-espacio" : "sin-cola";
  }
  // Que el navegador no la borre por falta de espacio (si lo concede)
  void navigator.storage?.persist?.().catch(() => false);
  await cambio();
  return "ok";
}

/** La persona leyó el aviso de una rechazada: se quita de la cola. */
export async function descartarOp(opId: string) {
  if (!hayIndexedDB()) return;
  try {
    await almacenIndexedDB.quitar(opId);
  } catch {
    // Sigue en la cola; el aviso volverá a salir
  }
  await cambio();
}

/* ---------- Drenar ---------- */

let pestana: string | null = null;

function candado(): Candado {
  if (typeof navigator !== "undefined" && navigator.locks) {
    return async <T>(fn: () => Promise<T>) => {
      let r: { valor: T } | null = null;
      // `ifAvailable`: si otra pestaña lo tiene, `lock` llega null y no se espera
      await navigator.locks.request(
        "krea-cola",
        { ifAvailable: true },
        async (lock) => {
          if (lock) r = { valor: await fn() };
        },
      );
      return r;
    };
  }
  try {
    pestana ??= crypto.randomUUID();
    return candadoPorArriendo(window.localStorage, pestana);
  } catch {
    return candadoEnMemoria();
  }
}

const enMemoria = candadoEnMemoria();

async function ejecutar(
  op: OpCola,
  guardarAvance: (op: OpCola) => Promise<void>,
): Promise<Ejecucion> {
  if (op.tipo === "tarea") {
    let r: ResultadoTareaCola;
    try {
      r = await guardarTareaPendiente({
        ...op.envio,
        opId: op.opId,
        usuario: op.usuario,
      });
    } catch {
      r = { ok: false, error: "red" };
    }
    return clasificar(
      "tarea",
      r,
      (e) => `No se pudo guardar: ${mensajeErrorTarea(e as ErrorTarea)}`,
    );
  }

  // Entrega: primero las imágenes (cada una guardada al subir: un reintento no la sube otra vez)
  let actual = op;
  for (const img of op.imagenes) {
    const form = new FormData();
    form.set("tareaId", op.tareaId);
    form.set("preguntaId", img.preguntaId);
    form.set("imagenId", img.imagenId);
    form.set("usuario", op.usuario);
    form.set("imagen", img.blob, "respuesta.jpg");
    let s: ResultadoSubidaCola;
    try {
      s = await subirImagenPendiente(form);
    } catch {
      s = { ok: false, error: "red" };
    }
    if (!s.ok) return clasificar("entrega", s, mensajeRechazoEntrega);
    // Varias imágenes en la misma pregunta (D373): se suman a las ya subidas
    const previas = rutasImagen(actual.respuestas[img.preguntaId]);
    actual = {
      ...actual,
      respuestas: {
        ...actual.respuestas,
        [img.preguntaId]:
          previas.length > 0
            ? { imagenPaths: [...previas, s.imagenPath] }
            : { imagenPath: s.imagenPath },
      },
      imagenes: actual.imagenes.filter((i) => i.imagenId !== img.imagenId),
    };
    await guardarAvance(actual);
  }
  let r: ResultadoEnvioCola;
  try {
    r = await enviarEntregaPendiente({
      tareaId: actual.tareaId,
      respuestas: actual.respuestas,
      opId: actual.opId,
      usuario: actual.usuario,
    });
  } catch {
    r = { ok: false, error: "red" };
  }
  return clasificar("entrega", r, mensajeRechazoEntrega);
}

/**
 * Drena lo pendiente de la sesión actual: al abrir la app, al volver la red y al volver a la
 * pestaña (Safari iOS no tiene Background Sync), y justo después de encolar. Una sola pestaña a
 * la vez (candado); dentro de la misma pestaña, una llamada a la vez (`enMemoria`).
 */
export async function drenarCola(): Promise<Drenaje | null> {
  const usuario = usuarioActual;
  if (!usuario || !hayIndexedDB()) return null;
  const r = await enMemoria(() =>
    drenar({
      almacen: almacenIndexedDB,
      candado: candado(),
      usuario,
      ejecutar,
    }),
  );
  if (!r?.valor.tomado) return null;
  await cambio();
  for (const fn of alDrenarOyentes) fn(r.valor);
  return r.valor;
}
