"use server";
// Server Actions de Evaluar (fase 07 W7, D175, D204–D205). El autor sale SIEMPRE de la sesión
// (`exigirSesion("profesor")`), nunca del body. Cada una valida con zod y escribe la entrega y
// `ranking/{seccion}` en UNA transacción de Postgres (`lib/data/evaluar.ts`).
import { refresh } from "next/cache";
import { exigirSesion } from "@/lib/dal";
import {
  deshacerEvaluacionEnTransaccion,
  evaluarEnTransaccion,
} from "@/lib/data/evaluar";
import { baseDeDatos } from "@/lib/db";
import {
  type ResultadoEvaluar,
  zDeshacerEvaluacion,
  zGuardarEvaluacion,
} from "@/lib/evaluar-datos";

export type { ResultadoEvaluar };

function registrar(accion: string, e: unknown) {
  console.error(`[${accion}]`, (e as { code?: string }).code ?? "error");
}

/** Guarda (o corrige) la evaluación de una entrega. */
export async function guardarEvaluacion(
  entrada: unknown,
): Promise<ResultadoEvaluar> {
  const sesion = await exigirSesion("profesor");
  const db = baseDeDatos();
  if (!db) return { ok: false, error: "red" };
  const envio = zGuardarEvaluacion.safeParse(entrada);
  if (!envio.success) return { ok: false, error: "invalida" };
  try {
    const r = await evaluarEnTransaccion(
      db,
      sesion.uid,
      envio.data,
      Date.now(),
    );
    if (r.ok) refresh();
    return r;
  } catch (e) {
    registrar("guardarEvaluacion", e);
    return { ok: false, error: "red" };
  }
}

/** «Deshacer» del toast: devuelve la evaluación anterior (o Pendiente). */
export async function deshacerEvaluacion(
  entrada: unknown,
): Promise<ResultadoEvaluar> {
  const sesion = await exigirSesion("profesor");
  const db = baseDeDatos();
  if (!db) return { ok: false, error: "red" };
  const d = zDeshacerEvaluacion.safeParse(entrada);
  if (!d.success) return { ok: false, error: "invalida" };
  try {
    const r = await deshacerEvaluacionEnTransaccion(
      db,
      sesion.uid,
      d.data.entregaId,
      d.data.evaluadaEn,
      Date.now(),
    );
    if (r.ok) refresh();
    return r;
  } catch (e) {
    registrar("deshacerEvaluacion", e);
    return { ok: false, error: "red" };
  }
}
