// El profe pasa a la web las respuestas de una entrega (carga de tareas viejas, 2026-11-10). Es un
// permiso TEMPORAL: para revocarlo basta con poner `PROFE_EDITA_RESPUESTAS` en `false` (la acción
// del servidor responde `cerrado` y Evaluar deja de ofrecer «Editar respuestas»). Ver las
// respuestas y corregir la nota desde Evaluar siguen igual. Puro: lo usan la acción, la página y
// las pruebas.
import { z } from "zod";
import { zIdDocumento } from "@/lib/evaluar-datos";

/** Interruptor del permiso temporal. `false` = el profe solo ve las respuestas. */
export const PROFE_EDITA_RESPUESTAS = true;

/** Tope de una respuesta de texto (el mismo de `zRespuesta`). */
export const RESPUESTA_MAX = 5000;

export const zEditarRespuestas = z.object({
  entregaId: zIdDocumento,
  /** Pregunta de texto → respuesta; vacía = sin respuesta. Las de imagen no se tocan. */
  respuestas: z.record(
    z.string().regex(/^[A-Za-z0-9_-]{1,40}$/, "Id inválido"),
    z.string().max(RESPUESTA_MAX),
  ),
});
export type EditarRespuestas = z.infer<typeof zEditarRespuestas>;

export type ErrorRespuestas =
  | "cerrado"
  | "invalida"
  | "no-existe"
  | "no-entregada"
  | "red";

export type ResultadoRespuestas =
  | { ok: true }
  | { ok: false; error: ErrorRespuestas };

export function errorRespuestasTexto(e: ErrorRespuestas): string {
  switch (e) {
    case "cerrado":
      return "La carga de respuestas ya no está habilitada.";
    case "no-existe":
      return "Esta entrega ya no existe.";
    case "no-entregada":
      return "El alumno todavía no entregó esta tarea.";
    case "invalida":
      return "Las respuestas no son válidas. Revísalas e inténtalo otra vez.";
    case "red":
      return "No se pudieron guardar las respuestas. Revisa tu conexión e inténtalo otra vez.";
  }
}

/**
 * Las respuestas que quedan: las de texto se reemplazan por lo escrito (vacío = se quita) y las
 * demás se quedan como estaban. `null` si se escribió en una pregunta que no es de texto.
 */
export function respuestasEditadas(
  previas: Readonly<Record<string, { texto: string } | { imagenPath: string }>>,
  preguntasTexto: ReadonlySet<string>,
  textos: Readonly<Record<string, string>>,
): Record<string, { texto: string } | { imagenPath: string }> | null {
  if (Object.keys(textos).some((id) => !preguntasTexto.has(id))) return null;
  const out = { ...previas };
  for (const [id, t] of Object.entries(textos)) {
    if (t.trim() === "") delete out[id];
    else out[id] = { texto: t.trim() };
  }
  return out;
}
