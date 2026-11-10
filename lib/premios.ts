// Textos y lógica de Premios del profesor (HANDOFF §3 Premios, §9 #3; lienzo design/canvas/Premios.dc.html).
// Lógica pura, sin React. La regla del ganador es la de Mi equipo (`ganadorPremio`): no se duplica.
import { ganadorPremio } from "@/lib/equipo";
import { formatFecha, formatFechaHora, vencida } from "@/lib/fecha";
import { formatNota } from "@/lib/grades";
import {
  type DecisionPremio,
  idDeDecision,
  type SeccionId,
  type TipoTareaId,
} from "@/lib/modelo";

/** PROVISIONAL (fila 146): ahora también hay premios en individuales (D263). */
export const PREMIOS_EYEBROW =
  "Los gana la mejor nota de cada tarea en cada sección";

/** Ruta del constructor para "Agregar premio" (fase 05): se edita el borrador. */
export function agregarPremioHref(tareaId: string): string {
  return `/profe/tareas/${tareaId}`;
}

export type NotaEquipo = { id: string; nota: number | null };

/**
 * Una tarjeta de Premios: una tarea en una sección (o el borrador, sin sección, D201). Grupal:
 * compiten equipos; individual: alumnos (D263). Los ids del estado son de equipo o de alumno.
 */
export type TarjetaPremio = {
  id: string;
  tarea: string;
  tareaId: string;
  /** Ausente en las vistas previas: grupal. */
  tipoTarea?: TipoTareaId;
  /** Texto (`listaSecciones`): «5A», «4B y 5A». */
  seccion: string;
  /** Sección donde se decide el empate; ausente en las vistas previas y en "por definir". */
  seccionId?: SeccionId;
  premio: string | null;
  /** Clave B2 de la foto (D265); la página la firma en `fotoUrl`. */
  premioFoto?: string | null;
  /** URL firmada de la foto, solo si se pudo firmar. */
  fotoUrl?: string;
  /** ¿Se puede editar el premio? (tarea no cerrada ni importada). */
  editable?: boolean;
  borrador: boolean;
  estado: EstadoPremio;
};

export type EstadoPremio =
  | { tipo: "ganado"; titularId: string; nota: number; fecha: string }
  | {
      tipo: "compartido";
      titularIds: readonly string[];
      nota: number;
      fecha: string;
    }
  | {
      tipo: "empate";
      titularIds: readonly string[];
      nota: number;
      fecha: string;
    }
  | {
      tipo: "en-juego";
      entregaron: number;
      total: number;
      vence: string;
      /** Hora de entrega de una abierta (D352); ausente = sin hora. */
      venceHora?: string;
      /** Una abierta cuya fecha y hora ya pasaron (D357); ausente si no se supo el instante. */
      vencida?: boolean;
    }
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
  /** Hora de entrega "HH:MM" de una abierta (D352). */
  hora?: string | null;
  /** Instante de la petición: «vence» / «venció» por fecha y hora (D357). */
  ahora?: number;
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
    const { fecha, hora, ahora } = tarea;
    return {
      tipo: "en-juego",
      entregaron: tarea.avance?.entregaron ?? 0,
      total: tarea.avance?.total ?? notas.length,
      vence: fecha ?? "",
      ...(hora ? { venceHora: hora } : {}),
      ...(fecha && ahora !== undefined
        ? { vencida: vencida(fecha, hora, ahora) }
        : {}),
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
      titularId: ganador,
      nota: mejor,
      fecha: tarea.fecha,
    };
  }
  return {
    tipo: "empate",
    titularIds: evaluadas.filter((n) => n.nota === mejor).map((n) => n.id),
    nota: mejor,
    fecha: tarea.fecha,
  };
}

/** La decisión guardada (D123, D124, D263): «dar» (equipo), «darAlumno» o «compartir». */
export type DecisionEmpate = DecisionPremio;

/** Decisión de dar el premio a un empatado: al equipo en una grupal, al alumno en una individual. */
export function decisionDar(
  tipoTarea: TipoTareaId,
  id: string,
): DecisionEmpate {
  return tipoTarea === "individual"
    ? { tipo: "darAlumno", alumnoId: id }
    : { tipo: "dar", equipoId: id };
}

