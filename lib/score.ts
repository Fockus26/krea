// Lógica pura del ScorePicker (HANDOFF §2.12; D004 pasos de 0,5; D054–D055). Sin React.
import { formatDecimal, STEP_DEFAULT, snapToStep } from "@/lib/stepper";

/** Paso de evaluación (D004). */
export const SCORE_STEP = STEP_DEFAULT;
/** Hasta este valor de pregunta, un botón por paso (13 botones con 6); por encima, stepper (§2.12). */
export const SCORE_BUTTONS_MAX = 6;
/** Caducidad del búfer de teclado: pasado este tiempo sin teclas, se empieza un número nuevo. */
export const SCORE_BUFFER_MS = 1000;

export type ScoreMode = "buttons" | "stepper";

export function scoreMode(max: number): ScoreMode {
  return max <= SCORE_BUTTONS_MAX ? "buttons" : "stepper";
}

const range = (max: number) => ({ min: 0, max, step: SCORE_STEP });

/** Opciones de puntaje: 0 · 0,5 · … · `max` (`max` se lleva antes al paso de 0,5). */
export function scoreOptions(max: number): number[] {
  const tope = snapToStep(max, { min: 0, max: Math.max(max, 0) });
  const n = Math.round(tope / SCORE_STEP);
  return Array.from({ length: n + 1 }, (_, i) => i * SCORE_STEP);
}

/**
 * Los 5 atajos del modo stepper: 0 · ¼ · ½ · ¾ · valor, llevados al paso de 0,5 con
 * `snapToStep` (medios hacia arriba, como el stepper y la nota final D013):
 * ¼ de 7 = 1,75 → 2 · ¾ de 7 = 5,25 → 5,5 (D055).
 */
export function scoreShortcuts(max: number): number[] {
  return [0, 0.25, 0.5, 0.75, 1].map((f) => snapToStep(max * f, range(max)));
}

/** Texto visible de un puntaje: "3,5" (coma es-VE, sin decimales de más). */
export const scoreText = (n: number) => formatDecimal(n, SCORE_STEP);

/** Nombre accesible de un botón de puntaje: "1 punto", "3,5 puntos", "0 puntos". */
export function scoreLabel(n: number): string {
  return `${scoreText(n)} ${n === 1 ? "punto" : "puntos"}`;
}

/* ---------- Búfer de teclado (teclas 0–9 y `,`) ---------- */

export type ScoreBuffer = { text: string; at: number } | null;

export type ScoreKeyResult = {
  /** Búfer tras la tecla (se guarda para la siguiente). */
  buffer: ScoreBuffer;
  /** Valor que hay que fijar, o `null` si la tecla no cambia nada (rechazada). */
  value: number | null;
};

/** ¿Es una tecla que escribe puntaje? Dígitos y coma; el punto del teclado numérico cuenta como coma. */
export function isScoreKey(key: string): boolean {
  return /^[0-9]$/.test(key) || key === "," || key === ".";
}

/** Lee el texto del búfer ("3", "3,", "3,5") a número; `null` si no cae en el paso o se sale de [0, max]. */
function leer(text: string, max: number): number | null {
  const [entero, decimal = ""] = text.split(",");
  if (decimal.length > 1) return null;
  const n = Number(`${entero || "0"}.${decimal || "0"}`);
  if (!Number.isFinite(n) || n < 0 || n > max) return null;
  return Number.isInteger(n / SCORE_STEP) ? n : null;
}

/**
 * Aplica una tecla al búfer (D054). Reglas:
 * - Las teclas se van sumando al número mientras quepa: "1" → 1, "1" "7" → 17 (si la pregunta vale ≥ 17).
 * - Si el dígito hace que el número se pase del valor, empieza un número nuevo con ese dígito
 *   ("1" "7" con valor 4 → 7 no cabe → rechazado; "3" "2" con valor 4 → 2).
 * - `,` abre los decimales ("3" "," "5" → 3,5; "," al inicio = "0,"); una segunda coma se ignora.
 * - Tras la coma solo vale un dígito que caiga en el paso de 0,5 ("3,5", "3,0"); "3,2" se ignora.
 * - Pasados `timeoutMs` desde la última tecla aceptada, se empieza de cero.
 * Una tecla rechazada no cambia el búfer ni su hora: no alarga la caducidad.
 */
export function pushScoreKey(
  buffer: ScoreBuffer,
  key: string,
  max: number,
  now: number,
  timeoutMs: number = SCORE_BUFFER_MS,
): ScoreKeyResult {
  const rechazo: ScoreKeyResult = { buffer, value: null };
  if (!isScoreKey(key)) return rechazo;
  const tecla = key === "." ? "," : key;
  const vigente = buffer !== null && now - buffer.at <= timeoutMs;
  const previo = vigente ? buffer.text : "";

  if (tecla === ",") {
    if (previo.includes(",")) return rechazo;
    const text = `${previo || "0"},`;
    const value = leer(text, max);
    // "6," con valor 5,5 no cabe: nada que abrir
    if (value === null) return rechazo;
    return { buffer: { text, at: now }, value };
  }

  const junto = `${previo}${tecla}`;
  const value = leer(junto, max);
  if (value !== null) return { buffer: { text: junto, at: now }, value };
  // Con decimales no se reinicia: "3,2" es un error de tecleo, no un número nuevo
  if (previo.includes(",")) return rechazo;
  const solo = leer(tecla, max);
  if (solo === null) return rechazo;
  return { buffer: { text: tecla, at: now }, value: solo };
}
