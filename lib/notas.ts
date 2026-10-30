// Textos y lógica de Mis notas y Detalle de nota (HANDOFF §3; lienzos design/canvas/Notas.dc.html
// y DetalleNota.dc.html). Lógica pura, sin React.
import { formatFecha } from "@/lib/fecha";
import {
  formatNota,
  gradeColor,
  NOTA_APROBATORIA,
  NOTA_MAX,
  NOTA_MIN,
  puntosRanking,
} from "@/lib/grades";

export type FiltroNotas = "todas" | "individual" | "grupal";

export const FILTROS_NOTAS: ReadonlyArray<{
  valor: FiltroNotas;
  texto: string;
}> = [
  { valor: "todas", texto: "Todas" },
  { valor: "individual", texto: "Individuales" },
  { valor: "grupal", texto: "Grupales" },
];

/** Filtro del segmentado de Mis notas. Conserva el orden recibido. */
export function filtrarNotas<T extends { tipo: "individual" | "grupal" }>(
  filas: readonly T[],
  filtro: FiltroNotas,
): T[] {
  return filtro === "todas"
    ? [...filas]
    : filas.filter((f) => f.tipo === filtro);
}

/** Título de la lista según el filtro ("Todas las notas" en el lienzo). */
export function tituloLista(filtro: FiltroNotas): string {
  if (filtro === "individual") return "Notas individuales";
  if (filtro === "grupal") return "Notas grupales";
  return "Todas las notas";
}

/** Vacío de un filtro sin filas (sin notas en absoluto lo cubre el vacío del lienzo). */
export function vacioFiltroTexto(filtro: FiltroNotas): string {
  return filtro === "grupal"
    ? "Todavía no tienes notas grupales."
    : "Todavía no tienes notas individuales.";
}

/**
 * Meta de la fila: "evaluada el 21/10/2026" o, si está pendiente, "vence el 06/11/2026"
 * (lienzo Notas). `fecha`: día ISO de evaluación o de entrega.
 */
export function fechaNotaTexto(evaluada: boolean, fecha: string): string {
  return `${evaluada ? "evaluada el" : "vence el"} ${formatFecha(fecha)}`;
}

/**
 * Paradas del degradado de la leyenda, calculadas con `gradeColor` (D004: la fórmula manda,
 * no hay hex escritos). Una por nota entera de 1 a 20.
 */
export function escalaDegradado(): string {
  const paradas: string[] = [];
  for (let n = NOTA_MIN; n <= NOTA_MAX; n++) {
    const pct = ((n - NOTA_MIN) / (NOTA_MAX - NOTA_MIN)) * 100;
    paradas.push(`${gradeColor(n)} ${Math.round(pct * 10) / 10}%`);
  }
  return `linear-gradient(90deg, ${paradas.join(", ")})`;
}

/** Posición del 10 en la barra de la leyenda: 47,4 % (§3 Mis notas). */
export const MARCA_10_PCT =
  ((NOTA_APROBATORIA - NOTA_MIN) / (NOTA_MAX - NOTA_MIN)) * 100;

/** "18,5 / 20". */
export function puntajeTexto(puntaje: number): string {
  return `${formatNota(puntaje)} / ${formatNota(NOTA_MAX)}`;
}

/** "18,5 × 15 / 20 = 13,9" (D013). */
export function formulaBaseTexto(
  puntaje: number,
  base: number,
  final: number,
): string {
  return `${formatNota(puntaje)} × ${formatNota(base)} / ${formatNota(NOTA_MAX)} = ${formatNota(final)}`;
}

/** "+13,9 pts" si suma; "0 pts" si la nota es menor de 10 (D007). */
export function aporteTexto(final: number): string {
  const p = puntosRanking(final);
  return p > 0 ? `+${formatNota(p)} pts` : "0 pts";
}

/** Alerta de base (§3 Detalle). */
export function alertaBaseTexto(base: number): string {
  return `Por acuerdo de conducta tu nota se calcula sobre ${formatNota(base)}. Lo que lograste en cada pregunta no cambia.`;
}

/** "8 preguntas · 2 con comentario" (sin comentarios: solo las preguntas). */
export function preguntasResumenTexto(
  preguntas: number,
  conComentario: number,
): string {
  const p = `${preguntas} ${preguntas === 1 ? "pregunta" : "preguntas"}`;
  if (conComentario === 0) return p;
  return `${p} · ${conComentario} con comentario`;
}
