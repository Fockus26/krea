// Adaptadores del Admin SDK para las tareas del profe (D199–D202). Sin `server-only` para que las
// pruebas de tests/rules los corran contra los emuladores; la app los usa solo desde
// lib/acciones/tareas.ts, después de `exigirSesion("profesor")` (el autor sale de la sesión).
//
// Guardar, cerrar y decidir el premio no cambian puntos: solo una entrega evaluada aporta al
// ranking (D007) y un premio no da puntos. Eliminar sí (se van sus notas): recalcula en la
// misma transacción (D206, D242).
import { FieldPath, type Firestore } from "firebase-admin/firestore";
import {
  leerOperacionEnTx,
  registrarOperacionEnTx,
} from "@/lib/firebase/operaciones";
import { escribirRankingEnTx, leerSeccionEnTx } from "@/lib/firebase/ranking";
import {
  COL,
  type DecisionPremio,
  idDeDecision,
  type SeccionId,
  zEntrega,
  zEquipo,
  zTareaDoc,
  zUsuario,
} from "@/lib/modelo";
import {
  armarPremio,
  armarTarea,
  type CambioFoto,
  decisionEncaja,
  estadoPremioSeccion,
  type GuardarTarea,
  MAX_ESCRITURAS_TX,
  planEliminar,
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
): Promise<ResultadoTarea & { fotoSuelta?: string }> {
  const tareas = db.collection(COL.tareas);
  return db.runTransaction(
    async (tx): Promise<ResultadoTarea & { fotoSuelta?: string }> => {
      // Reintento de un guardado que ya entró (D293): el mismo id, sin crear otra tarea
      const op = await leerOperacionEnTx(db, tx, envio.opId, autorId, "tarea");
      if (op?.previa.tipo === "repetida" && op.previa.id)
        return { ok: true, id: op.previa.id };
      if (op && op.previa.tipo !== "nueva")
        return { ok: false, error: "invalida" };
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
      registrarOperacionEnTx(tx, op, autorId, "tarea", ref.id, ahora);
      // Se quitó el premio: su foto ya no la usa nadie (se borra tras el commit, D265)
      return r.fotoSuelta
        ? { ok: true, id: ref.id, fotoSuelta: r.fotoSuelta }
        : { ok: true, id: ref.id };
    },
  );
}

/**
 * Elimina una tarea con todas sus entregas (y con ellas sus notas) en UNA transacción, y
 * recalcula `ranking/{s}` de cada sección que tenía entregas sin ellas (D206, D242). Los ajustes
 * no se tocan (D007): solo desaparecen las notas. `decisionesPremio` vive en la tarea y se va con
 * ella. Devuelve las claves de B2 de las imágenes para borrarlas después del commit (D229).
 */
export async function eliminarTareaEnTransaccion(
  db: Firestore,
  id: string,
  ahora: number,
): Promise<{ resultado: ResultadoTarea; imagenes: string[] }> {
  const ref = db.collection(COL.tareas).doc(id);
  return db.runTransaction(async (tx) => {
    const [snap, ents] = await Promise.all([
      tx.get(ref),
      tx.get(db.collection(COL.entregas).where("tareaId", "==", id)),
    ]);
    if (!snap.exists) {
      return {
        resultado: { ok: false, error: "no-existe" } as ResultadoTarea,
        imagenes: [],
      };
    }
    // Las que no validan también se borran; para el plan solo cuentan las válidas
    const entregas = ents.docs.flatMap((d) => {
      const e = zEntrega.safeParse(d.data());
      return e.success ? [e.data] : [];
    });
    const plan = planEliminar(entregas);
    // La foto del premio se va con la tarea (D265)
    const foto = zTareaDoc.safeParse(snap.data());
    const fotoPremio = foto.success ? (foto.data.premioFoto ?? null) : null;
    const escrituras = plan.escrituras + (ents.size - entregas.length);
    if (escrituras > MAX_ESCRITURAS_TX) {
      return {
        resultado: { ok: false, error: "invalida" } as ResultadoTarea,
        imagenes: [],
      };
    }
    // Todas las lecturas antes de la primera escritura
    const datos = await Promise.all(
      plan.secciones.map((s) => leerSeccionEnTx(tx, db, s)),
    );
    for (const d of ents.docs) tx.delete(d.ref);
    tx.delete(ref);
    plan.secciones.forEach((s, i) => {
      const leidos = datos[i];
      if (!leidos) return;
      escribirRankingEnTx(
        tx,
        db,
        s,
        {
          ...leidos,
          entregas: leidos.entregas.filter((e) => e.tareaId !== id),
        },
        ahora,
      );
    });
    return {
      resultado: { ok: true, id } as ResultadoTarea,
      imagenes: fotoPremio ? [...plan.imagenes, fotoPremio] : plan.imagenes,
    };
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
 * Decide el empate del premio de una sección (D123, D124, D263): solo si la tarea está cerrada,
 * tiene premio y hay empate ahora mismo entre los equipos (grupal) o los alumnos (individual) de
 * esa sección; «dar» / «darAlumno» solo a un empatado y según el tipo de tarea.
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
    const [snap, eqs, ents, usrs] = await Promise.all([
      tx.get(ref),
      tx.get(db.collection(COL.equipos).where("seccion", "==", seccion)),
      tx.get(db.collection(COL.entregas).where("tareaId", "==", tareaId)),
      tx.get(db.collection(COL.usuarios).where("seccion", "==", seccion)),
    ]);
    if (!snap.exists) return { ok: false, error: "no-existe" };
    const p = zTareaDoc.safeParse(snap.data());
    if (!p.success) return { ok: false, error: "invalida" };
    const t = p.data;
    if (
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
    const alumnos = usrs.docs.flatMap((d) => {
      const u = zUsuario.safeParse(d.data());
      return u.success ? [u.data] : [];
    });
    if (!decisionEncaja(t.tipo, decision))
      return { ok: false, error: "invalida" };
    // Estado sin la decisión anterior: se puede cambiar de opinión mientras siga el empate
    const actual = estadoPremioSeccion(
      { ...t, id: tareaId, decisionesPremio: undefined },
      seccion,
      equipos,
      entregas,
      alumnos,
    );
    if (actual.tipo !== "empate") return { ok: false, error: "sin-empate" };
    const id = idDeDecision(decision);
    if (id !== null && !actual.titularIds.includes(id)) {
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

export type PremioGuardado =
  | { ok: true; anterior: string | null }
  | { ok: false; error: "no-existe" | "cerrada" | "invalida" };

/**
 * Pone o cambia el premio de una tarea y su foto (D266) en UNA transacción: lee la tarea, arma
 * los campos con `armarPremio` y los escribe. La foto nueva ya está en B2 (la sube la acción
 * antes); la anterior sale en `anterior` para borrarla después del commit (best effort).
 */
export async function guardarPremioEnTransaccion(
  db: Firestore,
  tareaId: string,
  premio: string,
  foto: CambioFoto,
  ahora: number,
): Promise<PremioGuardado> {
  const ref = db.collection(COL.tareas).doc(tareaId);
  return db.runTransaction(async (tx): Promise<PremioGuardado> => {
    const snap = await tx.get(ref);
    if (!snap.exists) return { ok: false, error: "no-existe" };
    const p = zTareaDoc.safeParse(snap.data());
    if (!p.success) return { ok: false, error: "invalida" };
    const r = armarPremio(p.data, premio, foto);
    if (!r.ok) return r;
    tx.update(ref, { ...r.campos, actualizadoEn: ahora });
    return { ok: true, anterior: r.anterior };
  });
}
