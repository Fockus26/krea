// Celebración del podio (D258): confeti una vez por sesión y por vista. Puro: sin React ni
// `sessionStorage` (el componente lee y escribe; aquí solo la decisión y las piezas, sin azar para
// que se pueda probar y no cambie entre servidor y cliente).

import type { Vista } from "./ranking-vista";

/** Clave de `sessionStorage`: una por vista, así Equipos también celebra la primera vez. */
export function claveConfeti(vista: Vista): string {
  return `krea-confeti-${vista}`;
}

/** Sin marca guardada (o ilegible) → toca celebrar. */
export function debeCelebrar(guardado: string | null): boolean {
  return guardado !== "visto";
}

export const MARCA_CONFETI = "visto";

/** Cuántas piezas lleva la lluvia y cuánto dura (ms) antes de desmontarse. */
export const CONFETI_PIEZAS = 30;
export const CONFETI_MS = 2600;

/** Colores del confeti: el acento y sus derivados (D001), nunca hex. */
export const CONFETI_COLORES = [
  "var(--accent)",
  "var(--accent-ink)",
  "var(--accent-soft-2)",
  "var(--secondary)",
] as const;

export type PiezaConfeti = {
  /** Posición horizontal de salida, % del ancho. */
  izq: number;
  /** Deriva horizontal al caer, en rem (negativa = a la izquierda). */
  deriva: number;
  /** Vueltas al caer, en grados. */
  giro: number;
  /** Retardo de salida, ms. */
  retardo: number;
  color: (typeof CONFETI_COLORES)[number];
};

/** `n` piezas repartidas por todo el ancho con una pseudo-dispersión fija (número áureo). */
export function piezasConfeti(n: number = CONFETI_PIEZAS): PiezaConfeti[] {
  const aureo = 0.618033988749895;
  return Array.from({ length: n }, (_, i) => {
    const t = (i * aureo) % 1;
    const u = (i * aureo * 2.3) % 1;
    return {
      izq: Math.min(
        100,
        Math.max(0, Math.round((i / n) * 100 + (t - 0.5) * 6)),
      ),
      deriva: Math.round((u - 0.5) * 12),
      giro: Math.round(240 + t * 480) * (i % 2 === 0 ? 1 : -1),
      retardo: Math.round(t * 500),
      color: CONFETI_COLORES[i % CONFETI_COLORES.length],
    };
  });
}
