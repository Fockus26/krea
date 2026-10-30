// Textos y lógica de Mi equipo (HANDOFF §3 Mi equipo; lienzo design/canvas/Equipo.dc.html).
// Lógica pura, sin React.
import { formatNota } from "@/lib/grades";

/** "Mi equipo · 5A". */
export function eyebrowEquipo(seccion: string): string {
  return `Mi equipo · ${seccion}`;
}

/** Chip de premio de una tarea grupal pendiente: "En juego: Salida al cine con todo pago". */
export function enJuegoTexto(premio: string): string {
  return `En juego: ${premio}`;
}

/** "Mejor nota en Logo y paleta de la marca · 19". */
export function premioGanadoTexto(tarea: string, nota: number): string {
  return `Mejor nota en ${tarea} · ${formatNota(nota)}`;
}

/**
 * Ganador del premio de una tarea: el equipo con la mejor nota, solo si es único. Con empate en
 * la mejor nota devuelve `null`: el profe elige o lo declara compartido (HANDOFF §9 #3, abierta).
 * Las notas `null` (Pendiente) no compiten.
 */
export function ganadorPremio(
  notas: ReadonlyArray<{ id: string; nota: number | null }>,
): string | null {
  const evaluadas = notas.filter(
    (n): n is { id: string; nota: number } => n.nota !== null,
  );
  if (evaluadas.length === 0) return null;
  const mejor = Math.max(...evaluadas.map((n) => n.nota));
  const empatados = evaluadas.filter((n) => n.nota === mejor);
  return empatados.length === 1 ? (empatados[0]?.id ?? null) : null;
}

/** Nombre accesible de la fila de integrante cuando es quien mira: "Yeilin Duarte, tú" (§8). */
export function nombreIntegranteTexto(nombre: string, esTu: boolean): string {
  return esTu ? `${nombre}, tú` : nombre;
}
