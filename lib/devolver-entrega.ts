// «Devolver al alumno» y «Eliminar entrega» (tanda 11-14 X1, D411–D415). Puro (sin Postgres ni
// React): la entrada de las Server Actions, sus errores con su copy, la entrega devuelta y los
// textos de los diálogos. Las transacciones están en lib/data/devolver-entrega.ts.
//
// Devolver quita la evaluación: la entrega vuelve a `entregada`, el alumno (o el capitán, D012) la
// puede editar otra vez (D395) y su puntaje sale del ranking. Solo con la tarea abierta (D411): una
// cerrada ya no se puede reenviar, así que devolverla dejaría la entrega sin nota y sin arreglo.
// Eliminar borra la fila entera (para duplicados), en cualquier estado de la tarea (D413).
import { z } from "zod";
import { zIdDocumento } from "@/lib/evaluar-datos";
import { type Entrega, type TareaDoc, zInstante } from "@/lib/modelo";

/* ---------- Entrada de las Server Actions ---------- */

export const zDevolverEntrega = z.object({
  entregaId: zIdDocumento,
  /** `evaluadaEn` de la evaluación que el profe veía: si cambió, no se toca (`cambio`, D224). */
  evaluadaEn: zInstante,
});
export type DevolverEntrega = z.infer<typeof zDevolverEntrega>;

export const zEliminarEntrega = z.object({
  entregaId: zIdDocumento,
  /** `enviadaEn` que el profe veía: si el alumno la reenvió, no se borra lo que no vio. */
  enviadaEn: zInstante.nullable(),
  /** `evaluadaEn` que el profe veía (`null` = sin evaluar): si otro la evaluó, no se borra. */
  evaluadaEn: zInstante.nullable(),
});
export type EliminarEntrega = z.infer<typeof zEliminarEntrega>;

export type ErrorDevolverEntrega =
  | "no-existe"
  | "invalida"
  /** La entrega cambió desde que el profe la abrió (otra nota, un reenvío). */
  | "cambio"
  /** Ya no tiene nota (otro la devolvió o deshizo la evaluación): no hay qué devolver. */
  | "no-evaluada"
  /** La tarea ya no está abierta (D411). */
  | "tarea-cerrada"
  | "red";

export type ResultadoDevolver =
  | { ok: true; id: string }
  | { ok: false; error: ErrorDevolverEntrega };

export type ResultadoEliminarEntrega =
  | { ok: true; id: string }
  | { ok: false; error: ErrorDevolverEntrega };

/** Toast o error de los diálogos. PROVISIONAL (CONTENT_CHECKLIST fila 221). */
export function errorDevolverTexto(e: ErrorDevolverEntrega): string {
  switch (e) {
    case "no-existe":
      return "Esta entrega ya no existe. Recarga la página.";
    case "cambio":
      return "La entrega cambió mientras tanto: otra persona la evaluó o el alumno la volvió a enviar. Recarga para ver la última.";
    case "no-evaluada":
      return "Esta entrega ya no tiene nota, así que no hay nada que devolver. Recarga la página.";
    case "tarea-cerrada":
      return "La tarea ya está cerrada: solo se puede devolver una entrega mientras la tarea siga abierta.";
    case "red":
      return "No se pudo completar. Revisa tu conexión e inténtalo de nuevo.";
    default:
      return "No se pudo completar. Recarga la página e inténtalo de nuevo.";
  }
}

/* ---------- Reglas ---------- */

/** ¿Se ofrece «Devolver»? La entrega tiene nota y la tarea sigue abierta (D411). */
export function puedeDevolver(
  entrega: Pick<Entrega, "estado">,
  /** Sin la tarea o sin su estado, no se ofrece. */
  tarea: { estado?: TareaDoc["estado"] } | null | undefined,
): boolean {
  return entrega.estado === "evaluada" && tarea?.estado === "abierta";
}

/**
 * Comprueba que se puede devolver la entrega que el profe veía. El orden importa para el mensaje:
 * sin nota → `no-evaluada`; otra nota → `cambio`; tarea cerrada → `tarea-cerrada`.
 */
