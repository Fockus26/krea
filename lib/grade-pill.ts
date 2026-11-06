// Lógica pura de la píldora de nota (HANDOFF §2.3, D003, D004, D006). Sin React.
import { formatNota, NOTA_APROBATORIA, NOTA_MAX } from "@/lib/grades";

/**
 * `total`: la píldora de la tarjeta "Total en vivo" al evaluar (§3 Evaluar entrega: 88 × 64,
 * número 32; lienzo Evaluar.dc.html, `.gp-lg` con `min-width: 88px; height: 64px; font-size: 32px`).
 */
export type GradePillSize = "sm" | "md" | "lg" | "total" | "xl";

/** Estado visual: `null` es Pendiente (nunca 0, D003); < 10 es Raspado. */
export type GradePillState = "pendiente" | "raspado" | "normal";

export function gradePillState(nota: number | null): GradePillState {
  if (nota === null) return "pendiente";
  return nota < NOTA_APROBATORIA ? "raspado" : "normal";
}

/**
 * Cómo se avisa el Raspado junto a la píldora (§2.3): `chip` (Raspado + TriangleAlert, por
 * defecto), `icono` (modo tabla: TriangleAlert 16 con `aria-label="Raspada"`) o `ninguno`, cuando
 * el contexto ya dice que la nota no es definitiva o ya nombra el Raspado (D102).
 */
export type GradePillRaspado = "chip" | "icono" | "ninguno";

/** `raspado` explícito gana; si no, `table` → ícono (API de D040) y si no, chip. */
export function gradePillRaspado(
  raspado: GradePillRaspado | undefined,
  table: boolean,
): GradePillRaspado {
  return raspado ?? (table ? "icono" : "chip");
}

/**
 * Clases de la píldora con nota por tamaño (krea.css:249-257). El alto, el ancho mínimo y el
 * padding salen de la escala de Tailwind (4 px por paso): 26 = 6,5 · 32 = 8 · 44 = 11 · 64 = 16 ·
 * 88 = 22 · 104 = 26. El radio del xl (28) es `--r-grade-xl` (`rounded-grade-xl`). `total` lleva
 * el padding de lg (0 14, el lienzo parte de `.gp-lg`) y el número Poppins 700 32 (`text-grade-total`).
 */
export const GRADE_PILL_SIZE_CLASSES: Record<GradePillSize, string> = {
  sm: "h-6.5 min-w-11 px-2 text-grade-sm",
  md: "h-8 min-w-13 px-2.5 text-grade-md",
  lg: "h-11 min-w-18 px-3.5 text-grade-lg",
  total: "h-16 min-w-22 px-3.5 text-grade-total",
  xl: "h-26 min-w-[min(--spacing(37),100%)] max-w-full rounded-grade-xl px-6 text-grade-xl md:h-30",
};

/** Pendiente: mismo alto que su tamaño, sin ancho mínimo, Nunito 700 14 (xl: Poppins 24/32). */
export const GRADE_PILL_PENDING_CLASSES: Record<GradePillSize, string> = {
  sm: "h-6.5 px-2 text-label",
  md: "h-8 px-2.5 text-label",
  lg: "h-11 px-3.5 text-label",
  total: "h-16 px-3.5 text-label",
  xl: "h-26 rounded-grade-xl px-6 font-heading text-2xl font-bold md:h-30",
};

/** Texto accesible de la nota, p. ej. "Nota 18,5 de 20" (xl, §2.3). */
export function gradePillLabel(nota: number | null): string {
  if (nota === null) return "Nota pendiente";
  return `Nota ${formatNota(nota)} de ${NOTA_MAX}`;
}

/** ¿Lleva el chip `Base n`? Solo cuando la base del alumno no es 20 (D006, §2.3). */
export function showsBase(base: number | undefined): base is number {
  return base !== undefined && base !== NOTA_MAX;
}
