// Idempotencia de los envíos de la cola sin conexión (D293). Puro: el registro que guarda el
// servidor en `operaciones/{opId}` cuando una entrega o una tarea se escribe, y qué hacer cuando
// el mismo `opId` vuelve a llegar (reintento tras perder la respuesta, dos pestañas, la cola).
import { z } from "zod";

/** Id de la operación: un uuid que genera el teléfono al tocar «Entregar» o «Guardar». */
export const zOpId = z.uuid();

/**
 * Quién encoló la operación (cédula de la sesión de entonces, D294). Las acciones de la cola lo
 * comparan con la sesión de ahora: en un teléfono compartido, lo de un alumno no sale con la
 * sesión de otro. No da permisos: el uid que escribe sigue saliendo de la sesión.
 */
export const zQuien = z.object({ usuario: z.string().min(1).max(40) });

/** El registro vive 30 días (política TTL de Firestore sobre `expiraEn`, acción manual). */
export const OPERACION_VIGENCIA_MS = 30 * 24 * 60 * 60 * 1000;

export type TipoOperacion = "entrega" | "tarea";

const zOperacion = z.object({
  uid: z.string(),
  tipo: z.enum(["entrega", "tarea"]),
  /** Id del documento escrito (la tarea); `null` en la entrega. */
  id: z.string().nullable(),
  creadaEn: z.number(),
});

export type RegistroOperacion = z.infer<typeof zOperacion> & {
  expiraEn: Date;
};

export type OperacionPrevia =
  /** Nunca llegó: se procesa. */
  | { tipo: "nueva" }
  /** Ya se escribió: se devuelve el mismo resultado sin volver a escribir. */
  | { tipo: "repetida"; id: string | null }
  /** El id existe pero es de otra persona u otro tipo (o no valida): se rechaza. */
  | { tipo: "ajena" };

/** Qué dice el registro guardado (`undefined` = no hay) para este alumno o profe y este tipo. */
export function operacionPrevia(
  doc: unknown,
  uid: string,
  tipo: TipoOperacion,
): OperacionPrevia {
  if (doc === undefined) return { tipo: "nueva" };
  const r = zOperacion.safeParse(doc);
  if (!r.success || r.data.uid !== uid || r.data.tipo !== tipo)
    return { tipo: "ajena" };
  return { tipo: "repetida", id: r.data.id };
}

export function registroOperacion(
  uid: string,
  tipo: TipoOperacion,
  id: string | null,
  ahora: number,
): RegistroOperacion {
  return {
    uid,
    tipo,
    id,
    creadaEn: ahora,
    expiraEn: new Date(ahora + OPERACION_VIGENCIA_MS),
  };
}
