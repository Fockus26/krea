"use server";
// Borrador compartido de una grupal (D544–D546). La cédula sale SIEMPRE de la sesión
// (`exigirSesion`), nunca del body. Solo el capitán guarda; los integrantes lo leen en la página
// y lo siguen por el sondeo de `/api/partes/version` (D547). Sin `refresh()`: lo que escribe no
// cambia la página del capitán (su formulario ya lo tiene) y el integrante refresca por la huella
// (excepción en tests/unit/cache-rutas.test.ts).
import {
  type ResultadoBorrador,
  zGuardarBorrador,
} from "@/lib/borrador-grupal";
import { exigirSesion } from "@/lib/dal";
import { guardarBorradorEnTransaccion } from "@/lib/data/borrador-grupal";
import { baseDeDatos } from "@/lib/db";

export type { ResultadoBorrador };

/** Guarda el borrador del equipo (rebote del formulario del capitán, D546). */
export async function guardarBorradorGrupal(
  entrada: unknown,
): Promise<ResultadoBorrador> {
  const sesion = await exigirSesion("estudiante");
  const db = baseDeDatos();
  if (!db) return { ok: false, error: "red" };
  const e = zGuardarBorrador.safeParse(entrada);
  if (!e.success) return { ok: false, error: "incompleta" };
  try {
    return await guardarBorradorEnTransaccion(
      db,
      sesion.uid,
      e.data,
      Date.now(),
    );
  } catch (err) {
    console.error(
      "[guardarBorradorGrupal]",
      (err as { code?: string }).code ?? "error",
    );
    return { ok: false, error: "red" };
  }
}
