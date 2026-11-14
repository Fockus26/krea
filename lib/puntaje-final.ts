// Puntaje final de la tarea 1 (2026-11-10): la ÚNICA tarea en la que el profe pone la nota desde
// «Editar alumno», sin el puntaje de cada pregunta ni las respuestas, entregue o no el alumno.
// Las respuestas las sube después el alumno desde /tareas/<id> (ver `faltanRespuestas` en
// lib/entregas.ts). Ninguna otra tarea se edita desde la ficha.
import { z } from "zod";
import { zCedula, zPuntaje } from "@/lib/modelo";

/** La tarea que se hizo antes de la web («Identidad de marca»). */
export const TAREA_PUNTAJE_FINAL = "identidad-de-marca";

export const zPonerPuntajeFinal = z.object({
  cedula: zCedula,
  /**
   * Sobre 20, en pasos de 0,5 (D004); la nota sale con la base que ya tenía esa entrega o, si
   * no tenía, la vigente del alumno (D013, D403).
   */
  puntaje: zPuntaje,
});
export type PonerPuntajeFinal = z.infer<typeof zPonerPuntajeFinal>;

export type ErrorPuntajeFinal =
  /** La cédula no es de un estudiante con sección. */
  | "no-existe"
  /** La tarea no existe, no es individual o no es de su sección. */
  | "sin-tarea"
  | "invalida"
  | "red";

export type ResultadoPuntajeFinal =
  | { ok: true }
  | { ok: false; error: ErrorPuntajeFinal };

export function errorPuntajeFinalTexto(e: ErrorPuntajeFinal): string {
  switch (e) {
    case "no-existe":
      return "Este alumno ya no existe o no tiene sección.";
    case "sin-tarea":
      return "La tarea no está publicada para la sección de este alumno.";
    case "invalida":
      return "El puntaje va de 0 a 20, en pasos de 0,5.";
    case "red":
      return "No pudimos guardar. Revisa tu conexión e inténtalo de nuevo.";
  }
}
