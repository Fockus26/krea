// Registro de operaciones de la cola sin conexión con el Admin SDK (D293). Sin `server-only`
// para que tests/rules lo pruebe contra los emuladores. Se lee al EMPEZAR la transacción (Firestore
// pide todas las lecturas antes de escribir) y se escribe en la misma, junto al documento.
import type {
  DocumentReference,
  Firestore,
  Transaction,
} from "firebase-admin/firestore";
import { COL } from "@/lib/modelo";
import {
  type OperacionPrevia,
  operacionPrevia,
  registroOperacion,
  type TipoOperacion,
} from "@/lib/offline/operacion";

export type Operacion = {
  ref: DocumentReference;
  previa: OperacionPrevia;
};

/** Lee `operaciones/{opId}` en la transacción. Sin `opId` (envío sin cola) no hay registro. */
export async function leerOperacionEnTx(
  db: Firestore,
  tx: Transaction,
  opId: string | undefined,
  uid: string,
  tipo: TipoOperacion,
): Promise<Operacion | null> {
  if (!opId) return null;
  const ref = db.collection(COL.operaciones).doc(opId);
  const snap = await tx.get(ref);
  return { ref, previa: operacionPrevia(snap.data(), uid, tipo) };
}

/** Deja el registro en la misma transacción que la escritura que lo justifica. */
export function registrarOperacionEnTx(
  tx: Transaction,
  op: Operacion | null,
  uid: string,
  tipo: TipoOperacion,
  id: string | null,
  ahora: number,
) {
  if (op) tx.set(op.ref, registroOperacion(uid, tipo, id, ahora));
}
