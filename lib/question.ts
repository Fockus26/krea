// Lógica pura de la tarjeta de pregunta (HANDOFF §2.11 barra, §2.16, D003). Sin React.
import type {
  AnswerImage,
  QuestionAnswer,
} from "@/components/krea/question-card-detail";
import { formatNota, gradeColor, NOTA_MAX } from "@/lib/grades";

/** Variante de la tarjeta: define el texto del valor de la cabecera (§2.16). */
export type QuestionVariant = "detalle" | "responder" | "evaluar";

/**
 * Máximos de caracteres de los campos de texto (contadores "/ 600" y "/ 300"). El campo y su
 * contador cuentan unidades UTF-16 (`maxLength`, `String.length`: un emoji cuenta 2); zod 4, en el
 * servidor, puntos de código (un emoji, 1), así que lo que el campo deja escribir siempre pasa (D446).
 */
export const ANSWER_MAX_LENGTH = 600;
export const COMMENT_MAX_LENGTH = 300;

/**
 * Texto del valor a la derecha de la cabecera: "3,5 / 4" en detalle, "vale 4" al evaluar,
 * "4 pts" al responder. En detalle sin nota (`obtenido` null) es "Pendiente · vale 4":
 * nunca "0 / 4" (D003).
 */
export function questionValueText(
  variant: QuestionVariant,
  valor: number,
  obtenido?: number | null,
): string {
  switch (variant) {
    case "detalle":
      return obtenido === null || obtenido === undefined
        ? `Pendiente · vale ${formatNota(valor)}`
        : `${formatNota(obtenido)} / ${formatNota(valor)}`;
    case "evaluar":
      return `vale ${formatNota(valor)}`;
    case "responder":
      return `${formatNota(valor)} pts`;
  }
}

export type QuestionBarModel = {
  /** Relleno de 0 a 1 (0 si está pendiente o el valor no es positivo). */
  fraction: number;
  /** Color de relleno `gradeColor(obtenido / valor × 20)`; `null` si no hay relleno. */
  color: string | null;
  /** Texto que acompaña siempre a la barra: "3,5 / 4" o "Pendiente" (D003). */
  text: string;
};

/** Datos de la barra por pregunta (§2.11). `obtenido` null → sin relleno y "Pendiente". */
export function questionBar(
  obtenido: number | null,
  valor: number,
): QuestionBarModel {
  if (obtenido === null) return { fraction: 0, color: null, text: "Pendiente" };
  const text = `${formatNota(obtenido)} / ${formatNota(valor)}`;
  if (valor <= 0) return { fraction: 0, color: null, text };
  const fraction = Math.min(1, Math.max(0, obtenido / valor));
  return {
    fraction,
    color: fraction > 0 ? gradeColor(fraction * NOTA_MAX) : null,
    text,
  };
}

/** Ancho del relleno en porcentaje (para `style.width`; no se anima). */
export function barWidth(fraction: number): string {
  return `${Math.round(fraction * 1000) / 10}%`;
}

/**
 * Texto alternativo de una respuesta en imagen: "Respuesta de Juana a la pregunta 3". Con varias
 * (D373): "Respuesta de Juana a la pregunta 3, imagen 1 de 2".
 */
export function answerImageAlt(
  nombre: string,
  numero: number,
  imagen?: { n: number; de: number },
): string {
  const base = `Respuesta de ${nombre} a la pregunta ${numero}`;
  return imagen && imagen.de > 1
    ? `${base}, imagen ${imagen.n} de ${imagen.de}`
    : base;
}

/**
 * Ayuda de una pregunta «Varias imágenes» (D373): "Hasta 2 imágenes · llevas 1.". PROVISIONAL
 * (CONTENT_CHECKLIST fila 190).
 */
export function imagenesAyuda(llevas: number, limite: number): string {
  const tope = `Hasta ${limite} imágenes`;
  if (llevas === 0) return `${tope}. Sube al menos una.`;
  if (llevas >= limite) return `${tope}: ya subiste ${llevas}.`;
  return `${tope} · llevas ${llevas}.`;
}

/** Aviso de la pregunta bloqueada para quien no es capitán (D012). */
export function lockedMessage(capitan: string): string {
  return `Solo ${capitan} puede responder.`;
}

/**
 * Imágenes de una respuesta ya firmadas (D195) → lo que pinta la tarjeta: una imagen, varias
 * (D373) o `null` si no se pudo firmar ninguna (la página pone su texto de respaldo). Las que no
 * se firmaron se saltan.
 */
export function respuestaFirmada(
  imagenes: ReadonlyArray<{ ruta: string; alt: string }>,
  urls: ReadonlyMap<string, string>,
): Exclude<QuestionAnswer, { tipo: "texto" }> | null {
  const firmadas: AnswerImage[] = imagenes.flatMap(({ ruta, alt }) => {
    const src = urls.get(ruta);
    return src ? [{ src, alt }] : [];
  });
  const [unica] = firmadas;
  if (!unica) return null;
  return imagenes.length === 1
    ? { tipo: "imagen", ...unica }
    : { tipo: "imagenes", imagenes: firmadas };
}

/** Rutas con su `alt` («…, imagen 1 de 2» si son varias, D373). */
export function imagenesConAlt(
  rutas: readonly string[],
  nombre: string,
  numero: number,
): Array<{ ruta: string; alt: string }> {
  return rutas.map((ruta, i) => ({
    ruta,
    alt: answerImageAlt(nombre, numero, { n: i + 1, de: rutas.length }),
  }));
}
