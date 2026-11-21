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
import { entregas, equipos, partes, tareas, usuarios } from "@/lib/db/schema";
import {
  armarEntrega,
  carpetaEntrega,
  type EnvioEntrega,
  type ErrorEntrega,
  type ErrorEnvio,
  enOtraEntrega,
  imagenesSinUso,
  modoEnvio,
  type PermisoEntrega,
  permisoEntrega,
} from "@/lib/entregas";
import {
  type Entrega,
  type Equipo,
  type Parte,
  type Tarea,
  type Usuario,
  zEntrega,
  zTarea,
} from "@/lib/modelo";
import {
  permisoParte,
  repartoCongelado,
  repartoParaEnviar,
  sinParteDe,
} from "@/lib/partes";

export type ResultadoEnvio = { ok: true } | { ok: false; error: ErrorEnvio };

/**
 * Lo que devuelve la transacción: además, las imágenes que un reenvío dejó sin usar (D396), que la
 * Server Action borra de B2 después del commit. Ausente si no hay ninguna.
 */
export type ResultadoEnvioTx =
  | { ok: true; sinUso?: string[] }
  | { ok: false; error: ErrorEnvio };

export type Contexto = {
  usuario: Usuario;
  tarea: Tarea | null;
  equipo: ({ id: string } & Equipo) | null;
};

/** Perfil, tarea (solo publicada válida: el alumno no ve borradores) y equipo. */
export async function contexto(
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
  /** Instante de la subida: vencida sin prórroga, ya no (D451). */
  ahora: number,
): Promise<
  { ok: true; permiso: PermisoEntrega } | { ok: false; error: ErrorEntrega }
> {
  const c = await contexto(db, uid, tareaId, false);
  if (!c) return { ok: false, error: "no-existe" };
  const p = permisoEntrega(c.usuario, c.tarea, tareaId, c.equipo, ahora);
  // Grupal por partes (D417): el integrante sube la imagen de SU pregunta a la carpeta de la
  // entrega del equipo, mientras la entrega no salga y su parte no esté aceptada
  if (!p.ok && p.error === "no-capitan")
    return permisoSubidaParte(db, c, tareaId, preguntaId, p, ahora);
  if (!p.ok) return p;
  const pregunta = c.tarea?.preguntas.find((x) => x.id === preguntaId);
  if (pregunta?.formato !== "imagen") return { ok: false, error: "incompleta" };
  const [existente] = await db
    .select({ estado: entregas.estado, respuestas: entregas.respuestas })
    .from(entregas)
    .where(eq(entregas.id, p.permiso.entregaId));
  // También para editar una entregada sin evaluar (D395); evaluada, no (salvo completar)
  const m = modoEnvio(existente ?? null, c.tarea?.preguntas ?? []);
  return m.ok ? p : m;
}

async function permisoSubidaParte(
  db: Db,
  c: Contexto,
  tareaId: string,
  preguntaId: string,
  sinPermiso: { ok: false; error: ErrorEntrega },
  ahora: number,
): Promise<
  { ok: true; permiso: PermisoEntrega } | { ok: false; error: ErrorEntrega }
> {
  const pp = permisoParte(c.usuario, c.tarea, tareaId, c.equipo, ahora);
  if (!pp.ok || pp.permiso.capitan) return sinPermiso;
  const pregunta = c.tarea?.preguntas.find((x) => x.id === preguntaId);
  if (pregunta?.formato !== "imagen") return { ok: false, error: "incompleta" };
  const entregaId = pp.permiso.entregaId;
  const [[existente], [parte]] = await enSerie([
    db
      .select({ estado: entregas.estado })
      .from(entregas)
      .where(eq(entregas.id, entregaId)),
    db
      .select({ asignado: partes.asignado, estado: partes.estado })
      .from(partes)
      .where(
        and(eq(partes.entregaId, entregaId), eq(partes.preguntaId, preguntaId)),
      ),
  ]);
  if (repartoCongelado(existente ?? null)) return sinPermiso;
  // Aceptada o tomada por el capitán (D461): ya no la sube él
  if (
    parte?.asignado !== c.usuario.cedula ||
    parte.estado === "aceptada" ||
    parte.estado === "tomada"
  )
    return sinPermiso;
  const { capitan: _, equipoId: __, ...permiso } = pp.permiso;
  return { ok: true, permiso };
}

/**
 * Envía la entrega en UNA transacción: bloquea la tarea, lee perfil, equipo, la entrega existente y
 * (grupal) los integrantes actuales y las demás entregas de la tarea (D221); comprueba permiso
 * (D012) y respuestas; guarda la entrega `entregada`. Sobre una `entregada` sin evaluar es una
 * edición (D395): respuestas, `enviadaEn` y `enviadaPor` nuevos, los mismos integrantes. La fila
 * de la entrega se bloquea (`FOR UPDATE`, como la relee Evaluar): si el profe la está evaluando,
 * uno espera al otro y el segundo ve la versión nueva (`ya-evaluada` o, en Evaluar, `editada`).
 */
