// Grupal por partes sobre Postgres (D416–D421). Sin `server-only` para que las pruebas la corran
// sobre PGlite; la app la usa solo desde lib/acciones/partes.ts, después de `exigirSesion` (el
// `uid` sale de la sesión).
//
// Cada acción bloquea la fila de la tarea (`FOR UPDATE`), igual que el envío: así ninguna parte
// cambia mientras el capitán envía, y con la entrega ya enviada todo queda congelado (D419).
import { and, eq } from "drizzle-orm";
import { contexto } from "@/lib/data/entregas";
import {
  entregaDeFila,
  filaDeParte,
  parteDeFila,
  validas,
} from "@/lib/data/filas";
import { type Db, enSerie, type Tx } from "@/lib/db";
import { entregas, partes, usuarios } from "@/lib/db/schema";
import { carpetaEntrega, respuestasValidas } from "@/lib/entregas";
import { type Parte, rutasImagen } from "@/lib/modelo";
import {
  type AccionParte,
  aplicarParte,
  type ErrorParte,
  permisoParte,
  repartoCongelado,
} from "@/lib/partes";

export type ResultadoParteTx =
  | { ok: true; sinUso?: string[] }
  | { ok: false; error: ErrorParte };

/** Las partes de la entrega de un equipo (válidas), en el orden de la tabla. */
export async function leerPartes(db: Tx, entregaId: string): Promise<Parte[]> {
  const filas = await db
    .select()
    .from(partes)
    .where(eq(partes.entregaId, entregaId));
  return validas(filas.map(parteDeFila));
}

/**
 * Aplica una acción sobre la parte de una pregunta en UNA transacción (D417): bloquea la tarea,
 * comprueba que la grupal siga abierta y la entrega sin enviar, lee los integrantes actuales y la
 * parte, y escribe lo que decide `aplicarParte` (o borra la fila al quitar la asignación). Las
 * imágenes que la parte deja sin usar vuelven en `sinUso` para borrarlas tras el commit (D396).
 */
export async function accionParteEnTransaccion(
  db: Db,
  uid: string,
  entrada: { tareaId: string; preguntaId: string; accion: AccionParte },
  ahora: number,
): Promise<ResultadoParteTx> {
  const { tareaId, preguntaId, accion } = entrada;
  return db.transaction(async (tx): Promise<ResultadoParteTx> => {
    const c = await contexto(tx, uid, tareaId, true);
    if (!c) return { ok: false, error: "no-existe" };
    const p = permisoParte(c.usuario, c.tarea, tareaId, c.equipo);
    if (!p.ok) return p;
    const pregunta = c.tarea?.preguntas.find((x) => x.id === preguntaId);
    if (!c.tarea || !pregunta) return { ok: false, error: "no-existe" };
    const { entregaId, equipoId } = p.permiso;
    const [[previa], miembros, [fila]] = await enSerie([
      tx.select().from(entregas).where(eq(entregas.id, entregaId)),
      tx
        .select({ cedula: usuarios.cedula })
        .from(usuarios)
        .where(
          and(eq(usuarios.equipoId, equipoId), eq(usuarios.rol, "estudiante")),
        ),
      tx
        .select()
        .from(partes)
        .where(
          and(
            eq(partes.entregaId, entregaId),
            eq(partes.preguntaId, preguntaId),
          ),
        )
        .for("update"),
    ]);
    // Una fila de entrega que no valida tampoco se toca: cuenta como enviada
    if (previa && (!entregaDeFila(previa) || repartoCongelado(previa)))
      return { ok: false, error: "enviada" };

    let a = accion;
    if (a.tipo === "entregar") {
      const normal = respuestasValidas(
        [pregunta],
        { [preguntaId]: a.respuesta },
        tareaId,
        await carpetaEntrega(entregaId),
      )?.[preguntaId];
      if (!normal) return { ok: false, error: "incompleta" };
      a = { tipo: "entregar", respuesta: normal };
    }

    const r = aplicarParte({
      actual: fila ? parteDeFila(fila) : null,
      accion: a,
      quien: { cedula: uid, capitan: p.permiso.capitan },
      miembros: miembros.map((m) => m.cedula),
      capitanId: c.equipo?.capitanId ?? null,
      clave: { entregaId, preguntaId, tareaId, equipoId },
      ahora,
    });
    if (!r.ok) return r;
    const donde = and(
      eq(partes.entregaId, entregaId),
      eq(partes.preguntaId, preguntaId),
    );
    if (r.parte === null) {
      await tx.delete(partes).where(donde);
    } else {
      const nueva = filaDeParte(r.parte);
      await tx
        .insert(partes)
        .values(nueva)
        .onConflictDoUpdate({
          target: [partes.entregaId, partes.preguntaId],
          set: nueva,
        });
    }
    return r.sinUso.length > 0 ? { ok: true, sinUso: r.sinUso } : { ok: true };
  });
}

/** Al eliminar una tarea: sus partes se van con ella (D421). Devuelve las imágenes que tenían. */
export async function borrarPartesDeTarea(
  tx: Tx,
  tareaId: string,
): Promise<string[]> {
  const filas = await tx
    .delete(partes)
    .where(eq(partes.tareaId, tareaId))
    .returning({ respuesta: partes.respuesta });
  return rutasDe(filas);
}

/**
 * Al eliminar un equipo: sus partes se van con él (D421). Sus imágenes sin enviar quedan en B2
 * (como las de una entrega cancelada, límite de D396): la acción de equipos solo borra el logo.
 */
export async function borrarPartesDeEquipo(
  tx: Tx,
  equipoId: string,
): Promise<void> {
  await tx.delete(partes).where(eq(partes.equipoId, equipoId));
}

const rutasDe = (filas: ReadonlyArray<{ respuesta: Parte["respuesta"] }>) =>
  filas.flatMap((f) => rutasImagen(f.respuesta));
