// Lógica pura del NumberStepper (HANDOFF §2.2; D004 pasos de 0,5; D006 base 10–20).

export const STEP_DEFAULT = 0.5;

export type StepRange = { min: number; max: number; step?: number };

/** Quita el ruido de punto flotante (0,1 + 0,2) sin cambiar valores legítimos. */
const limpiar = (n: number) => Math.round(n * 1e6) / 1e6;

/** Decimales que necesita un paso: 0,5 → 1 · 0,25 → 2 · 1 → 0. */
function decimales(step: number): number {
  let d = 0;
  while (d < 6 && Math.abs(limpiar(step * 10 ** d) % 1) > 1e-9) d++;
  return d;
}

/**
 * Lleva `n` al paso más cercano contando desde `min` y lo mantiene en [min, max].
 * Medios hacia arriba (17,25 → 17,5 con paso 0,5). No finito → `min`.
 */
export function snapToStep(
  n: number,
  { min, max, step = STEP_DEFAULT }: StepRange,
): number {
  if (!Number.isFinite(n)) return min;
  const fijado = Math.min(Math.max(n, min), max);
  const pasos = Math.floor((fijado - min) / step + 0.5 + 1e-9);
  return Math.min(limpiar(min + pasos * step), max);
}

/**
 * Lee lo que escribe la persona: acepta "17,5" y "17.5"; espacios alrededor permitidos.
 * Devuelve `null` si no es un número (vacío, letras, "1,2,3", "-").
 * Un solo separador decimal; no hay separador de miles (las notas no llegan a 1.000).
 */
export function parseDecimal(texto: string): number | null {
  const limpio = texto.trim();
  if (!/^-?\d+([.,]\d*)?$|^-?[.,]\d+$/.test(limpio)) return null;
  const n = Number(limpio.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** Formato es-VE para mostrar: coma decimal, sin separador de miles, solo los decimales del paso. */
export function formatDecimal(n: number, step: number = STEP_DEFAULT): string {
  const d = decimales(step);
  return limpiar(n).toLocaleString("es-VE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: d,
    useGrouping: false,
  });
}

/** Un paso arriba (+1) o abajo (−1), ajustado al paso y al rango. */
export function stepValue(
  actual: number,
  dir: 1 | -1,
  range: StepRange,
): number {
  const { step = STEP_DEFAULT } = range;
  const base = snapToStep(actual, range);
  return snapToStep(base + dir * step, range);
}

/** En el límite. `null` (sin valor) nunca lo está: − y + siguen activos para fijar el primero. */
export const atMin = (n: number | null, { min }: StepRange) =>
  n !== null && n <= min;
export const atMax = (n: number | null, { max }: StepRange) =>
  n !== null && n >= max;

/* ---------- Sin valor (`null`, D103): p. ej. una pregunta sin puntuar (D003) ---------- */

/** Texto que anuncia el campo sin valor (`aria-valuetext`). */
export const STEPPER_EMPTY_TEXT = "Sin puntuar";

/**
 * Primer −/+ (o ↑/↓) desde `null`: el valor parte de `min`, en las dos direcciones; así el
 * primer toque fija un valor que se ve y nunca inventa uno lejano. Con valor, un paso normal.
 */
export function stepFrom(
  actual: number | null,
  dir: 1 | -1,
  range: StepRange,
  /** Desde «sin valor», el punto de partida del primer −/+ (por defecto `min`, D103). */
  startAt?: number,
): number {
  if (actual !== null) return stepValue(actual, dir, range);
  return startAt === undefined ? range.min : stepValue(startAt, dir, range);
}

/** Lo que muestra el campo: vacío sin valor (nunca "0", D003); si no, con coma. */
export function stepperDisplay(
  value: number | null,
  step: number = STEP_DEFAULT,
): string {
  return value === null ? "" : formatDecimal(value, step);
}

/** Atributos ARIA del `spinbutton`: sin `aria-valuenow` cuando no hay valor. */
export function stepperAria(
  value: number | null,
  { min, max, step = STEP_DEFAULT }: StepRange,
  emptyText: string = STEPPER_EMPTY_TEXT,
  formatValueText?: (value: number) => string,
): {
  "aria-valuenow": number | undefined;
  "aria-valuemin": number;
  "aria-valuemax": number;
  "aria-valuetext": string;
} {
  return {
    "aria-valuenow": value ?? undefined,
    "aria-valuemin": min,
    "aria-valuemax": max,
    "aria-valuetext":
      value === null
        ? emptyText
        : formatValueText
          ? formatValueText(value)
          : formatDecimal(value, step),
  };
}
