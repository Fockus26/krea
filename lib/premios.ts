// Textos y lógica de Premios del profesor (HANDOFF §3 Premios, §9 #3; lienzo design/canvas/Premios.dc.html).
// Lógica pura, sin React. La regla del ganador es la de Mi equipo (`ganadorPremio`): no se duplica.
import { ganadorPremio } from "@/lib/equipo";
import { formatFecha } from "@/lib/fecha";
import { formatNota } from "@/lib/grades";
import type { SeccionId } from "@/lib/modelo";

export const PREMIOS_EYEBROW =
  "Se asignan al equipo con mejor nota de cada tarea grupal";

/** Ruta del constructor para "Agregar premio" (fase 05): se edita el borrador. */
export function agregarPremioHref(tareaId: string): string {
  return `/profe/tareas/${tareaId}`;
}

export type NotaEquipo = { id: string; nota: number | null };

/** Una tarjeta de Premios: una tarea grupal en una sección (o el borrador, sin sección, D201). */
export type TarjetaPremio = {
  id: string;
  tarea: string;
  tareaId: string;
  /** Texto: "5A", "5A y 5C". */
  seccion: string;
  /** Sección donde se decide el empate; ausente en las vistas previas y en "por definir". */
  seccionId?: SeccionId;
  premio: string | null;
  borrador: boolean;
  estado: EstadoPremio;
};

export type EstadoPremio =
  | { tipo: "ganado"; equipoId: string; nota: number; fecha: string }
  | {
      tipo: "compartido";
      equipoIds: readonly string[];
      nota: number;
      fecha: string;
    }
  | {
      tipo: "empate";
      equipoIds: readonly string[];
      nota: number;
      fecha: string;
    }
  | { tipo: "en-juego"; entregaron: number; total: number; vence: string }
  | { tipo: "por-definir" };

export type EntradaPremio = {
  /** Estado de la tarea. */
  estado: "borrador" | "abierta" | "evaluada";
  /** Sin premio → "por definir". */
  premio?: string;
  /** Entrega (abierta) o evaluación (evaluada), día ISO. */
  fecha: string | null;
  /** Equipos que entregaron y total (abiertas). */
  avance?: { entregaron: number; total: number };
};

/**
 * Estado del premio de una tarea grupal. `notas` = notas grupales (sin base, D014) de los equipos que
 * compiten. Un borrador nunca tiene premio vigente: siempre "por definir".
 */
export function estadoPremio(
  tarea: EntradaPremio,
  notas: readonly NotaEquipo[],
): EstadoPremio {
  if (!tarea.premio || tarea.estado === "borrador") {
    return { tipo: "por-definir" };
  }
  if (tarea.estado === "abierta") {
    return {
      tipo: "en-juego",
      entregaron: tarea.avance?.entregaron ?? 0,
      total: tarea.avance?.total ?? notas.length,
      vence: tarea.fecha ?? "",
    };
  }
  const evaluadas = notas.filter(
    (n): n is { id: string; nota: number } => n.nota !== null,
  );
  if (evaluadas.length === 0 || !tarea.fecha) {
    return {
      tipo: "en-juego",
      entregaron: evaluadas.length,
      total: notas.length,
      vence: tarea.fecha ?? "",
    };
  }
  const mejor = Math.max(...evaluadas.map((n) => n.nota));
  const ganador = ganadorPremio(notas);
  if (ganador) {
    return {
      tipo: "ganado",
      equipoId: ganador,
      nota: mejor,
      fecha: tarea.fecha,
    };
  }
  return {
    tipo: "empate",
    equipoIds: evaluadas.filter((n) => n.nota === mejor).map((n) => n.id),
    nota: mejor,
    fecha: tarea.fecha,
  };
}

export type DecisionEmpate =
  | { tipo: "dar"; equipoId: string }
  | { tipo: "compartir" };

/** Resuelve un empate: lo da a uno de los empatados o lo declara compartido. Otro estado → igual. */
export function resolverEmpate(
  estado: EstadoPremio,
  decision: DecisionEmpate,
): EstadoPremio {
  if (estado.tipo !== "empate") return estado;
  if (decision.tipo === "compartir") {
    return { ...estado, tipo: "compartido" };
  }
  if (!estado.equipoIds.includes(decision.equipoId)) return estado;
  return {
    tipo: "ganado",
    equipoId: decision.equipoId,
    nota: estado.nota,
    fecha: estado.fecha,
  };
}

/** "5A-G2 Repostería" → "G2". Sin número de grupo, el nombre tal cual. */
export function nombreCortoEquipo(nombre: string): string {
  return /G\d+/.exec(nombre)?.[0] ?? nombre;
}

/** ["G2"] → "G2"; ["G2","G5"] → "G2 y G5"; tres → "G1, G2 y G5". */
export function listaY(items: readonly string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

/** "{tarea} · {sección}" ("{tarea} · borrador" si la tarea aún no se publicó). */
export function subtituloPremio(
  tarea: string,
  seccion: string,
  borrador: boolean,
): string {
  return `${tarea} · ${borrador ? "borrador" : seccion}`;
}

export function ganoTexto(nombreEquipo: string): string {
  return `Ganó ${nombreEquipo}`;
}

/** "nota 19 · 24/10/2026". */
export function notaFechaTexto(nota: number, fecha: string): string {
  return `nota ${formatNota(nota)} · ${formatFecha(fecha)}`;
}

/** "3 de 12 equipos entregaron · vence 30/10/2026". */
export function avancePremioTexto(
  entregaron: number,
  total: number,
  vence: string,
): string {
  const venceTxt = vence ? ` · vence ${formatFecha(vence)}` : "";
  return `${entregaron} de ${total} equipos entregaron${venceTxt}`;
}

export function empateChipTexto(nombresCortos: readonly string[]): string {
  return `Empate: ${listaY(nombresCortos)}`;
}

export function compartidoChipTexto(nombresCortos: readonly string[]): string {
  return `Compartido: ${listaY(nombresCortos)}`;
}

export function menuPremioLabel(premio: string): string {
  return `Opciones del premio ${premio}`;
}

export function darPremioLabel(nombreEquipo: string): string {
  return `Dar el premio a ${nombreEquipo}`;
}

export const COMPARTIR_LABEL = "Compartir el premio";

export function agregarPremioLabel(tarea: string): string {
  return `Agregar premio a ${tarea}`;
}

/** Aviso tras decidir un empate ("Premio para 5A-G2 Repostería" / "Premio compartido: G2 y G5"). */
export function decisionAviso(
  decision: DecisionEmpate,
  nombreEquipo: string,
  nombresCortos: readonly string[],
): string {
  return decision.tipo === "dar"
    ? `Premio para ${nombreEquipo}`
    : `Premio compartido: ${listaY(nombresCortos)}`;
}
