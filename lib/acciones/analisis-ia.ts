"use server";
// Server Action del % orientativo de IA (tanda 11-14 Z1, D425–D429). Solo un profesor
// (`exigirSesion("profesor")`). Lee el texto de la respuesta en el servidor (nunca lo acepta del
// cliente), pide la estimación a la API (solo el texto viaja) y la guarda: una por respuesta.
import { refresh } from "next/cache";
import { exigirSesion } from "@/lib/dal";
import { guardarAnalisis, textoDeRespuesta } from "@/lib/data/analisis-ia";
import { baseDeDatos } from "@/lib/db";
import { estimarUsoIA, iaConfigurada } from "@/lib/ia/cliente";
import {
  huellaTexto,
  type ResultadoAnalisisIA,
  textoAnalizable,
  zAnalizarTexto,
} from "@/lib/ia-texto";

export type { ResultadoAnalisisIA };

function registrar(accion: string, e: unknown) {
  console.error(`[${accion}]`, (e as { code?: string }).code ?? "error");
}

/** Estima el % de uso de IA de una respuesta de texto y lo guarda (orientativo). */
export async function analizarTextoIA(
  entrada: unknown,
): Promise<ResultadoAnalisisIA> {
  const s = await exigirSesion("profesor");
  if (!iaConfigurada()) return { ok: false, error: "sin-configurar" };
  const db = baseDeDatos();
  if (!db) return { ok: false, error: "red" };
  const d = zAnalizarTexto.safeParse(entrada);
  if (!d.success) return { ok: false, error: "invalida" };
  const { entregaId, preguntaId } = d.data;

  let texto: string;
  try {
    const r = await textoDeRespuesta(db, entregaId, preguntaId);
    if (!r.ok) return r;
    texto = r.texto;
  } catch (e) {
    registrar("analizarTextoIA", e);
    return { ok: false, error: "red" };
  }
  if (!textoAnalizable(texto)) return { ok: false, error: "corto" };

  const estimacion = await estimarUsoIA(texto);
  if (!estimacion) return { ok: false, error: "sin-configurar" };
  if (!estimacion.ok) return { ok: false, error: "servicio" };

  const analizadoEn = Date.now();
  try {
    await guardarAnalisis(db, {
      entregaId,
      preguntaId,
      porcentaje: estimacion.porcentaje,
      huella: await huellaTexto(texto),
      modelo: estimacion.modelo,
      autorId: s.uid,
      analizadoEn,
    });
  } catch (e) {
    registrar("analizarTextoIA", e);
    return { ok: false, error: "red" };
  }
  refresh();
  return { ok: true, porcentaje: estimacion.porcentaje, analizadoEn };
}
