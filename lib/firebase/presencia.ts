// Presencia con el Admin SDK (W14, D275): al eliminar un alumno (D268) se borran las entradas de
// `presencia/{cedula}/editores`. Sin `server-only` para que tests/rules lo corra contra los
// emuladores; la app lo usa solo desde lib/acciones/alumnos.ts.
import type { Firestore } from "firebase-admin/firestore";
import { COL, SUBCOL_EDITORES } from "@/lib/modelo";

/** Borra la presencia de un alumno; devuelve cuántas entradas había. */
export async function borrarPresenciaAlumno(
  db: Firestore,
  cedula: string,
): Promise<number> {
  const snap = await db
    .collection(COL.presencia)
    .doc(cedula)
    .collection(SUBCOL_EDITORES)
    .get();
  if (snap.empty) return 0;
  // Una entrada por profe: cabe de sobra en un lote (≤ 500)
  const lote = db.batch();
  for (const d of snap.docs) lote.delete(d.ref);
  await lote.commit();
  return snap.size;
}
