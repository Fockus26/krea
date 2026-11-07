// Catálogo de años y secciones con el Admin SDK (D317, D318). Sin `server-only` para que las
// pruebas de tests/rules lo corran contra los emuladores; la app lo usa solo desde
// lib/acciones/secciones.ts, después de `exigirAdmin()`.
//
// Cada operación es una transacción sobre `config/secciones` (ausente = `CATALOGO_INICIAL`; la
// primera escritura lo materializa). Renombrar o eliminar exige que los códigos que se van estén
// vacíos: se vuelve a comprobar aquí, dentro de la transacción, con una consulta `limit(1)` por
// colección, aunque la pantalla ya lo haya calculado. Al irse, su `ranking/{codigo}` se borra.
import type { Firestore, Transaction } from "firebase-admin/firestore";
import { COL, DOC_SECCIONES } from "@/lib/modelo";
import {
  anioDoc,
  aplicarOperacion,
  catalogoDeDocumento,
  codigosQueSeVan,
  type OperacionSecciones,
  type ResultadoSecciones,
} from "@/lib/secciones";

/** ¿Hay algo guardado con alguno de estos códigos? (`in` admite hasta 30: un año tiene ≤ 26). */
async function hayDatosEnTx(
  tx: Transaction,
  db: Firestore,
  codigos: readonly string[],
): Promise<boolean> {
  const lista = [...codigos];
  const consultas = [
    db.collection(COL.usuarios).where("seccion", "in", lista),
    db.collection(COL.equipos).where("seccion", "in", lista),
    db.collection(COL.tareas).where("secciones", "array-contains-any", lista),
    db.collection(COL.entregas).where("seccion", "in", lista),
    db.collection(COL.ajustes).where("seccion", "in", lista),
  ];
  const snaps = await Promise.all(consultas.map((q) => tx.get(q.limit(1))));
  return snaps.some((s) => !s.empty);
}

/**
 * Aplica la operación al catálogo guardado. Crear lo que ya existe responde el error («Ya existe
 * 5A») sin escribir; con datos, `con-datos` y nada cambia.
 */
export async function operarSeccionesEnTransaccion(
  db: Firestore,
  op: OperacionSecciones,
  ahora: number,
): Promise<ResultadoSecciones> {
  const ref = db.collection(COL.config).doc(DOC_SECCIONES);
  return db.runTransaction(async (tx): Promise<ResultadoSecciones> => {
    const snap = await tx.get(ref);
    const actual = catalogoDeDocumento(snap.exists, snap.data());
    if (!actual) {
      console.error(`[secciones] ${COL.config}/${DOC_SECCIONES} no valida`);
      return { ok: false, error: "invalida" };
    }
    const r = aplicarOperacion(actual, op);
    if (!r.ok) return r;
    const seVan = codigosQueSeVan(actual, op);
    if (seVan.length > 0 && (await hayDatosEnTx(tx, db, seVan)))
      return { ok: false, error: "con-datos" };
    tx.set(ref, { anios: anioDoc(r.catalogo), actualizadoEn: ahora });
    for (const codigo of seVan)
      tx.delete(db.collection(COL.ranking).doc(codigo));
    return { ok: true };
  });
}
