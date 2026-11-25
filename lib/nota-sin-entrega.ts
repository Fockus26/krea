// Poner nota sin entrega (D581): el profe pone el puntaje final de un alumno (individual) o de un
// equipo (grupal) que no entregó por la web — por ejemplo, la evaluación se hizo en papel —, sin
// respuestas ni puntaje por pregunta. La entrega queda evaluada y sin respuestas
// (`faltanRespuestas`): mientras la tarea siga abierta para ese titular, el alumno o el capitán
// las sube después y la nota se queda. Puro: lo comparten el diálogo y la Server Action.
import { z } from "zod";
import { zPuntaje, zTitularId } from "@/lib/modelo";
import { zIdTareaProfe } from "@/lib/tareas-profe-datos";

export const zPonerNotaSinEntrega = z.object({
  tareaId: zIdTareaProfe,
  /** Cédula (individual) o id del equipo (grupal), como en `idEntrega`. */
  titularId: zTitularId,
  /** Sobre 20, en pasos de 0,5 (D004); la nota sale con la base vigente de cada uno (D403). */
  puntaje: zPuntaje,
});
export type PonerNotaSinEntrega = z.infer<typeof zPonerNotaSinEntrega>;

export type ErrorNotaSinEntrega =
  /** La tarea no existe, es un borrador o no es de la sección del titular. */
  | "sin-tarea"
  /** El alumno o el equipo ya no existe (o no es de las secciones de la tarea). */
  | "no-existe"
  /**
   * El equipo no tiene integrantes a quienes ponerle la nota (vacío, o todos ya la tienen en otra
   * entrega de la tarea con su equipo anterior, D221).
   */
  | "sin-integrantes"
  /** Ya hay una entrega (la mandó mientras tanto): se corrige desde Evaluar. */
  | "ya-entregada"
  | "invalida"
  | "red";

export type ResultadoNotaSinEntrega =
  | { ok: true }
  | { ok: false; error: ErrorNotaSinEntrega };

export function errorNotaSinEntregaTexto(e: ErrorNotaSinEntrega): string {
  switch (e) {
    case "sin-tarea":
      return "La tarea ya no está publicada para esta sección.";
    case "no-existe":
      return "Este alumno o equipo ya no existe en las secciones de la tarea.";
    case "sin-integrantes":
      return "El equipo no tiene integrantes a quienes poner esta nota (o ya la tienen con su equipo anterior).";
    case "ya-entregada":
      return "Ya hay una entrega. Recarga la página y usa «Evaluar» o «Corregir».";
    case "invalida":
      return "El puntaje va de 0 a 20, en pasos de 0,5.";
    case "red":
      return "No pudimos guardar. Revisa tu conexión e inténtalo de nuevo.";
  }
}

/** Nombre accesible del botón de la fila: incluye a quién. */
export const ponerNotaLabel = (nombre: string) => `Poner nota a ${nombre}`;
