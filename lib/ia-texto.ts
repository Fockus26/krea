// % orientativo de uso de IA en una respuesta de texto (tanda 11-14 Z1, D425–D429). Puro (sin
// Postgres, red ni React): la entrada de la Server Action, sus errores con su copy, el mínimo de
// palabras, la huella del texto, la validación del porcentaje y el estado que pinta Evaluar.
// El cliente de la API está en lib/ia/estimar-texto.ts (solo servidor); la tabla, en
// lib/data/analisis-ia.ts. Nada de esto entra en las vistas del estudiante (D429).
import { z } from "zod";
import { zIdDocumento } from "@/lib/evaluar-datos";

/** Por debajo de esto el número no dice nada: no se ofrece el análisis (D426). */
export const MIN_PALABRAS_IA = 40;
/** Tope de lo que viaja a la API: el mismo de una respuesta (`zRespuesta`, 5000). */
export const MAX_CARACTERES_IA = 5000;

/* ---------- Entrada de la Server Action ---------- */

export const zAnalizarTexto = z.object({
  entregaId: zIdDocumento,
  preguntaId: z.string().min(1).max(200),
});
export type AnalizarTexto = z.infer<typeof zAnalizarTexto>;

export type ErrorAnalisisIA =
  /** Sin `ANTHROPIC_API_KEY` (la página ya no lo ofrece; por si cambia en medio). */
  | "sin-configurar"
  | "corto"
  | "no-texto"
  | "no-existe"
  | "invalida"
  /** La API falló o respondió algo que no es un porcentaje. */
  | "servicio"
  /** No se pudo leer o guardar en la base. */
  | "red";

export type ResultadoAnalisisIA =
  | { ok: true; porcentaje: number; analizadoEn: number }
  | { ok: false; error: ErrorAnalisisIA };

/* ---------- Texto ---------- */

export function contarPalabras(texto: string): number {
  const t = texto.trim();
  return t ? t.split(/\s+/u).length : 0;
}

export function textoAnalizable(texto: string): boolean {
  return contarPalabras(texto) >= MIN_PALABRAS_IA;
}

/** El texto tal como viaja a la API: sin espacios de borde y recortado al tope. */
export function textoParaIA(texto: string): string {
  return texto.trim().slice(0, MAX_CARACTERES_IA);
}

/**
 * SHA-256 (hex) del texto que se analizó (`textoParaIA`). Si el alumno edita la respuesta (D395)
 * la huella cambia y el análisis guardado queda desactualizado. Web Crypto: corre en Node, Bun y
 * el navegador.
 */
export async function huellaTexto(texto: string): Promise<string> {
  const datos = new TextEncoder().encode(textoParaIA(texto));
  const hash = await crypto.subtle.digest("SHA-256", datos);
  return Array.from(new Uint8Array(hash), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

/**
 * El porcentaje que devolvió el modelo, como entero 0–100; `null` si no es un número o se sale
 * del rango (es un error del servicio, nunca un número inventado ni recortado al borde). Un
 * decimal dentro del rango se redondea.
 */
export function porcentajeValido(valor: unknown): number | null {
  if (typeof valor !== "number" || !Number.isFinite(valor)) return null;
  if (valor < 0 || valor > 100) return null;
  return Math.round(valor);
}

/* ---------- Estado en Evaluar ---------- */

export type AnalisisGuardado = {
  porcentaje: number;
  huella: string;
  analizadoEn: number;
};

export type EstadoAnalisisIA =
  | { tipo: "corto" }
  | { tipo: "sin-analisis" }
  | { tipo: "vigente"; porcentaje: number; analizadoEn: number }
  /** Hay uno, pero de un texto que el alumno ya cambió: no se muestra como vigente. */
  | { tipo: "desactualizado"; porcentaje: number };

export function estadoAnalisis(
  texto: string,
  huellaActual: string,
  guardado: AnalisisGuardado | null,
): EstadoAnalisisIA {
  if (!textoAnalizable(texto)) return { tipo: "corto" };
  if (!guardado) return { tipo: "sin-analisis" };
  if (guardado.huella !== huellaActual)
    return { tipo: "desactualizado", porcentaje: guardado.porcentaje };
  return {
    tipo: "vigente",
    porcentaje: guardado.porcentaje,
    analizadoEn: guardado.analizadoEn,
  };
}

/* ---------- Copy (PROVISIONAL, CONTENT_CHECKLIST filas 231–234) ---------- */

/** «37 %» (es-VE: espacio fino irrompible antes del signo). */
export function porcentajeTexto(n: number): string {
  return `${n} %`;
}

export const IA_TITULO = "Uso de IA";
export const IA_ORIENTATIVO = "orientativo";
export const IA_RESULTADO_TEXTO = "de probabilidad de uso de IA";
export const IA_AYUDA =
  "Lo estima un modelo de lenguaje: es una pista, no una prueba. Antes de concluir algo, conversa con el estudiante.";
export const IA_BOTON = "Analizar";
export const IA_BOTON_DE_NUEVO = "Analizar de nuevo";
export const IA_ANALIZANDO = "Analizando…";
export const IA_CORTO = `Texto muy corto para estimarlo (mínimo ${MIN_PALABRAS_IA} palabras).`;
export const IA_SIN_ANALISIS =
  "Estima qué tan probable es que esta respuesta se haya escrito con IA.";

export function iaDesactualizadoTexto(porcentaje: number): string {
  return `El estudiante cambió su respuesta después del último análisis (${porcentajeTexto(porcentaje)}).`;
}

/** Nombre accesible del botón: dice de qué pregunta es. */
export function iaBotonEtiqueta(numero: number, deNuevo: boolean): string {
  return `${deNuevo ? IA_BOTON_DE_NUEVO : IA_BOTON} con IA la respuesta de la pregunta ${numero}`;
}

export function errorAnalisisTexto(e: ErrorAnalisisIA): string {
  switch (e) {
    case "sin-configurar":
      return "El análisis con IA no está disponible ahora.";
    case "corto":
      return IA_CORTO;
    case "no-texto":
      return "Solo se analizan respuestas de texto.";
    case "no-existe":
      return "Esta entrega o pregunta ya no existe. Vuelve a la lista de entregas.";
    case "invalida":
      return "No se pudo analizar esta respuesta.";
    case "servicio":
      return "El servicio de IA no respondió bien. Intenta de nuevo en un momento.";
    case "red":
      return "No se pudo guardar el análisis. Revisa tu conexión e intenta de nuevo.";
  }
}
