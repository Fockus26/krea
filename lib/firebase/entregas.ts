// Adaptadores del Admin SDK para la entrega (D195, D196). Sin `server-only` para que las pruebas
// de tests/rules los corran contra los emuladores; la app los usa solo desde
// lib/acciones/entregas.ts, después de `exigirSesion` (el `uid` sale de la sesión).
import type {
  DocumentReference,
  Firestore,
  Transaction,
} from "firebase-admin/firestore";
import {
  armarEntrega,
  carpetaEntrega,
  type EnvioEntrega,
  type ErrorEntrega,
  type ErrorEnvio,
  enOtraEntrega,
  type PermisoEntrega,
  permisoEntrega,
  yaEnviada,
} from "@/lib/entregas";
import {
  leerOperacionEnTx,
  registrarOperacionEnTx,
} from "@/lib/firebase/operaciones";
import {
  COL,
  type Entrega,
  type Equipo,
  type Tarea,
  type Usuario,
  zEntrega,
  zEquipo,
  zTarea,
  zUsuario,
} from "@/lib/modelo";

export type ResultadoEnvio = { ok: true } | { ok: false; error: ErrorEnvio };

type Contexto = {
  usuario: Usuario;
  tarea: Tarea | null;
  equipo: ({ id: string } & Equipo) | null;
};

/** Perfil, tarea y equipo: dentro de la transacción (`tx`) o como lectura suelta. */
async function contexto(
  db: Firestore,
  tx: Pick<Transaction, "get"> | null,
  uid: string,
  tareaId: string,
): Promise<Contexto | null> {
  const leer = (ref: DocumentReference) => (tx ? tx.get(ref) : ref.get());
  const [u, t] = await Promise.all([
    leer(db.collection(COL.usuarios).doc(uid)),
    leer(db.collection(COL.tareas).doc(tareaId)),
  ]);
  const usuario = u.exists ? zUsuario.safeParse(u.data()) : null;
  if (!usuario?.success) return null;
  const tarea = t.exists ? zTarea.safeParse(t.data()) : null;
  let equipo: Contexto["equipo"] = null;
  if (usuario.data.equipoId) {
    const e = await leer(db.collection(COL.equipos).doc(usuario.data.equipoId));
    const parsed = e.exists ? zEquipo.safeParse(e.data()) : null;
    if (parsed?.success) equipo = { id: e.id, ...parsed.data };
  }
  return {
    usuario: usuario.data,
    tarea: tarea?.success ? tarea.data : null,
    equipo,
  };
}

/**
 * Antes de subir una imagen: ¿puede este alumno responder esta pregunta de imagen? Devuelve el
 * permiso (titular y id de la entrega) para armar la clave del objeto.
 */
export async function permisoSubida(
  db: Firestore,
  uid: string,
  tareaId: string,
  preguntaId: string,
): Promise<
  { ok: true; permiso: PermisoEntrega } | { ok: false; error: ErrorEntrega }
> {
  const c = await contexto(db, null, uid, tareaId);
  if (!c) return { ok: false, error: "no-existe" };
  const p = permisoEntrega(c.usuario, c.tarea, tareaId, c.equipo);
  if (!p.ok) return p;
  const pregunta = c.tarea?.preguntas.find((x) => x.id === preguntaId);
  if (pregunta?.formato !== "imagen") return { ok: false, error: "incompleta" };
  const existente = await db
    .collection(COL.entregas)
    .doc(p.permiso.entregaId)
    .get();
  if (existente.exists && existente.get("estado") !== "borrador") {
    return { ok: false, error: "ya-entregada" };
  }
  return p;
}

/**
 * Envía la entrega en UNA transacción: lee perfil, tarea, equipo, la entrega existente y (grupal)
 * los integrantes actuales y las demás entregas de la tarea (D221); comprueba permiso (D012) y respuestas; crea la entrega `entregada`.
 */
export async function enviarEnTransaccion(
  db: Firestore,
  uid: string,
  envio: EnvioEntrega,
  ahora: number,
): Promise<ResultadoEnvio> {
  const { tareaId, respuestas } = envio;
  return db.runTransaction(async (tx): Promise<ResultadoEnvio> => {
    // Reintento de un envío que ya entró (D293): el mismo resultado, sin volver a escribir
    const op = await leerOperacionEnTx(db, tx, envio.opId, uid, "entrega");
    if (op?.previa.tipo === "repetida") return { ok: true };
    if (op?.previa.tipo === "ajena") return { ok: false, error: "incompleta" };
    const c = await contexto(db, tx, uid, tareaId);
    if (!c) return { ok: false, error: "no-existe" };
    const p = permisoEntrega(c.usuario, c.tarea, tareaId, c.equipo);
    if (!p.ok) return p;
    if (!c.tarea) return { ok: false, error: "no-existe" };
    const ref = db.collection(COL.entregas).doc(p.permiso.entregaId);
    const previa = await tx.get(ref);
    const existente = previa.exists
      ? (zEntrega.safeParse(previa.data()).data ?? null)
      : null;
    // Un documento que existe pero no valida tampoco se pisa
    if (previa.exists && (!existente || yaEnviada(existente))) {
      return { ok: false, error: "ya-entregada" };
    }
    let integrantes: string[] = [];
    let excluidos = new Set<string>();
    if (p.permiso.tipo === "grupal") {
      const [q, otras] = await Promise.all([
        tx.get(
          db
            .collection(COL.usuarios)
            .where("equipoId", "==", p.permiso.titularId),
        ),
        // Las demás entregas de la tarea (pocas: una por equipo de la sección), en la misma
        // transacción: si el equipo viejo entrega a la vez, una de las dos se reintenta.
        tx.get(db.collection(COL.entregas).where("tareaId", "==", tareaId)),
      ]);
      integrantes = q.docs
        .filter((d) => d.get("rol") === "estudiante")
        .map((d) => d.id);
      excluidos = enOtraEntrega(
        otras.docs.flatMap((d) => {
          const e = zEntrega.safeParse(d.data());
          return e.success ? [{ id: d.id, entrega: e.data }] : [];
        }),
        ref.id,
      );
    }
    const armada = armarEntrega({
      tareaId,
      tarea: c.tarea,
      permiso: p.permiso,
      usuario: c.usuario,
      integrantes,
      excluidos,
      respuestas,
      carpeta: await carpetaEntrega(p.permiso.entregaId),
      ahora,
    });
    if (!armada.ok) return armada;
    const doc: Entrega = zEntrega.parse(armada.entrega);
    tx.set(ref, doc);
    registrarOperacionEnTx(tx, op, uid, "entrega", null, ahora);
    return { ok: true };
  });
}
