"use server";
// Server Actions de Ajustes de puntos (fase 07 W7, D175, D207). El autor sale SIEMPRE de la sesión
// (`exigirSesion("profesor")`), nunca del body; la sección, del documento del destino. Cada una
// valida con zod y escribe el ajuste y `ranking/{seccion}` en UNA transacción
// (`lib/data/ajustes.ts`). Nunca tocan una nota (D007).
import { refresh } from "next/cache";
import {
  type ResultadoAjuste,
  zAnularAjuste,
  zAplicarAjuste,
} from "@/lib/ajustes-datos";
import { exigirSesion } from "@/lib/dal";
import {
  anularAjusteEnTransaccion,
  aplicarAjusteEnTransaccion,
} from "@/lib/data/ajustes";
import { catalogoSecciones } from "@/lib/datos/secciones";
import { baseDeDatos } from "@/lib/db";
import { seccionesDe } from "@/lib/secciones";

export type { ResultadoAjuste };

function registrar(accion: string, e: unknown) {
  console.error(`[${accion}]`, (e as { code?: string }).code ?? "error");
}

/** Aplica un ajuste ± con motivo a un alumno o a un equipo. */
export async function aplicarAjuste(
  entrada: unknown,
): Promise<ResultadoAjuste> {
  const sesion = await exigirSesion("profesor");
  const db = baseDeDatos();
  if (!db) return { ok: false, error: "red" };
  const d = zAplicarAjuste.safeParse(entrada);
  if (!d.success) return { ok: false, error: "invalida" };
  try {
    // La sección del destino tiene que existir en el catálogo (D323)
    const r = await aplicarAjusteEnTransaccion(
      db,
      sesion.uid,
      d.data,
      Date.now(),
      seccionesDe(await catalogoSecciones()),
    );
    if (r.ok) refresh();
    return r;
  } catch (e) {
    registrar("aplicarAjuste", e);
    return { ok: false, error: "red" };
  }
}

/** Anula un ajuste con su inverso «Anulación» (D121). */
export async function anularAjuste(entrada: unknown): Promise<ResultadoAjuste> {
  const sesion = await exigirSesion("profesor");
  const db = baseDeDatos();
  if (!db) return { ok: false, error: "red" };
  const d = zAnularAjuste.safeParse(entrada);
  if (!d.success) return { ok: false, error: "invalida" };
  try {
    const r = await anularAjusteEnTransaccion(
      db,
      sesion.uid,
      d.data.ajusteId,
      Date.now(),
    );
    if (r.ok) refresh();
    return r;
  } catch (e) {
    registrar("anularAjuste", e);
    return { ok: false, error: "red" };
  }
}
