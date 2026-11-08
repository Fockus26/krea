// La entrega sobre Postgres (D195, D196, D327). Sin `server-only` para que las pruebas la corran
// sobre PGlite; la app la usa solo desde lib/acciones/entregas.ts, después de `exigirSesion` (el
// `uid` sale de la sesión).
//
// Enviar bloquea la fila de la tarea (`FOR UPDATE`): todas las entregas de una tarea pasan de a
// una. Así dos envíos del mismo equipo, o del equipo viejo y el nuevo de un alumno (D221), no se
// pisan (en Firestore lo hacía el reintento de la transacción).
import { and, eq, sql } from "drizzle-orm";
import {
  entregaDeFila,
  equipoDeFila,
  filaDeEntrega,
  tareaDeFila,
  validas,
} from "@/lib/data/filas";
import {
  leerOperacionEnTx,
  registrarOperacionEnTx,
} from "@/lib/data/operaciones";
import { leerUsuario } from "@/lib/data/usuarios";
import { type Db, enSerie, type Tx } from "@/lib/db";
import { entregas, equipos, tareas, usuarios } from "@/lib/db/schema";
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
  type Entrega,
  type Equipo,
  type Tarea,
  type Usuario,
  zEntrega,
  zTarea,
} from "@/lib/modelo";

export type ResultadoEnvio = { ok: true } | { ok: false; error: ErrorEnvio };

type Contexto = {
  usuario: Usuario;
  tarea: Tarea | null;
  equipo: ({ id: string } & Equipo) | null;
};

/** Perfil, tarea (solo publicada válida: el alumno no ve borradores) y equipo. */
async function contexto(
  db: Tx,
  uid: string,
  tareaId: string,
  bloquearTarea: boolean,
): Promise<Contexto | null> {
  const consultaTarea = db.select().from(tareas).where(eq(tareas.id, tareaId));
  // En serie: dentro de la transacción van por la misma conexión (`enSerie`)
  const [ft] = await (bloquearTarea
    ? consultaTarea.for("update")
    : consultaTarea);
  const usuario = await leerUsuario(db, uid);
  if (!usuario) return null;
  const t = ft ? tareaDeFila(ft) : null;
  const tarea = t ? zTarea.safeParse(t) : null;
  let equipo: Contexto["equipo"] = null;
  if (usuario.equipoId) {
    const [fe] = await db
      .select()
      .from(equipos)
      .where(eq(equipos.id, usuario.equipoId));
    equipo = fe ? equipoDeFila(fe) : null;
  }
  return {
    usuario,
    tarea: tarea?.success ? tarea.data : null,
    equipo,
  };
}

/**
 * Antes de subir una imagen: ¿puede este alumno responder esta pregunta de imagen? Devuelve el
 * permiso (titular y id de la entrega) para armar la clave del objeto.
 */
export async function permisoSubida(
  db: Db,
  uid: string,
  tareaId: string,
  preguntaId: string,
): Promise<
  { ok: true; permiso: PermisoEntrega } | { ok: false; error: ErrorEntrega }
> {
  const c = await contexto(db, uid, tareaId, false);
  if (!c) return { ok: false, error: "no-existe" };
  const p = permisoEntrega(c.usuario, c.tarea, tareaId, c.equipo);
  if (!p.ok) return p;
  const pregunta = c.tarea?.preguntas.find((x) => x.id === preguntaId);
  if (pregunta?.formato !== "imagen") return { ok: false, error: "incompleta" };
  const [existente] = await db
    .select({ estado: entregas.estado })
    .from(entregas)
    .where(eq(entregas.id, p.permiso.entregaId));
  if (existente && existente.estado !== "borrador") {
    return { ok: false, error: "ya-entregada" };
  }
  return p;
}

/**
 * Envía la entrega en UNA transacción: bloquea la tarea, lee perfil, equipo, la entrega existente y
 * (grupal) los integrantes actuales y las demás entregas de la tarea (D221); comprueba permiso
 * (D012) y respuestas; guarda la entrega `entregada`.
 */
export async function enviarEnTransaccion(
  db: Db,
  uid: string,
  envio: EnvioEntrega,
  ahora: number,
): Promise<ResultadoEnvio> {
  const { tareaId, respuestas } = envio;
  return db.transaction(async (tx): Promise<ResultadoEnvio> => {
    const c = await contexto(tx, uid, tareaId, true);
    // Reintento de un envío que ya entró (D293): el mismo resultado, sin volver a escribir
    const op = await leerOperacionEnTx(tx, envio.opId, uid, "entrega");
    if (op?.previa.tipo === "repetida") return { ok: true };
    if (op?.previa.tipo === "ajena") return { ok: false, error: "incompleta" };
    if (!c) return { ok: false, error: "no-existe" };
    const p = permisoEntrega(c.usuario, c.tarea, tareaId, c.equipo);
    if (!p.ok) return p;
    if (!c.tarea) return { ok: false, error: "no-existe" };
    const entregaId = p.permiso.entregaId;
    const [previa] = await tx
      .select()
      .from(entregas)
      .where(eq(entregas.id, entregaId));
    const existente = previa ? entregaDeFila(previa) : null;
    // Una fila que existe pero no valida tampoco se pisa
    if (previa && (!existente || yaEnviada(existente))) {
      return { ok: false, error: "ya-entregada" };
    }
    let integrantes: string[] = [];
    let excluidos = new Set<string>();
    if (p.permiso.tipo === "grupal") {
      const [miembros, otras] = await enSerie([
        tx
          .select({ cedula: usuarios.cedula })
          .from(usuarios)
          .where(
            and(
              eq(usuarios.equipoId, p.permiso.titularId),
              eq(usuarios.rol, "estudiante"),
            ),
          ),
        // Las demás entregas de la tarea (pocas: una por equipo de la sección)
        tx.select().from(entregas).where(eq(entregas.tareaId, tareaId)),
      ]);
      integrantes = miembros.map((m) => m.cedula);
      excluidos = enOtraEntrega(
        validas(otras.map(entregaDeFila)).map(({ id, ...entrega }) => ({
          id,
          entrega,
        })),
        entregaId,
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
      carpeta: await carpetaEntrega(entregaId),
      ahora,
    });
    if (!armada.ok) return armada;
    const doc: Entrega = zEntrega.parse(armada.entrega);
    const fila = filaDeEntrega(entregaId, doc);
    await tx
      .insert(entregas)
      .values(fila)
      .onConflictDoUpdate({ target: entregas.id, set: fila });
    await registrarOperacionEnTx(tx, op, uid, "entrega", null, ahora);
    return { ok: true };
  });
}

/** Para las lecturas: la entrega `id`, o `null`. */
export async function leerEntrega(
  db: Tx,
  id: string,
): Promise<({ id: string } & Entrega) | null> {
  const [f] = await db.select().from(entregas).where(eq(entregas.id, id));
  return f ? entregaDeFila(f) : null;
}

/** Entregas donde aparece la cédula como integrante (índice GIN sobre el arreglo). */
export async function entregasDeIntegrante(
  db: Tx,
  cedula: string,
): Promise<Array<{ id: string } & Entrega>> {
  const filas = await db
    .select()
    .from(entregas)
    .where(sql`${entregas.integrantes} @> ARRAY[${cedula}]::text[]`);
  return validas(filas.map(entregaDeFila));
}
