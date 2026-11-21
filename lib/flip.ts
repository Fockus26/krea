// Cálculo puro del FLIP (HANDOFF §6): qué elementos se desplazaron y cuánto, en X e Y.
// El hook `components/krea/use-flip.ts` mide, llama a esto y reproduce con transform.

/** Posición de un elemento (esquina superior izquierda), en el mismo origen para todos. */
export type PosicionFlip = { x: number; y: number };

/** Posición de cada elemento, por id. */
export type Posiciones = ReadonlyMap<string, PosicionFlip>;

/** Lo que hay que invertir en cada eje para que el elemento parezca seguir donde estaba. */
export type DeltaFlip = { dx: number; dy: number };

/** Menos de esto es ruido de subpíxeles, no un cambio de puesto. */
export const FLIP_UMBRAL_PX = 0.5;

/**
 * Desplazamiento a invertir por elemento: `anterior − nueva` en cada eje. Con ese
 * `translate(dx, dy)` inicial el elemento parece seguir donde estaba y, al animar a 0, viaja a su
 * sitio. El umbral es por eje: si solo uno se movió de verdad, el otro queda en 0 (no se arrastra
 * el ruido). Los nuevos (sin posición anterior) y los que no se movieron no entran: no tienen
 * nada que animar.
 */
export function flipDeltas(
  anterior: Posiciones,
  nueva: Posiciones,
  umbral: number = FLIP_UMBRAL_PX,
): Map<string, DeltaFlip> {
  const out = new Map<string, DeltaFlip>();
  for (const [id, p] of nueva) {
    const antes = anterior.get(id);
    if (antes === undefined) continue;
    const dx = antes.x - p.x;
    const dy = antes.y - p.y;
    const movX = Math.abs(dx) > umbral;
    const movY = Math.abs(dy) > umbral;
    if (movX || movY) out.set(id, { dx: movX ? dx : 0, dy: movY ? dy : 0 });
  }
  return out;
}

/**
 * Elementos que aparecen en esta medición y no estaban en la anterior (alta, quitar un filtro):
 * los que `useFlip({ entrada: true })` hace entrar con opacidad. En el orden de la lista nueva.
 */
export function idsNuevos(anterior: Posiciones, nueva: Posiciones): string[] {
  return [...nueva.keys()].filter((id) => !anterior.has(id));
}

/**
 * Elementos que estaban en la medición anterior y ya no están (eliminar, filtrar, mover a otra
 * zona): los que `useFlip({ salida: true })` despide con un fundido. En el orden de la anterior.
 */
export function idsQuitados(anterior: Posiciones, nueva: Posiciones): string[] {
  return [...anterior.keys()].filter((id) => !nueva.has(id));
}

/** "600ms" → 600, "0.6s" → 600, "0ms" → 0; lo que no sea un tiempo CSS → `fallback`. */
export function parseCssTime(valor: string, fallback = 0): number {
  const m = /^\s*(-?\d*\.?\d+)\s*(ms|s)\s*$/.exec(valor);
  if (!m) return fallback;
  const n = Number(m[1]);
  return m[2] === "s" ? n * 1000 : n;
}
