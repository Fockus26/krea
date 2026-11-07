// Cálculo puro del FLIP del ranking (HANDOFF §6): qué filas se desplazaron y cuánto.
// El hook `components/krea/use-flip.ts` mide, llama a esto y reproduce con transform.

/** Posición vertical (en coordenadas de documento) de cada fila, por id. */
export type PosicionesY = ReadonlyMap<string, number>;

/** Menos de esto es ruido de subpíxeles, no un cambio de puesto. */
export const FLIP_UMBRAL_PX = 0.5;

/**
 * Desplazamiento a invertir por fila: `anterior − nueva`. Con ese `translateY` inicial la fila
 * parece seguir donde estaba y, al animar a 0, viaja a su sitio. Filas nuevas (sin posición
 * anterior) y las que no se movieron no entran: no tienen nada que animar.
 */
export function flipDeltas(
  anterior: PosicionesY,
  nueva: PosicionesY,
  umbral: number = FLIP_UMBRAL_PX,
): Map<string, number> {
  const out = new Map<string, number>();
  for (const [id, y] of nueva) {
    const antes = anterior.get(id);
    if (antes === undefined) continue;
    const d = antes - y;
    if (Math.abs(d) > umbral) out.set(id, d);
  }
  return out;
}

/**
 * Filas que aparecen en esta medición y no estaban en la anterior (alta, quitar un filtro): las
 * que `useFlip({ entrada: true })` hace entrar con opacidad. En el orden de la lista nueva.
 */
export function idsNuevos(anterior: PosicionesY, nueva: PosicionesY): string[] {
  return [...nueva.keys()].filter((id) => !anterior.has(id));
}

/** "600ms" → 600, "0.6s" → 600, "0ms" → 0; lo que no sea un tiempo CSS → `fallback`. */
export function parseCssTime(valor: string, fallback = 0): number {
  const m = /^\s*(-?\d*\.?\d+)\s*(ms|s)\s*$/.exec(valor);
  if (!m) return fallback;
  const n = Number(m[1]);
  return m[2] === "s" ? n * 1000 : n;
}
