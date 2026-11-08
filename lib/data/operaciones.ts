// Registro de operaciones de la cola sin conexión sobre Postgres (D293, D327). Se lee dentro de la
// transacción, después de tomar el bloqueo de lo que se escribe (la tarea), y se escribe en la
// misma: un reintento con el mismo `opId` ve el registro y devuelve el mismo resultado.
import { eq, lt, sql } from "drizzle-orm";
import type { Tx } from "@/lib/db";
import { operaciones } from "@/lib/db/schema";
import {
  OPERACION_VIGENCIA_MS,
  type OperacionPrevia,
  operacionPrevia,
  registroOperacion,
  type TipoOperacion,
} from "@/lib/offline/operacion";

export type Operacion = { id: string; previa: OperacionPrevia };

/** Lee `operaciones/{opId}` con bloqueo. Sin `opId` (envío sin cola) no hay registro. */
export async function leerOperacionEnTx(
  tx: Tx,
  opId: string | undefined,
  uid: string,
  tipo: TipoOperacion,
): Promise<Operacion | null> {
  if (!opId) return null;
  const [f] = await tx
    .select({ datos: operaciones.datos })
    .from(operaciones)
    .where(eq(operaciones.id, opId))
    .for("update");
  return { id: opId, previa: operacionPrevia(f?.datos, uid, tipo) };
}

/**
 * Deja el registro en la misma transacción que la escritura que lo justifica, y borra los que ya
 * vencieron (en Firestore lo hacía una política TTL).
 */
export async function registrarOperacionEnTx(
  tx: Tx,
  op: Operacion | null,
  uid: string,
  tipo: TipoOperacion,
  id: string | null,
  ahora: number,
): Promise<void> {
  if (!op) return;
  const { expiraEn, ...r } = registroOperacion(uid, tipo, id, ahora);
  const datos = { ...r, expiraEn: expiraEn.getTime() };
  await tx
    .insert(operaciones)
    .values({ id: op.id, datos })
    .onConflictDoUpdate({ target: operaciones.id, set: { datos } });
  await tx
    .delete(operaciones)
    .where(
      lt(
        sql`(${operaciones.datos}->>'creadaEn')::bigint`,
        ahora - OPERACION_VIGENCIA_MS,
      ),
    );
}
