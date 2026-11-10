"use server";
// Server Actions de la pantalla Años y secciones (D318, D319): solo el profesor admin
// (`exigirAdmin`, D231), porque es la estructura de toda la escuela. Entrada validada con zod;
// la transformación del catálogo es pura (`lib/secciones.ts`) y la escritura, una transacción
// (`lib/data/secciones.ts`) que vuelve a comprobar que lo que se renombra o elimina esté vacío.
// Eliminar lo que ya no está responde `ok` (un doble clic no muestra un error).
import { refresh } from "next/cache";
import { z } from "zod";
import { exigirAdmin } from "@/lib/dal";
import { operarSeccionesEnTransaccion } from "@/lib/data/secciones";
import { baseDeDatos } from "@/lib/db";
import { LETRAS, zLetra, zNumeroAnio, zSeccion } from "@/lib/modelo";
import type { OperacionSecciones, ResultadoSecciones } from "@/lib/secciones";

const log = (donde: string, e: unknown) =>
  console.error(donde, (e as { code?: string }).code ?? "error");

const zCrearAnio = z.object({
  numero: zNumeroAnio,
  letras: z.array(zLetra).max(LETRAS.length),
});
const zEditarAnio = z.object({ de: zNumeroAnio, a: zNumeroAnio });
const zCrearSeccion = z.object({ numero: zNumeroAnio, letra: zLetra });
const zEditarSeccion = z.object({ codigo: zSeccion, letra: zLetra });

/** Corre la operación; `idempotente`: «ya no existe» cuenta como hecho (eliminar). */
async function operar(
  donde: string,
  op: OperacionSecciones,
  idempotente = false,
): Promise<ResultadoSecciones> {
  const db = baseDeDatos();
  if (!db) return { ok: false, error: "red" };
  try {
    const r = await operarSeccionesEnTransaccion(db, op, Date.now());
    if (!r.ok && idempotente && r.error === "no-existe") return { ok: true };
    return r;
  } catch (e) {
    log(donde, e);
    return { ok: false, error: "red" };
  }
}

/** Año nuevo (número 1–9 sin usar) con sus letras iniciales, que pueden ser ninguna. */
export async function crearAnio(entrada: unknown): Promise<ResultadoSecciones> {
  await exigirAdmin();
  const d = zCrearAnio.safeParse(entrada);
  if (!d.success) return { ok: false, error: "invalida" };
  const r = await operar("[crearAnio]", { tipo: "crearAnio", ...d.data });
  if (r.ok) refresh();
  return r;
}

/** Cambia el número del año: solo si todas sus secciones están vacías (D318). */
export async function editarAnio(
  entrada: unknown,
): Promise<ResultadoSecciones> {
  await exigirAdmin();
  const d = zEditarAnio.safeParse(entrada);
  if (!d.success) return { ok: false, error: "invalida" };
  const r = await operar("[editarAnio]", { tipo: "editarAnio", ...d.data });
  if (r.ok) refresh();
  return r;
}

/** Elimina el año y sus secciones: solo si todas están vacías (D318). */
export async function eliminarAnio(
  numero: unknown,
): Promise<ResultadoSecciones> {
  await exigirAdmin();
  const d = zNumeroAnio.safeParse(numero);
  if (!d.success) return { ok: false, error: "invalida" };
  const r = await operar(
    "[eliminarAnio]",
    { tipo: "eliminarAnio", numero: d.data },
    true,
  );
  if (r.ok) refresh();
  return r;
}

/** Sección nueva (letra sin usar) en un año que ya existe. */
export async function crearSeccion(
  entrada: unknown,
): Promise<ResultadoSecciones> {
  await exigirAdmin();
  const d = zCrearSeccion.safeParse(entrada);
  if (!d.success) return { ok: false, error: "invalida" };
  const r = await operar("[crearSeccion]", {
    tipo: "crearSeccion",
    ...d.data,
  });
  if (r.ok) refresh();
  return r;
}

/** Cambia la letra de una sección: solo si está vacía (D318). */
export async function editarSeccion(
  entrada: unknown,
): Promise<ResultadoSecciones> {
  await exigirAdmin();
  const d = zEditarSeccion.safeParse(entrada);
  if (!d.success) return { ok: false, error: "invalida" };
  const r = await operar("[editarSeccion]", {
    tipo: "editarSeccion",
    ...d.data,
  });
  if (r.ok) refresh();
  return r;
}

/** Elimina una sección: solo si está vacía (D318). */
export async function eliminarSeccion(
  codigo: unknown,
): Promise<ResultadoSecciones> {
  await exigirAdmin();
  const d = zSeccion.safeParse(codigo);
  if (!d.success) return { ok: false, error: "invalida" };
  const r = await operar(
    "[eliminarSeccion]",
    { tipo: "eliminarSeccion", codigo: d.data },
    true,
  );
  if (r.ok) refresh();
  return r;
}
