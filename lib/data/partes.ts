// Grupal por partes sobre Postgres (D416–D421). Sin `server-only` para que las pruebas la corran
// sobre PGlite; la app la usa solo desde lib/acciones/partes.ts, después de `exigirSesion` (el
// `uid` sale de la sesión).
//
// Cada acción bloquea la fila de la tarea (`FOR UPDATE`), igual que el envío: así ninguna parte
// cambia mientras el capitán envía, y con la entrega ya enviada todo queda congelado (D419).
import { and, eq, sql } from "drizzle-orm";
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
import { cedulaDeId, type IdAlumno } from "@/lib/id-publico";
import { type Parte, rutasImagen } from "@/lib/modelo";
import {
  type AccionParte,
  aplicarParte,
  type ErrorParte,
  huellaPartes,
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
 * Al asignar, `asignado` llega con el id público del integrante (D495): se traduce a la cédula
 * buscando entre los integrantes actuales del equipo con `idDe`; si no es de ninguno, `integrante`.
 */
export async function accionParteEnTransaccion(
  db: Db,
  uid: string,
  entrada: { tareaId: string; preguntaId: string; accion: AccionParte },
  ahora: number,
  idDe: IdAlumno,
): Promise<ResultadoParteTx> {
  const { tareaId, preguntaId, accion } = entrada;
  return db.transaction(async (tx): Promise<ResultadoParteTx> => {
    const c = await contexto(tx, uid, tareaId, true);
    if (!c) return { ok: false, error: "no-existe" };
    const p = permisoParte(c.usuario, c.tarea, tareaId, c.equipo, ahora);
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
    if (a.tipo === "asignar" && a.asignado !== null) {
      const cedula = cedulaDeId(
        a.asignado,
        miembros.map((m) => m.cedula),
        idDe,
      );
      if (!cedula) return { ok: false, error: "integrante" };
      a = { tipo: "asignar", asignado: cedula };
    }
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

/**
 * Huella del reparto de la entrega de un equipo para el sondeo (D465): cantidad de partes, mayor
 * `actualizado_en` y, si la entrega ya salió, su `enviada_en`. Dos lecturas por clave, sin bloqueo.
 */
export async function leerVersionPartes(
  db: Tx,
  entregaId: string,
): Promise<string> {
  const [[resumen], [entrega]] = await enSerie([
    db
      .select({
        filas: sql<number>`count(*)::int`,
        max: sql<number | null>`max(${partes.actualizadoEn})`,
      })
      .from(partes)
      .where(eq(partes.entregaId, entregaId)),
    db
      .select({ estado: entregas.estado, enviadaEn: entregas.enviadaEn })
      .from(entregas)
      .where(eq(entregas.id, entregaId)),
  ]);
  return huellaPartes({
    filas: Number(resumen?.filas ?? 0),
    maxActualizado: resumen?.max == null ? null : Number(resumen.max),
    enviadaEn:
      entrega && entrega.estado !== "borrador"
        ? Number(entrega.enviadaEn ?? 0)
        : null,
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
 * Al eliminar una entrega grupal: su reparto se va con ella (D421). Devuelve las imágenes que
 * tenían sus partes, para sumarlas a las que se borran de B2 tras el commit.
 */
export async function borrarPartesDeEntrega(
  tx: Tx,
  entregaId: string,
): Promise<string[]> {
  const filas = await tx
    .delete(partes)
    .where(eq(partes.entregaId, entregaId))
    .returning({ respuesta: partes.respuesta });
  return rutasDe(filas);
}

/**
 * Al eliminar un equipo: sus partes se van con él (D421). Devuelve las imágenes que tenían, para
 * borrarlas de B2 tras el commit (D530). Una parte aceptada comparte la imagen con la respuesta
 * del capitán y la entrega del equipo se queda (D307): quien llama descuenta las que sigue usando.
 */
export async function borrarPartesDeEquipo(
  tx: Tx,
  equipoId: string,
): Promise<string[]> {
  const filas = await tx
    .delete(partes)
    .where(eq(partes.equipoId, equipoId))
    .returning({ respuesta: partes.respuesta });
  return rutasDe(filas);
}

const rutasDe = (filas: ReadonlyArray<{ respuesta: Parte["respuesta"] }>) =>
  filas.flatMap((f) => rutasImagen(f.respuesta));
