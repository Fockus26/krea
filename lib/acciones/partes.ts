"use server";
// Server Actions de la grupal por partes (D416–D421, D461). La cédula sale SIEMPRE de la sesión
// (`exigirSesion`), nunca del body; a quién se asigna llega con su id público y la capa de datos
// lo traduce (D495). Solo en línea (D424): sin red, el cliente avisa con `red` y no
// encola nada; el envío de la tarea del capitán sigue yendo por la cola de siempre. Tras el commit
// se borran de B2 las imágenes que la parte dejó de usar (D396) y se refresca la página: el
// servidor es la fuente de lo aceptado (D463).
import { refresh } from "next/cache";
import { almacenB2 } from "@/lib/almacen/b2";
import type { Almacen } from "@/lib/almacen/s3";
import { exigirSesion } from "@/lib/dal";
import { accionParteEnTransaccion } from "@/lib/data/partes";
import { idPublico } from "@/lib/datos/id-publico";
import { baseDeDatos } from "@/lib/db";
import { comprobarImagenes } from "@/lib/entregas";
import { programarAvisoParte } from "@/lib/push-envio";
import {
  type AccionParte,
  type ErrorParte,
  zAsignarParte,
  zDecidirParte,
  zEntregarParte,
} from "@/lib/partes";

export type ResultadoParte = { ok: true } | { ok: false; error: ErrorParte };

/** Capitán: asigna la pregunta a un integrante, la reasigna o la quita (`asignado: null`). */
export async function asignarParte(entrada: unknown): Promise<ResultadoParte> {
  const e = zAsignarParte.safeParse(entrada);
  if (!e.success) return { ok: false, error: "incompleta" };
  const r = await ejecutar(e.data.tareaId, e.data.preguntaId, {
    tipo: "asignar",
    asignado: e.data.asignado,
  });
  if (r.ok) refresh();
  return r;
}

/** Capitán: acepta una parte entregada (pasa a precargar su formulario). */
export async function aceptarParte(entrada: unknown): Promise<ResultadoParte> {
  const e = zDecidirParte.safeParse(entrada);
  if (!e.success) return { ok: false, error: "incompleta" };
  const r = await ejecutar(e.data.tareaId, e.data.preguntaId, {
    tipo: "aceptar",
  });
  if (r.ok) refresh();
  return r;
}

/** Capitán: devuelve una parte entregada o aceptada para que el integrante la rehaga. */
export async function devolverParte(entrada: unknown): Promise<ResultadoParte> {
  const e = zDecidirParte.safeParse(entrada);
  if (!e.success) return { ok: false, error: "incompleta" };
  const r = await ejecutar(e.data.tareaId, e.data.preguntaId, {
    tipo: "devolver",
  });
  if (r.ok) refresh();
  return r;
}

/**
 * Capitán: «La respondo yo» (D461) con una parte asignada o devuelta. Sigue a nombre del
 * integrante, que queda premarcado «No participó» si no entregó ninguna otra (D420).
 */
export async function tomarParte(entrada: unknown): Promise<ResultadoParte> {
  const e = zDecidirParte.safeParse(entrada);
  if (!e.success) return { ok: false, error: "incompleta" };
  const r = await ejecutar(e.data.tareaId, e.data.preguntaId, {
    tipo: "tomar",
  });
  if (r.ok) refresh();
  return r;
}

/** Integrante asignado: entrega su respuesta al capitán (otra vez, mientras no esté aceptada). */
export async function entregarParte(entrada: unknown): Promise<ResultadoParte> {
  // Antes de tocar B2 (`verificarSesion` va en `cache`: `ejecutar` no vuelve a leerla)
  const sesion = await exigirSesion("estudiante");
  const e = zEntregarParte.safeParse(entrada);
  if (!e.success) return { ok: false, error: "incompleta" };
  const almacen = almacenB2();
  // Cada imagen tiene que estar en B2 antes de entregarla (como el envío, F-B3)
  const faltan = await comprobarImagenes(almacen, {
    [e.data.preguntaId]: e.data.respuesta,
  }).catch(() => "almacen" as const);
  if (faltan) return { ok: false, error: faltan };
  const r = await ejecutar(e.data.tareaId, e.data.preguntaId, {
    tipo: "entregar",
    respuesta: e.data.respuesta,
  });
  if (r.ok) {
    // Solo al entregar (no al aceptar ni devolver), tras el commit y sin bloquear (D535)
    programarAvisoParte({
      uid: sesion.uid,
      tareaId: e.data.tareaId,
      preguntaId: e.data.preguntaId,
    });
    refresh();
  }
  return r;
}

/** La transacción y, tras el commit, el borrado en B2. Quien llama refresca la página. */
async function ejecutar(
  tareaId: string,
  preguntaId: string,
  accion: AccionParte,
): Promise<ResultadoParte> {
  const sesion = await exigirSesion("estudiante");
  const db = baseDeDatos();
  if (!db) return { ok: false, error: "red" };
  try {
    const r = await accionParteEnTransaccion(
      db,
      sesion.uid,
      { tareaId, preguntaId, accion },
      Date.now(),
      idPublico,
    );
    if (!r.ok) return r;
    const almacen = almacenB2();
    if (r.sinUso && almacen) await borrarSinUso(almacen, r.sinUso);
    return { ok: true };
  } catch (e) {
    console.error("[partes]", (e as { code?: string }).code ?? "error");
    return { ok: false, error: "red" };
  }
}

/** Borra las imágenes que la parte dejó sin usar; un fallo solo se registra (D396). */
async function borrarSinUso(
  almacen: Pick<Almacen, "borrar">,
  claves: readonly string[],
): Promise<void> {
  const hechos = await Promise.all(
    claves.map((c) => almacen.borrar(c).catch(() => null)),
  );
  if (hechos.some((h) => !h?.ok))
    console.error("[partes] no se borró alguna imagen sin uso");
}
