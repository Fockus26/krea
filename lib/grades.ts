// Utilidades puras de nota (HANDOFF §1.3, D003, D004, D006, D007, D013).
// Sin React ni Firebase: se usan igual en cliente, servidor y pruebas.

/** Mínimo y máximo de la escala de notas (D004). */
export const NOTA_MIN = 1;
export const NOTA_MAX = 20;
/** Nota mínima que aporta puntos al ranking (D007). */
export const NOTA_APROBATORIA = 10;
/** Límites de la base de evaluación por alumno (D006). */
export const BASE_MIN = 10;
export const BASE_MAX = 20;

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

/** HSL (h en grados, s y l en %) a hex mayúsculo `#RRGGBB`. */
function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const lig = l / 100;
  const a = sat * Math.min(lig, 1 - lig);
  const channel = (k: number) => {
    const m = (k + h / 30) % 12;
    const v = lig - a * Math.max(-1, Math.min(m - 3, 9 - m, 1));
    return Math.round(v * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`.toUpperCase();
}

/**
 * Color de fondo de la píldora de nota: degradado continuo en HSL (HANDOFF §1.3),
 * igual en claro y oscuro. Devuelve hex `#RRGGBB` (coincide con la tabla del handoff).
 * Solo para notas numéricas: `null` (Pendiente) no tiene color (D003).
 * `n < 1` se trata como 1; `n > 20` como 20.
 */
export function gradeColor(n: number): string {
  const v = clamp(n, NOTA_MIN, NOTA_MAX);
  if (v <= 10) {
    const t = (v - 1) / 9;
    return hslToHex(52 * t, 100, 52 - 4 * t);
  }
  const t = (v - 10) / 10;
  return hslToHex(52 + 88 * t, 100 - 30 * t, 48 - 14 * t);
}

/** Nota para mostrar: coma decimal, 1 decimal máximo. `null` → "Pendiente" (D003). */
export function formatNota(n: number | null): string {
  if (n === null) return "Pendiente";
  const redondeada = Math.round(n * 10) / 10;
  return redondeada.toLocaleString("es-VE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
    useGrouping: false,
  });
}

const esMultiploDeMedio = (n: number) => Number.isInteger(n * 2);

/**
 * Nota final = puntaje × base / 20, a 1 decimal, mitad hacia arriba (D013).
 * Usa aritmética entera (en medios) para evitar errores de punto flotante:
 * 18,5 × 15 / 20 = 13,875 → 13,9.
 * `puntaje` null (sin evaluar) → null, nunca 0 (D003).
 * @throws RangeError si el puntaje no está en 0–20 en pasos de 0,5, o la base no está
 * en 10–20 en pasos de 0,5 (D004, D006).
 */
export function notaFinal(puntaje: number | null, base: number): number | null {
  if (!esMultiploDeMedio(base) || base < BASE_MIN || base > BASE_MAX) {
    throw new RangeError(`Base de evaluación inválida: ${base}`);
  }
  if (puntaje === null) return null;
  if (!esMultiploDeMedio(puntaje) || puntaje < 0 || puntaje > NOTA_MAX) {
    throw new RangeError(`Puntaje inválido: ${puntaje}`);
  }
  const p2 = Math.round(puntaje * 2);
  const b2 = Math.round(base * 2);
  // p2 * b2 / 80 = nota; en décimas y mitad hacia arriba: floor((p2*b2*10 + 40) / 80)
  const decimas = Math.floor((p2 * b2 + 4) / 8);
  return decimas / 10;
}

/** Puntos de ranking de una nota (D007): `null` o < 10 → 0; si no, la misma nota. */
export function puntosRanking(nota: number | null): number {
  if (nota === null || nota < NOTA_APROBATORIA) return 0;
  return nota;
}
