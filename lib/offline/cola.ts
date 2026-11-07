// Cola de envíos sin conexión (D292, D294, D295). Lógica pura: qué se guarda, en qué orden se
// drena, qué hace cada resultado y el candado entre pestañas. Sin IndexedDB ni `window`: el
// adaptador del navegador (`lib/offline/navegador.ts`) le pasa el almacén, el candado y quién
// ejecuta cada operación; las pruebas, dobles en memoria.
//
// Solo se encolan dos cosas (decisión de César, 2026-11-07): la entrega del alumno y crear o
// editar una tarea del profe. Lo demás que escribe no pasa por aquí.

/** Respuesta ya lista: texto, o imagen ya subida (ruta en B2). */
export type RespuestaCola = { texto: string } | { imagenPath: string };

/** Imagen elegida sin conexión: el Blob ya comprimido (`lib/image-entrada.ts`) hasta subirla. */
export type ImagenCola = {
  preguntaId: string;
  /** uuid del teléfono: la clave en B2 sale de él, así reintentar pisa el mismo objeto. */
  imagenId: string;
  blob: Blob;
};

type Base = {
  opId: string;
  /** Una operación viva por cosa: encolar de nuevo la misma reemplaza a la anterior. */
  clave: string;
  /** Cédula de quien la encoló: solo se drena con su sesión. */
  usuario: string;
  creadaEn: number;
  /** Título de la tarea, para los avisos. */
  titulo: string;
  estado: "pendiente" | "rechazada";
  /** Con `rechazada`: el motivo (código del servidor) y su texto. */
  motivo?: string;
  mensaje?: string;
};

export type OpEntrega = Base & {
  tipo: "entrega";
  tareaId: string;
  respuestas: Record<string, RespuestaCola>;
  /** Imágenes por subir; al subir cada una pasa a `respuestas` (avance parcial guardado). */
  imagenes: ImagenCola[];
};

export type OpTarea = Base & {
  tipo: "tarea";
  /** Lo mismo que manda el constructor a `guardarTarea` (sin `opId`, que va en la base). */
  envio: { id: string | null; accion: string; tarea: unknown };
};

export type OpCola = OpEntrega | OpTarea;

/** Lo que devuelve quien ejecuta una operación contra el servidor. */
export type Ejecucion =
  /** Entró (o ya había entrado: mismo `opId`). `id`: el de la tarea. */
  | { tipo: "hecha"; id?: string }
  /** El servidor la rechaza para siempre (tarea cerrada, ya evaluada…): no se reintenta. */
  | { tipo: "rechazada"; motivo: string; mensaje: string }
  /** Sin red o sin sesión: se para el drenaje y la operación sigue pendiente. */
  | { tipo: "esperar"; motivo: "red" | "sesion" };

export interface AlmacenCola {
  todas(): Promise<OpCola[]>;
  guardar(op: OpCola): Promise<void>;
  quitar(opId: string): Promise<void>;
}

/**
 * Corre `fn` solo si nadie más lo está corriendo (otra pestaña). `null` = el candado estaba
 * tomado y no se corrió.
 */
export type Candado = <T>(fn: () => Promise<T>) => Promise<{ valor: T } | null>;

/** Clave de la entrega: una por tarea y alumno (o capitán que la envía). */
export function claveEntrega(tareaId: string, usuario: string): string {
  return `entrega:${tareaId}:${usuario}`;
}

/** Clave de una tarea: la suya si ya existe; si es nueva, la del constructor abierto. */
export function claveTarea(id: string | null, local: string): string {
  return id ? `tarea:${id}` : `tarea-nueva:${local}`;
}

/** Pendientes de este usuario, en el orden en que se encolaron. */
export function pendientesDe(
  ops: readonly OpCola[],
  usuario: string,
): OpCola[] {
  return ops
    .filter((o) => o.usuario === usuario && o.estado === "pendiente")
    .sort((a, b) => a.creadaEn - b.creadaEn || (a.opId < b.opId ? -1 : 1));
}

/** La operación viva (pendiente o rechazada sin descartar) de esta clave, si hay. */
export function opDe(
  ops: readonly OpCola[],
  clave: string,
  usuario: string,
): OpCola | null {
  return ops.find((o) => o.clave === clave && o.usuario === usuario) ?? null;
}

/**
 * Encola: quita la operación anterior de la misma clave y usuario (la nueva la reemplaza: el
 * profe guardó dos veces sin red) y guarda la nueva.
 */
