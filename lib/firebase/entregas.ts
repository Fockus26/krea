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
  type PermisoEntrega,
  permisoEntrega,
  yaEnviada,
} from "@/lib/entregas";
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
 * los integrantes actuales; comprueba permiso (D012) y respuestas; crea la entrega `entregada`.
 */
export async function enviarEnTransaccion(
  db: Firestore,
  uid: string,
  envio: EnvioEntrega,
  ahora: number,
): Promise<ResultadoEnvio> {
  const { tareaId, respuestas } = envio;
  return db.runTransaction(async (tx): Promise<ResultadoEnvio> => {
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
    if (p.permiso.tipo === "grupal") {
      const q = await tx.get(
        db
          .collection(COL.usuarios)
          .where("equipoId", "==", p.permiso.titularId),
      );
      integrantes = q.docs
        .filter((d) => d.get("rol") === "estudiante")
        .map((d) => d.id);
    }
    const armada = armarEntrega({
      tareaId,
      tarea: c.tarea,
      permiso: p.permiso,
      usuario: c.usuario,
      integrantes,
      respuestas,
      carpeta: await carpetaEntrega(p.permiso.entregaId),
      ahora,
    });
    if (!armada.ok) return armada;
    const doc: Entrega = zEntrega.parse(armada.entrega);
    tx.set(ref, doc);
    return { ok: true };
  });
}