export function comprobarDevolver(
  entrega: Pick<Entrega, "estado" | "evaluacion">,
  tarea: Pick<TareaDoc, "estado">,
  evaluadaEn: number,
): ErrorDevolverEntrega | null {
  if (entrega.estado !== "evaluada" || !entrega.evaluacion)
    return "no-evaluada";
  if (entrega.evaluacion.evaluadaEn !== evaluadaEn) return "cambio";
  if (tarea.estado !== "abierta") return "tarea-cerrada";
  return null;
}

/**
 * La entrega devuelta: `entregada`, sin evaluación y SIN `evaluacionAnterior` (D412): un «Deshacer»
 * que quedara en un toast viejo no debe resucitar la nota. Lo demás (respuestas, integrantes, lo
 * que otra unidad añada) viaja tal cual.
 */
export function devolverEntrega(entrega: Entrega): Entrega {
  const { evaluacionAnterior: _, ...resto } = entrega;
  return { ...resto, estado: "entregada", evaluacion: null };
}

/**
 * Comprueba que se puede borrar la entrega que el profe veía (D413): mismo envío y misma nota. Un
 * borrador del alumno no es una entrega para el profe (D196): `no-existe`.
 */
export function comprobarEliminar(
  entrega: Pick<Entrega, "estado" | "enviadaEn" | "evaluacion">,
  envio: Pick<EliminarEntrega, "enviadaEn" | "evaluadaEn">,
): ErrorDevolverEntrega | null {
  if (entrega.estado === "borrador") return "no-existe";
  if (entrega.enviadaEn !== envio.enviadaEn) return "cambio";
  if ((entrega.evaluacion?.evaluadaEn ?? null) !== envio.evaluadaEn)
    return "cambio";
  return null;
}

/* ---------- Textos de la UI (PROVISIONAL, CONTENT_CHECKLIST filas 218–222) ---------- */

/** A quién se refiere la acción: el alumno o el equipo. */
export type TitularAccion = {
  nombre: string;
  tipo: "individual" | "grupal";
  /** ¿Tiene nota? Cambia lo que se pierde al eliminar. */
  evaluada: boolean;
};

/** Nombre accesible del botón del menú de la fila (fila 218). */
export function masAccionesLabel(nombre: string): string {
  return `Más acciones de ${nombre}`;
}

/** Ítem del menú y botón de Evaluar (fila 218, D414). */
export function devolverTextoBoton(tipo: TitularAccion["tipo"]): string {
  return tipo === "grupal" ? "Devolver al equipo" : "Devolver al alumno";
}

export const ELIMINAR_TEXTO_BOTON = "Eliminar entrega";

export function devolverTitulo(t: Pick<TitularAccion, "nombre">): string {
  return `¿Devolver la entrega de ${t.nombre}?`;
}

/** Qué se pierde al devolver (fila 219). */
export function devolverDescripcion(
  t: Pick<TitularAccion, "nombre" | "tipo">,
): string {
  return t.tipo === "grupal"
    ? `Se borra la nota del equipo ${t.nombre} en esta tarea, para todos sus integrantes, y su puntaje sale del ranking. El capitán podrá editar y volver a entregar.`
    : `Se borra la nota de ${t.nombre} en esta tarea y su puntaje sale del ranking; podrá editar y volver a entregar.`;
}

export function eliminarTitulo(t: Pick<TitularAccion, "nombre">): string {
  return `¿Eliminar la entrega de ${t.nombre}?`;
}

/** Qué se pierde al eliminar (fila 220). */
export function eliminarDescripcion(t: TitularAccion): string {
  const que = t.evaluada
    ? "las respuestas, las imágenes y la nota"
    : "las respuestas y las imágenes";
  const ranking = t.evaluada ? " y su puntaje sale del ranking" : "";
  return t.tipo === "grupal"
    ? `Se borran ${que} del equipo ${t.nombre}, para todos sus integrantes${ranking}. No se puede deshacer.`
    : `Se borran ${que} de ${t.nombre}${ranking}. No se puede deshacer.`;
}

/** Toast al terminar (fila 222). */
export function devueltaTexto(nombre: string): string {
  return `Entrega devuelta a ${nombre}. Ya puede editarla y volver a entregar.`;
}

export function eliminadaTexto(nombre: string): string {
  return `Se eliminó la entrega de ${nombre}.`;
}

/** Con la tarea cerrada, por qué no está «Devolver» (fila 218, D411). */
export const DEVOLVER_SOLO_ABIERTAS =
  "«Devolver» solo está mientras la tarea sigue abierta: esta ya se cerró.";
