"use server";
// Server Actions de «Devolver al alumno» y «Eliminar entrega» (tanda 11-14 X1, D411–D415). Solo un
// profesor (`exigirSesion("profesor")`); cada una valida con zod y escribe la entrega y
// `ranking/{seccion}` en UNA transacción (`lib/data/devolver-entrega.ts`). Eliminar borra las
// imágenes de B2 DESPUÉS del commit (D396): si B2 falla, la entrega ya se borró y solo se registra.
import { refresh } from "next/cache";
import { almacenB2 } from "@/lib/almacen/b2";
import { borrarImagenes } from "@/lib/almacen/borrar-imagenes";
import { exigirSesion } from "@/lib/dal";
import {
  devolverEnTransaccion,
  eliminarEntregaEnTransaccion,
} from "@/lib/data/devolver-entrega";
import { baseDeDatos } from "@/lib/db";
import {
  type ResultadoDevolver,
  type ResultadoEliminarEntrega,
  zDevolverEntrega,
  zEliminarEntrega,
} from "@/lib/devolver-entrega";

export type { ResultadoDevolver, ResultadoEliminarEntrega };

function registrar(accion: string, e: unknown) {
  console.error(`[${accion}]`, (e as { code?: string }).code ?? "error");
}

/** Quita la evaluación y devuelve la entrega al alumno (solo con la tarea abierta). */
export async function devolverAlAlumno(
  entrada: unknown,
): Promise<ResultadoDevolver> {
  await exigirSesion("profesor");
  const db = baseDeDatos();
  if (!db) return { ok: false, error: "red" };
  const d = zDevolverEntrega.safeParse(entrada);
  if (!d.success) return { ok: false, error: "invalida" };
  try {
    const r = await devolverEnTransaccion(db, d.data, Date.now());
    if (r.ok) refresh();
    return r;
  } catch (e) {
    registrar("devolverAlAlumno", e);
    return { ok: false, error: "red" };
  }
}

/** Borra la entrega (respuestas, imágenes y nota) y recalcula el ranking. */
export async function eliminarEntrega(
  entrada: unknown,
): Promise<ResultadoEliminarEntrega> {
  await exigirSesion("profesor");
  const db = baseDeDatos();
  if (!db) return { ok: false, error: "red" };
  const d = zEliminarEntrega.safeParse(entrada);
  if (!d.success) return { ok: false, error: "invalida" };
  let imagenes: string[];
  let id: string;
  try {
    const r = await eliminarEntregaEnTransaccion(db, d.data, Date.now());
    if (!r.ok) return r;
    imagenes = r.imagenes;
    id = r.id;
  } catch (e) {
    registrar("eliminarEntrega", e);
    return { ok: false, error: "red" };
  }
  await borrarImagenes(almacenB2(), imagenes, "eliminarEntrega");
  // Sin `refresh()`: desde Evaluar, la página de esta entrega ya no existe (404) y el cliente
  // navega a la cola; desde la lista, el cliente refresca (components/sections/evaluar/acciones-entrega.tsx)
  return { ok: true, id };
}
