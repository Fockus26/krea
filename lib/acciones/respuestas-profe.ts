"use server";
// Server Action del permiso temporal de cargar respuestas (`lib/respuestas-profe`). El profe sale
// de la sesión (`exigirSesion("profesor")`); con el interruptor apagado responde `cerrado`.
import { refresh } from "next/cache";
import { exigirSesion } from "@/lib/dal";
import { editarRespuestasEnTransaccion } from "@/lib/data/respuestas-profe";
import { baseDeDatos } from "@/lib/db";
import {
  PROFE_EDITA_RESPUESTAS,
  type ResultadoRespuestas,
  zEditarRespuestas,
} from "@/lib/respuestas-profe";

export async function editarRespuestas(
  entrada: unknown,
): Promise<ResultadoRespuestas> {
  await exigirSesion("profesor");
  if (!PROFE_EDITA_RESPUESTAS) return { ok: false, error: "cerrado" };
  const db = baseDeDatos();
  if (!db) return { ok: false, error: "red" };
  const envio = zEditarRespuestas.safeParse(entrada);
  if (!envio.success) return { ok: false, error: "invalida" };
  try {
    const r = await editarRespuestasEnTransaccion(db, envio.data);
    if (r.ok) refresh();
    return r;
  } catch (e) {
    console.error(
      "[editarRespuestas]",
      (e as { code?: string }).code ?? "error",
    );
    return { ok: false, error: "red" };
  }
}
