// Quién lee qué por las rutas de sondeo (D327). Lo que antes decían las reglas de Firestore para
// las lecturas del navegador; hoy el navegador solo lee por /api/ranking y /api/presencia. Puro.
import type { SeccionId } from "@/lib/modelo";
import { esCodigoSeccion } from "@/lib/secciones";
import type { Sesion } from "@/lib/sesion";

export type Acceso = "ok" | "sin-sesion" | "prohibido";

/** `ranking/{seccion}`: el profe, cualquier sección; el alumno, solo la suya. */
export function accesoRanking(
  sesion: Sesion | null,
  seccion: SeccionId,
): Acceso {
  if (!sesion || sesion.debeCambiarPassword) return "sin-sesion";
  if (!esCodigoSeccion(seccion)) return "prohibido";
  if (sesion.rol === "profesor") return "ok";
  return sesion.seccion === seccion ? "ok" : "prohibido";
}

/** Presencia en «Editar alumno» (D275): solo profesores; un alumno ni lee ni escribe. */
export function accesoPresencia(sesion: Sesion | null): Acceso {
  if (!sesion || sesion.debeCambiarPassword) return "sin-sesion";
  return sesion.rol === "profesor" ? "ok" : "prohibido";
}

export const ESTADO_HTTP: Record<Exclude<Acceso, "ok">, number> = {
  "sin-sesion": 401,
  // 404 y no 403: no se confirma que la sección exista
  prohibido: 404,
};