export async function encolar(almacen: AlmacenCola, op: OpCola): Promise<void> {
  const previas = (await almacen.todas()).filter(
    (o) => o.clave === op.clave && o.usuario === op.usuario,
  );
  for (const p of previas) if (p.opId !== op.opId) await almacen.quitar(p.opId);
  await almacen.guardar(op);
}

export type Drenaje = {
  /** `false`: otra pestaña estaba drenando y esta no hizo nada. */
  tomado: boolean;
  hechas: Array<{ op: OpCola; id?: string }>;
  rechazadas: OpCola[];
  /** Por qué se paró antes de terminar (la operación sigue pendiente). */
  detenido: "red" | "sesion" | null;
};

const SIN_DRENAR: Drenaje = {
  tomado: false,
  hechas: [],
  rechazadas: [],
  detenido: null,
};

/**
 * Drena las pendientes de `usuario` en orden, con el candado. Hecha → se quita. Rechazada →
 * queda marcada (el aviso y las respuestas siguen hasta que la persona la descarta). Sin red o
 * sin sesión → se para ahí: las siguientes esperan su turno (el orden se respeta). `ejecutar`
 * recibe `guardarAvance` para dejar escrito un éxito parcial (una imagen ya subida).
 */
export async function drenar(args: {
  almacen: AlmacenCola;
  candado: Candado;
  usuario: string;
  ejecutar: (
    op: OpCola,
    guardarAvance: (op: OpCola) => Promise<void>,
  ) => Promise<Ejecucion>;
}): Promise<Drenaje> {
  const { almacen, usuario, ejecutar } = args;
  const r = await args.candado(async (): Promise<Drenaje> => {
    const out: Drenaje = {
      ...SIN_DRENAR,
      tomado: true,
      hechas: [],
      rechazadas: [],
    };
    // Se relee dentro del candado: otra pestaña pudo drenar justo antes
    for (const op of pendientesDe(await almacen.todas(), usuario)) {
      let e: Ejecucion;
      try {
        e = await ejecutar(op, (avance) => almacen.guardar(avance));
      } catch {
        e = { tipo: "esperar", motivo: "red" };
      }
      if (e.tipo === "hecha") {
        await almacen.quitar(op.opId);
        out.hechas.push(e.id ? { op, id: e.id } : { op });
      } else if (e.tipo === "rechazada") {
        // Se relee: `ejecutar` pudo guardar avance (rutas de imágenes ya subidas)
        const actual =
          (await almacen.todas()).find((o) => o.opId === op.opId) ?? op;
        const marcada: OpCola = {
          ...actual,
          estado: "rechazada",
          motivo: e.motivo,
          mensaje: e.mensaje,
        };
        await almacen.guardar(marcada);
        out.rechazadas.push(marcada);
      } else {
        out.detenido = e.motivo;
        break;
      }
    }
    return out;
  });
  return r ? r.valor : SIN_DRENAR;
}

/* ---------- Candados ---------- */

/** Candado de una sola pestaña (pruebas, y respaldo si no hay nada mejor). */
export function candadoEnMemoria(): Candado {
  let ocupado = false;
  return async (fn) => {
    if (ocupado) return null;
    ocupado = true;
    try {
      return { valor: await fn() };
    } finally {
      ocupado = false;
    }
  };
}

/** Lo mínimo de `localStorage` que usa el arriendo (las pruebas pasan un doble). */
export type Registro = {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
};

/** Un drenaje no dura más que esto; pasado, el arriendo de una pestaña cerrada a medias vence. */
export const ARRIENDO_MS = 60_000;

/**
 * Candado entre pestañas sin Web Locks (Safari < 15.4): un arriendo en `localStorage` con dueño y
 * vencimiento. Escribe, relee y solo sigue si el dueño es él (la otra pestaña que escribió a la vez
 * pierde). No es perfecto (dos escrituras en el mismo instante), por eso el servidor es idempotente.
 */
export function candadoPorArriendo(
  registro: Registro,
  dueno: string,
  ahora: () => number = Date.now,
  clave = "krea-cola-candado",
): Candado {
  return async (fn) => {
    const leer = () => {
      try {
        const v = JSON.parse(registro.getItem(clave) ?? "null");
        return v && typeof v.dueno === "string" && typeof v.vence === "number"
          ? (v as { dueno: string; vence: number })
          : null;
      } catch {
        return null;
      }
    };
    const actual = leer();
    if (actual && actual.dueno !== dueno && actual.vence > ahora()) return null;
    registro.setItem(
      clave,
      JSON.stringify({ dueno, vence: ahora() + ARRIENDO_MS }),
    );
    if (leer()?.dueno !== dueno) return null;
    try {
      return { valor: await fn() };
    } finally {
      if (leer()?.dueno === dueno) registro.removeItem(clave);
    }
  };
}