export async function enviarEnTransaccion(
  db: Db,
  uid: string,
  envio: EnvioEntrega,
  ahora: number,
): Promise<ResultadoEnvioTx> {
  const { tareaId, respuestas } = envio;
  return db.transaction(async (tx): Promise<ResultadoEnvioTx> => {
    const c = await contexto(tx, uid, tareaId, true);
    // Reintento de un envío que ya entró (D293): el mismo resultado, sin volver a escribir
    const op = await leerOperacionEnTx(tx, envio.opId, uid, "entrega");
    if (op?.previa.tipo === "repetida") return { ok: true };
    if (op?.previa.tipo === "ajena") return { ok: false, error: "incompleta" };
    if (!c) return { ok: false, error: "no-existe" };
    const p = permisoEntrega(c.usuario, c.tarea, tareaId, c.equipo, ahora);
    if (!p.ok) return p;
    if (!c.tarea) return { ok: false, error: "no-existe" };
    const entregaId = p.permiso.entregaId;
    const [previa] = await tx
      .select()
      .from(entregas)
      .where(eq(entregas.id, entregaId))
      .for("update");
    const existente = previa ? entregaDeFila(previa) : null;
    // Una fila que existe pero no valida no se pisa
    if (previa && !existente) return { ok: false, error: "ya-entregada" };
    // Evaluada: no se edita. Sí se completa una con nota y sin respuestas (el profe la evaluó
    // antes, `faltanRespuestas`): la evaluación se queda.
    const m = modoEnvio(existente, c.tarea.preguntas);
    if (!m.ok) return m;
    let integrantes: string[] = [];
    let excluidos = new Set<string>();
    let reparto: Array<Pick<Parte, "asignado" | "estado">> = [];
    let enviadas = respuestas;
    // Al editar, los integrantes no se recalculan (D396): no hace falta leer el equipo
    if (p.permiso.tipo === "grupal" && m.modo === "nueva") {
      const [miembros, otras, filasPartes] = await enSerie([
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
        // El reparto del equipo (D420): de él sale `sinParte` y lo aceptado (D463)
        tx
          .select({
            preguntaId: partes.preguntaId,
            asignado: partes.asignado,
            estado: partes.estado,
            respuesta: partes.respuesta,
          })
          .from(partes)
          .where(eq(partes.entregaId, entregaId)),
      ]);
      reparto = filasPartes;
      integrantes = miembros.map((m) => m.cedula);
      // Lo aceptado entra desde el reparto (la del cliente se ignora); lo asignado sin aceptar
      // frena el envío. Sus imágenes ya pasaron por B2 al entregarlas y son de esta carpeta (D417).
      const r = repartoParaEnviar(
        c.tarea.preguntas,
        filasPartes,
        integrantes,
        c.equipo?.capitanId ?? null,
      );
      if (!r.ok) return { ok: false, error: "partes-pendientes" };
      enviadas = { ...respuestas, ...r.respuestas };
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
      respuestas: enviadas,
      carpeta: await carpetaEntrega(entregaId),
      ahora,
    });
    if (!armada.ok) return armada;
    // Nueva y grupal (D420): quien tenía pregunta y no entregó ninguna, entre los que reciben la
    // nota (un alumno que ya está en otra entrega no entra, D221). Al editar o completar se
    // conserva el de la entrega, como los integrantes (D396).
    const sinParte =
      m.modo === "nueva"
        ? sinParteDe(reparto, armada.entrega.integrantes, uid)
        : (existente?.sinParte ?? []);
    const conSinParte = sinParte.length > 0 ? { sinParte } : {};
    // Completar: mismas personas y misma nota (el ranking no cambia), solo las respuestas y el
    // envío. Reenviar: mismas personas (la foto del primer envío, D396), respuestas y envío nuevos.
    const doc: Entrega = zEntrega.parse(
      m.modo === "completar" && existente
        ? {
            ...armada.entrega,
            integrantes: existente.integrantes,
            estado: existente.estado,
            evaluacion: existente.evaluacion,
            ...(existente.evaluacionAnterior !== undefined
              ? { evaluacionAnterior: existente.evaluacionAnterior }
              : {}),
            ...conSinParte,
          }
        : m.modo === "reenvio" && existente
          ? {
              ...armada.entrega,
              integrantes: existente.integrantes,
              ...(existente.titularNombre
                ? { titularNombre: existente.titularNombre }
                : {}),
              ...conSinParte,
            }
          : { ...armada.entrega, ...conSinParte },
    );
    const fila = filaDeEntrega(entregaId, doc);
    await tx
      .insert(entregas)
      .values(fila)
      .onConflictDoUpdate({ target: entregas.id, set: fila });
    await registrarOperacionEnTx(tx, op, uid, "entrega", null, ahora);
    const sinUso = existente
      ? imagenesSinUso(existente.respuestas, doc.respuestas)
      : [];
    return sinUso.length > 0 ? { ok: true, sinUso } : { ok: true };
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
