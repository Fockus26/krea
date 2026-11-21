"use server";
// Server Actions de la entrega ideal (tanda 11-14 Z2, D430–D435). Solo un profesor
// (`exigirSesion("profesor")`); validan con zod y escriben en `ideales` (lib/data/ideales.ts). No
// tocan entregas, notas ni ranking.
import { refresh } from "next/cache";
import { exigirSesion } from "@/lib/dal";
import { guardarIdealEnTransaccion, quitarIdeal } from "@/lib/data/ideales";
import { baseDeDatos } from "@/lib/db";
import { type ResultadoIdeal, zGuardarIdeal, zQuitarIdeal } from "@/lib/ideal";

export type { ResultadoIdeal };

function registrar(accion: string, e: unknown) {
  console.error(`[${accion}]`, (e as { code?: string }).code ?? "error");
}

/**
 * Guarda o reemplaza la ideal de la tarea (de una entrega con 20 / 20 o escrita por el profe). Con
 * la versión del formulario: si otro profe guardó o la quitó en medio, `cambio` (D532).
 */
export async function guardarIdeal(entrada: unknown): Promise<ResultadoIdeal> {
  const s = await exigirSesion("profesor");
  const db = baseDeDatos();
  if (!db) return { ok: false, error: "red" };
  const d = zGuardarIdeal.safeParse(entrada);
  if (!d.success) return { ok: false, error: "invalida" };
  try {
    const r = await guardarIdealEnTransaccion(db, s.uid, d.data, Date.now());
    // `cambio` (D532): la página pasa a lo de ahora; el formulario conserva lo escrito
    if (r.ok || r.error === "cambio") refresh();
    return r;
  } catch (e) {
    registrar("guardarIdeal", e);
    return { ok: false, error: "red" };
  }
}

/** Quita la ideal: los alumnos dejan de verla. */
export async function quitarIdealTarea(
  entrada: unknown,
): Promise<ResultadoIdeal> {
  await exigirSesion("profesor");
  const db = baseDeDatos();
  if (!db) return { ok: false, error: "red" };
  const d = zQuitarIdeal.safeParse(entrada);
  if (!d.success) return { ok: false, error: "invalida" };
  try {
    await quitarIdeal(db, d.data.tareaId);
    refresh();
    return { ok: true };
  } catch (e) {
    registrar("quitarIdeal", e);
    return { ok: false, error: "red" };
  }
}
