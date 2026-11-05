// Adaptadores del Admin SDK para Evaluar (fase 07 W7, D204–D205). Sin `server-only` para que las
// pruebas de tests/rules los corran contra los emuladores; la app los usa solo desde
// lib/acciones/evaluar.ts, después de `exigirSesion("profesor")` (el autor sale de la sesión).
//
// Evaluar cambia puntos: la entrega y `ranking/{seccion}` se escriben en la MISMA transacción
// (D175), con la sección releída dentro (lib/firebase/ranking.ts).
import type { Firestore } from "firebase-admin/firestore";
import {
  armarEvaluacion,
  deshacerEvaluacion,
  entregaEvaluada,
  type GuardarEvaluacion,
  type ResultadoEvaluar,
} from "@/lib/evaluar-datos";
import {
  conEntrega,
  escribirRankingEnTx,
  leerSeccionEnTx,
} from "@/lib/firebase/ranking";
import { COL, zEntrega, zTareaDoc } from "@/lib/modelo";

/**
 * Guarda (o corrige) la evaluación de una entrega y recalcula el ranking de su sección. Evaluar
 * no depende del estado de la tarea (una cerrada se sigue evaluando, D202).
 */
export async function evaluarEnTransaccion(
  db: Firestore,
  autorId: string,
  envio: GuardarEvaluacion,
  ahora: number,
): Promise<ResultadoEvaluar> {
  const ref = db.collection(COL.entregas).doc(envio.entregaId);
  return db.runTransaction(async (tx): Promise<ResultadoEvaluar> => {
    const snap = await tx.get(ref);
    if (!snap.exists) return { ok: false, error: "no-existe" };
    const e = zEntrega.safeParse(snap.data());
    // Un documento que no valida no se pisa
    if (!e.success) return { ok: false, error: "invalida" };
    const entrega = e.data;
    const [tSnap, datos] = await Promise.all([
      tx.get(db.collection(COL.tareas).doc(entrega.tareaId)),
      leerSeccionEnTx(tx, db, entrega.seccion),
    ]);
    if (!tSnap.exists) return { ok: false, error: "no-existe" };
    const t = zTareaDoc.safeParse(tSnap.data());
    if (!t.success) return { ok: false, error: "invalida" };

    const r = armarEvaluacion({
      entrega,
      tarea: t.data,
      envio,
      autorId,
      ahora,
    });
    if (!r.ok) return r;
    const nueva = entregaEvaluada(entrega, r.evaluacion);
    tx.set(ref, nueva);
    escribirRankingEnTx(
      tx,
      db,
      entrega.seccion,
      conEntrega(datos, { id: ref.id, ...nueva }),
      ahora,
    );
    return { ok: true, id: ref.id, evaluadaEn: ahora };
  });
}

/** «Deshacer» la evaluación recién guardada (D205) y recalcular el ranking. */
export async function deshacerEvaluacionEnTransaccion(
  db: Firestore,
  autorId: string,
  entregaId: string,
  evaluadaEn: number,
  ahora: number,
): Promise<ResultadoEvaluar> {
  const ref = db.collection(COL.entregas).doc(entregaId);
  return db.runTransaction(async (tx): Promise<ResultadoEvaluar> => {
    const snap = await tx.get(ref);
    if (!snap.exists) return { ok: false, error: "no-existe" };
    const e = zEntrega.safeParse(snap.data());
    if (!e.success) return { ok: false, error: "invalida" };
    const datos = await leerSeccionEnTx(tx, db, e.data.seccion);
    const r = deshacerEvaluacion(e.data, evaluadaEn, autorId);
    if (!r.ok) return r;
    tx.set(ref, r.entrega);
    escribirRankingEnTx(
      tx,
      db,
      e.data.seccion,
      conEntrega(datos, { id: ref.id, ...r.entrega }),
      ahora,
    );
    return { ok: true, id: ref.id, evaluadaEn };
  });
}