/* ---------- Resultados del servidor → Ejecucion ---------- */

/** Errores de la entrega que no se arreglan reintentando (D294). */
const ENTREGA_RECHAZADA = new Set([
  "no-existe",
  "cerrada",
  "ya-entregada",
  "sin-equipo",
  "no-capitan",
  "incompleta",
  "imagen-tipo",
  "imagen-peso",
  "imagen-falta",
]);

/** Errores de la tarea que no se arreglan reintentando. */
const TAREA_RECHAZADA = new Set([
  "no-existe",
  "cerrada",
  "invalida",
  "fecha-pasada",
  "fecha-lejana",
]);

/**
 * Resultado de una Server Action → qué hace la cola. `red` y `almacen` (B2 caído un rato) se
 * reintentan; `sesion` espera a que entre de nuevo; los demás se rechazan con su texto.
 */
export function clasificar(
  tipo: OpCola["tipo"],
  r: { ok: true; id?: string } | { ok: false; error: string },
  mensaje: (error: string) => string,
): Ejecucion {
  if (r.ok) return r.id ? { tipo: "hecha", id: r.id } : { tipo: "hecha" };
  if (r.error === "sesion") return { tipo: "esperar", motivo: "sesion" };
  const rechazo = tipo === "entrega" ? ENTREGA_RECHAZADA : TAREA_RECHAZADA;
  if (rechazo.has(r.error))
    return { tipo: "rechazada", motivo: r.error, mensaje: mensaje(r.error) };
  return { tipo: "esperar", motivo: "red" };
}

/* ---------- Copy (PROVISIONAL, CONTENT_CHECKLIST filas 156–158) ---------- */

/** Fila 156: estado de una entrega o tarea encolada. */
export const PENDIENTE_TITULO = "Pendiente de enviar";
export const PENDIENTE_ENTREGA =
  "Tu entrega está guardada en este teléfono. Se enviará sola cuando vuelva la conexión.";
export const PENDIENTE_TAREA =
  "La tarea está guardada en este dispositivo. Se enviará sola cuando vuelva la conexión.";
export const IMAGEN_SIN_SUBIR =
  "Sin conexión: tus imágenes se subirán cuando entregues y vuelva la señal.";

/** Fila 157: avisos al encolar y al enviarse. */
export const TOAST_ENCOLADA_ENTREGA =
  "Sin conexión: tu entrega se enviará cuando vuelva la señal";
export const TOAST_ENCOLADA_TAREA =
  "Sin conexión: la tarea se enviará cuando vuelva la señal";
export function toastEnviada(op: OpCola): string {
  return op.tipo === "entrega"
    ? `Se envió tu entrega de «${op.titulo}»`
    : `Se guardó la tarea «${op.titulo}»`;
}
export const TOAST_SESION = "Entra de nuevo para enviar lo que quedó pendiente";

/** Fila 158: conflictos y falta de espacio. */
export function tituloRechazo(op: Pick<OpCola, "tipo">): string {
  return op.tipo === "entrega"
    ? "No se pudo enviar tu entrega"
    : "No se pudo guardar la tarea";
}
export function mensajeRechazoEntrega(error: string): string {
  switch (error) {
    case "cerrada":
      return "No se pudo enviar: la tarea ya cerró.";
    case "ya-entregada":
      return "No se pudo enviar: la tarea ya se entregó o ya fue evaluada.";
    case "no-existe":
      return "No se pudo enviar: la tarea ya no está disponible.";
    case "no-capitan":
    case "sin-equipo":
      return "No se pudo enviar: ahora solo el capitán de tu equipo puede entregar esta tarea.";
    default:
      return "No se pudo enviar: revisa tus respuestas y vuelve a entregar.";
  }
}
export const SIN_ESPACIO =
  "No hay espacio en este teléfono para guardar la entrega sin conexión. Libera espacio o espera a tener señal.";
export const SIN_ESPACIO_TAREA =
  "No hay espacio en este dispositivo para guardar la tarea sin conexión. Espera a tener señal.";
