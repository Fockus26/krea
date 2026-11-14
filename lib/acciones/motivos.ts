"use server";
// Server Actions de las opciones fijas de Ajustes de puntos (D375): cualquier profesor
// (`exigirSesion("profesor")`, no solo el admin: la lista es común y la cuida todo el equipo).
// Entrada validada con zod; la transformación es pura (`lib/motivos.ts`) y la escritura, una
// transacción con la fila bloqueada (`lib/data/motivos.ts`). El id de una opción nueva lo pone el
// servidor. Devuelven la lista nueva para que el diálogo la pinte sin esperar al refresco.
import { refresh } from "next/cache";
import { z } from "zod";
import { exigirSesion } from "@/lib/dal";
import { operarMotivosEnTransaccion } from "@/lib/data/motivos";
import { baseDeDatos } from "@/lib/db";
import {
  ETIQUETA_MAX,
  idMotivoNuevo,
  type OperacionMotivos,
  type ResultadoMotivos,
} from "@/lib/motivos";

const zOpcion = z.object({
  // Larga de más o vacía la rechaza `aplicarOperacionMotivos` con su error propio
  etiqueta: z.string().max(ETIQUETA_MAX * 4),
  valor: z.number(),
});
const zId = z.string().min(1).max(40);
const zEditar = zOpcion.extend({ id: zId });

async function operar(
  donde: string,
  op: OperacionMotivos,
): Promise<ResultadoMotivos> {
  const db = baseDeDatos();
  if (!db) return { ok: false, error: "red" };
  try {
    return await operarMotivosEnTransaccion(db, op, Date.now());
  } catch (e) {
    console.error(donde, (e as { code?: string }).code ?? "error");
    return { ok: false, error: "red" };
  }
}

/** Opción nueva al final de la lista. */
export async function crearMotivo(entrada: unknown): Promise<ResultadoMotivos> {
  await exigirSesion("profesor");
  const d = zOpcion.safeParse(entrada);
  if (!d.success) return { ok: false, error: "invalida" };
  const r = await operar("[crearMotivo]", {
    tipo: "crear",
    id: idMotivoNuevo(),
    ...d.data,
  });
  if (r.ok) refresh();
  return r;
}

/** Cambia la etiqueta y el valor propuesto (los ajustes ya hechos conservan la suya). */
export async function editarMotivo(
  entrada: unknown,
): Promise<ResultadoMotivos> {
  await exigirSesion("profesor");
  const d = zEditar.safeParse(entrada);
  if (!d.success) return { ok: false, error: "invalida" };
  const r = await operar("[editarMotivo]", { tipo: "editar", ...d.data });
  if (r.ok) refresh();
  return r;
}

/** Borra la opción; tiene que quedar al menos una. */
export async function borrarMotivo(id: unknown): Promise<ResultadoMotivos> {
  await exigirSesion("profesor");
  const d = zId.safeParse(id);
  if (!d.success) return { ok: false, error: "invalida" };
  const r = await operar("[borrarMotivo]", { tipo: "borrar", id: d.data });
  if (r.ok) refresh();
  return r;
}
