// Textos y lógica de Mi equipo (HANDOFF §3 Mi equipo; lienzo design/canvas/Equipo.dc.html).
// Lógica pura, sin React.
import { formatNota, notaFinal } from "@/lib/grades";
import {
  type DecisionPremio,
  type Entrega,
  idDeDecision,
  type SeccionId,
  type Usuario,
} from "@/lib/modelo";

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

/**
 * Quiénes ganan el premio: el de la mejor nota única o, con empate, lo que decidió el profe
 * (D123, D124, D201). Sin decisión, con empate, nadie (D086). Una decisión que ya no encaja
 * (cambió la mejor nota) no cuenta.
 */
export function ganadoresPremio(
  notas: ReadonlyArray<{ id: string; nota: number | null }>,
  decision?: DecisionPremio,
): string[] {
  const unico = ganadorPremio(notas);
  if (unico) return [unico];
  if (!decision) return [];
  const evaluadas = notas.filter(
    (n): n is { id: string; nota: number } => n.nota !== null,
  );
  if (evaluadas.length === 0) return [];
  const mejor = Math.max(...evaluadas.map((n) => n.nota));
  const empatados = evaluadas.filter((n) => n.nota === mejor).map((n) => n.id);
  const id = idDeDecision(decision);
  if (id === null) return empatados;
  return empatados.includes(id) ? [id] : [];
}

/**
 * Quiénes compiten por el premio de una tarea individual en una sección (D264): los alumnos de
 * la sección, cada uno con su nota final (puntaje × su base / 20, D006) si está evaluada; si no,
 * `null` (Pendiente, no compite). El ganador sale de `ganadorPremio` / `ganadoresPremio`, como en
 * las grupales. Un alumno que ya no existe no está en `alumnos` y no compite.
 */
export function notasPremioIndividual(
  tareaId: string,
  seccion: SeccionId,
  alumnos: ReadonlyArray<Pick<Usuario, "cedula" | "rol" | "seccion" | "base">>,
  entregas: ReadonlyArray<
    Pick<Entrega, "tareaId" | "tipo" | "titularId" | "estado" | "evaluacion">
  >,
): Array<{ id: string; nota: number | null }> {
  const evaluadas = new Map<string, number>();
  for (const e of entregas) {
    if (
      e.tareaId === tareaId &&
      e.tipo === "individual" &&
      e.estado === "evaluada" &&
      e.evaluacion
    ) {
      evaluadas.set(e.titularId, e.evaluacion.puntaje);
    }
  }
  return alumnos
    .filter((a) => a.rol === "estudiante" && a.seccion === seccion)
    .map((a) => {
      const puntaje = evaluadas.get(a.cedula);
      return {
        id: a.cedula,
        nota: puntaje === undefined ? null : notaFinal(puntaje, a.base),
      };
    });
}

/** Nombre accesible de la fila de integrante cuando es quien mira: "Yeilin Duarte, tú" (§8). */
export function nombreIntegranteTexto(nombre: string, esTu: boolean): string {
  return esTu ? `${nombre}, tú` : nombre;
}
