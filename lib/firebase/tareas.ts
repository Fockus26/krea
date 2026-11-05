// Adaptadores del Admin SDK para las tareas del profe (D199–D202). Sin `server-only` para que las
// pruebas de tests/rules los corran contra los emuladores; la app los usa solo desde
// lib/acciones/tareas.ts, después de `exigirSesion("profesor")` (el autor sale de la sesión).
//
// Ninguna de estas escrituras cambia puntos: solo una entrega evaluada aporta al ranking (D007) y
// un premio no da puntos. Por eso `ranking/{seccion}` no se recalcula aquí (lo hace W7 al evaluar).
import { FieldPath, type Firestore } from "firebase-admin/firestore";
import {
  COL,
  type DecisionPremio,
  type SeccionId,
  zEntrega,
  zEquipo,
  zTareaDoc,
} from "@/lib/modelo";
import {
  armarTarea,
  estadoPremioSeccion,
  type GuardarTarea,
  puedeCerrar,
  type ResultadoTarea,
} from "@/lib/tareas-profe-datos";

/**
 * Guarda, publica o edita una tarea en UNA transacción: lee la tarea y si ya tiene entregas
 * (congela su estructura, D200) y escribe el documento que arma `armarTarea`.
 */
export async function guardarTareaEnTransaccion(
  db: Firestore,
  autorId: string,
  envio: GuardarTarea,
  hoy: string,
  ahora: number,
): Promise<ResultadoTarea> {
  const tareas = db.collection(COL.tareas);
  return db.runTransaction(async (tx): Promise<ResultadoTarea> => {
    const ref = envio.id ? tareas.doc(envio.id) : tareas.doc();
    let previa = null;
    let conEntregas = false;
    if (envio.id) {
      const snap = await tx.get(ref);
      if (!snap.exists) return { ok: false, error: "no-existe" };
      const p = zTareaDoc.safeParse(snap.data());
      // Un documento que no valida no se pisa
      if (!p.success) return { ok: false, error: "invalida" };
      previa = p.data;
      const q = await tx.get(
        db.collection(COL.entregas).where("tareaId", "==", envio.id).limit(1),
      );
      conEntregas = !q.empty;
    }
    const r = armarTarea({
      entrada: envio.tarea,
      accion: envio.accion,
      previa,
      conEntregas,
      autorId,
      hoy,
      ahora,
    });
    if (!r.ok) return r;
    tx.set(ref, r.tarea);
    return { ok: true, id: ref.id };
  });
}

/** Cierra una tarea abierta (`evaluada`, D202): deja de recibir entregas (D196). */
export async function cerrarTareaEnTransaccion(
  db: Firestore,
  id: string,
  ahora: number,
): Promise<ResultadoTarea> {
  const ref = db.collection(COL.tareas).doc(id);
  return db.runTransaction(async (tx): Promise<ResultadoTarea> => {
    const snap = await tx.get(ref);
    if (!snap.exists) return { ok: false, error: "no-existe" };
    const p = zTareaDoc.safeParse(snap.data());
    if (!p.success) return { ok: false, error: "invalida" };
    if (!puedeCerrar(p.data)) return { ok: false, error: "cerrada" };
    tx.update(ref, { estado: "evaluada", actualizadoEn: ahora });
    return { ok: true, id };
  });
}

/**
 * Decide el empate del premio de una sección (D123, D124): solo si la tarea está cerrada, tiene
 * premio y hay empate ahora mismo entre los equipos de esa sección; «dar» solo a un empatado.
 */
export async function decidirPremioEnTransaccion(
  db: Firestore,
  tareaId: string,
  seccion: SeccionId,
  decision: DecisionPremio,
  ahora: number,
): Promise<ResultadoTarea> {
  const ref = db.collection(COL.tareas).doc(tareaId);
  return db.runTransaction(async (tx): Promise<ResultadoTarea> => {
    const [snap, eqs, ents] = await Promise.all([
      tx.get(ref),
      tx.get(db.collection(COL.equipos).where("seccion", "==", seccion)),
      tx.get(db.collection(COL.entregas).where("tareaId", "==", tareaId)),
    ]);
    if (!snap.exists) return { ok: false, error: "no-existe" };
    const p = zTareaDoc.safeParse(snap.data());
    if (!p.success) return { ok: false, error: "invalida" };
    const t = p.data;
    if (
      t.tipo !== "grupal" ||
      !t.premio ||
      t.estado !== "evaluada" ||
      !t.secciones.includes(seccion)
    ) {
      return { ok: false, error: "sin-empate" };
    }
    const equipos = eqs.docs.flatMap((d) => {
      const e = zEquipo.safeParse(d.data());
      return e.success ? [{ id: d.id, ...e.data }] : [];
    });
    const entregas = ents.docs.flatMap((d) => {
      const e = zEntrega.safeParse(d.data());
      return e.success ? [e.data] : [];
    });
    // Estado sin la decisión anterior: se puede cambiar de opinión mientras siga el empate
    const actual = estadoPremioSeccion(
      { ...t, id: tareaId, decisionesPremio: undefined },
      seccion,
      equipos,
      entregas,
    );
    if (actual.tipo !== "empate") return { ok: false, error: "sin-empate" };
    if (
      decision.tipo === "dar" &&
      !actual.equipoIds.includes(decision.equipoId)
    ) {
      return { ok: false, error: "invalida" };
    }
    // `FieldPath`: «5A» empieza por cifra y no va en una ruta con puntos
    tx.update(
      ref,
      new FieldPath("decisionesPremio", seccion),
      decision,
      "actualizadoEn",
      ahora,
    );
    return { ok: true, id: tareaId };
  });
}
