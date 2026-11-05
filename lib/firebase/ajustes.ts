// Adaptadores del Admin SDK para Ajustes de puntos (fase 07 W7, D207). Sin `server-only` para que
// las pruebas de tests/rules los corran contra los emuladores; la app los usa solo desde
// lib/acciones/ajustes.ts, después de `exigirSesion("profesor")`.
//
// Un ajuste mueve puntos del ranking, nunca la nota (D007): se escribe el ajuste y
// `ranking/{seccion}` en la MISMA transacción (D175); ninguna entrega se toca.
import type { Firestore } from "firebase-admin/firestore";
import {
  type AplicarAjuste,
  armarAjuste,
  armarAnulacion,
  esAnulacion,
  idAnulacion,
  type ResultadoAjuste,
} from "@/lib/ajustes-datos";
import {
  conAjuste,
  escribirRankingEnTx,
  leerSeccionEnTx,
} from "@/lib/firebase/ranking";
import { COL, type SeccionId, zAjuste, zEquipo, zUsuario } from "@/lib/modelo";

/** Aplica un ajuste a un alumno o a un equipo y recalcula el ranking de su sección. */
export async function aplicarAjusteEnTransaccion(
  db: Firestore,
  autorId: string,
  entrada: AplicarAjuste,
  ahora: number,
): Promise<ResultadoAjuste> {
  const destinoRef =
    entrada.destino === "alumno"
      ? db.collection(COL.usuarios).doc(entrada.destinoId)
      : db.collection(COL.equipos).doc(entrada.destinoId);
  const ref = db.collection(COL.ajustes).doc();
  return db.runTransaction(async (tx): Promise<ResultadoAjuste> => {
    const snap = await tx.get(destinoRef);
    if (!snap.exists) return { ok: false, error: "no-existe" };
    let seccion: SeccionId;
    if (entrada.destino === "alumno") {
      const u = zUsuario.safeParse(snap.data());
      if (!u.success || u.data.rol !== "estudiante" || u.data.seccion === null)
        return { ok: false, error: "invalida" };
      seccion = u.data.seccion;
    } else {
      const e = zEquipo.safeParse(snap.data());
      if (!e.success) return { ok: false, error: "invalida" };
      seccion = e.data.seccion;
    }
    const datos = await leerSeccionEnTx(tx, db, seccion);
    const r = armarAjuste({ entrada, seccion, autorId, ahora });
    if (!r.ok) return r;
    tx.set(ref, r.ajuste);
    escribirRankingEnTx(
      tx,
      db,
      seccion,
      conAjuste(datos, { id: ref.id, ...r.ajuste }),
      ahora,
    );
    return { ok: true, id: ref.id };
  });
}

/**
 * Anula un ajuste con su inverso «Anulación» (D121; no se borra) y recalcula el ranking. La
 * anulación tiene id fijo (`idAnulacion`): si ya existe, el ajuste ya estaba anulado.
 */
export async function anularAjusteEnTransaccion(
  db: Firestore,
  autorId: string,
  ajusteId: string,
  ahora: number,
): Promise<ResultadoAjuste> {
  const ref = db.collection(COL.ajustes).doc(ajusteId);
  const inversaRef = db.collection(COL.ajustes).doc(idAnulacion(ajusteId));
  return db.runTransaction(async (tx): Promise<ResultadoAjuste> => {
    const [snap, inversa] = await Promise.all([
      tx.get(ref),
      tx.get(inversaRef),
    ]);
    if (!snap.exists) return { ok: false, error: "no-existe" };
    if (inversa.exists) return { ok: false, error: "anulado" };
    const a = zAjuste.safeParse(snap.data());
    if (!a.success) return { ok: false, error: "invalida" };
    if (esAnulacion(a.data)) return { ok: false, error: "invalida" };
    const datos = await leerSeccionEnTx(tx, db, a.data.seccion);
    // Un ajuste anulado por otra vía (p. ej. importado) tampoco se anula dos veces
    if (datos.ajustes.some((x) => x.anulaA === ajusteId))
      return { ok: false, error: "anulado" };
    const r = armarAnulacion({
      original: { id: ajusteId, ...a.data },
      autorId,
      ahora,
    });
    if (!r.ok) return r;
    tx.create(inversaRef, r.ajuste);
    escribirRankingEnTx(
      tx,
      db,
      a.data.seccion,
      conAjuste(datos, { id: inversaRef.id, ...r.ajuste }),
      ahora,
    );
    return { ok: true, id: inversaRef.id };
  });
}