/**
 * Resuelve un empate: lo da a uno de los empatados o lo declara compartido. Otro estado → igual.
 * Una decisión por alguien que ya no está entre los empatados (otra nota, o un alumno eliminado)
 * no cuenta: el empate queda por decidir.
 */
export function resolverEmpate(
  estado: EstadoPremio,
  decision: DecisionEmpate,
): EstadoPremio {
  if (estado.tipo !== "empate") return estado;
  const id = idDeDecision(decision);
  if (id === null) {
    return { ...estado, tipo: "compartido" };
  }
  if (!estado.titularIds.includes(id)) return estado;
  return {
    tipo: "ganado",
    titularId: id,
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

/**
 * "3 de 12 equipos entregaron · vence 30/10/2026" ("alumnos" en una individual), con la hora si
 * la tiene (D355) y "venció" si ya pasó (D357).
 */
export function avancePremioTexto(
  entregaron: number,
  total: number,
  vence: string,
  tipoTarea: TipoTareaId = "grupal",
  extra: { hora?: string | undefined; vencida?: boolean | undefined } = {},
): string {
  const venceTxt = vence
    ? ` · ${extra.vencida ? "venció" : "vence"} ${formatFechaHora(vence, extra.hora)}`
    : "";
  const quienes = tipoTarea === "individual" ? "alumnos" : "equipos";
  return `${entregaron} de ${total} ${quienes} entregaron${venceTxt}`;
}

/** Nombre corto de un titular para los chips: "G2" (equipo) o el primer nombre y apellido. */
export function nombreCortoTitular(
  tipoTarea: TipoTareaId | undefined,
  nombre: string,
): string {
  return tipoTarea === "individual" ? nombre : nombreCortoEquipo(nombre);
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
  return decision.tipo === "compartir"
    ? `Premio compartido: ${listaY(nombresCortos)}`
    : `Premio para ${nombreEquipo}`;
}

/* ---------- Crear y editar un premio (W11, D266) — copy PROVISIONAL (fila 147) ---------- */

export const CREAR_PREMIO_LABEL = "Crear premio";
export const EDITAR_PREMIO_TITULO = "Editar premio";

export function editarPremioLabel(premio: string): string {
  return `Editar el premio ${premio}`;
}

/** Línea del premio que ve el alumno en su tarea. */
export function premioParaTexto(tipoTarea: TipoTareaId): string {
  return tipoTarea === "individual"
    ? "Premio para la mejor nota de tu sección"
    : "Premio para el equipo con mejor nota";
}

/** Ayuda del campo premio (constructor y diálogo). */
export function ayudaPremio(tipoTarea: TipoTareaId): string {
  return tipoTarea === "individual"
    ? "Lo gana el alumno con mejor nota de cada sección."
    : "Lo gana el equipo con mejor nota de cada sección.";
}

export const SIN_ALMACEN_FOTO =
  "Las fotos no están disponibles: falta configurar el almacén de imágenes.";

export const SIN_TAREAS_PARA_PREMIO =
  "Todas las tareas abiertas y borradores ya tienen premio. Crea una tarea nueva para ponerle uno.";

export type ErrorPremio =
  | "no-existe"
  | "cerrada"
  | "invalida"
  | "foto-peso"
  | "foto-tipo"
  | "almacen"
  | "red";

export type ResultadoPremio = { ok: true } | { ok: false; error: ErrorPremio };

export function mensajeErrorPremio(error: ErrorPremio): string {
  switch (error) {
    case "no-existe":
      return "Esta tarea ya no existe. Recarga la página.";
    case "cerrada":
      return "La tarea ya está cerrada: su premio no se puede cambiar.";
    case "invalida":
      return "Revisa el premio: hay algo que no se pudo guardar.";
    case "foto-peso":
      return "La foto pesa demasiado. Prueba con otra imagen.";
    case "foto-tipo":
      return "No pudimos leer la foto. Prueba con una imagen JPG o PNG.";
    case "almacen":
      return "No se guardó la foto por un problema del portal, no de tu conexión. Inténtalo más tarde.";
    case "red":
      return "No se guardó: revisa tu conexión e inténtalo otra vez.";
  }
}

export const PREMIO_GUARDADO = "Premio guardado";
