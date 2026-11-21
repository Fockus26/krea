// Borrador compartido de una grupal sobre Postgres (D544–D546). Sin `server-only` para que las
// pruebas lo corran sobre PGlite; la app lo usa solo desde lib/acciones/borrador-grupal.ts, después
// de `exigirSesion` (el `uid` sale de la sesión), y desde las lecturas de la página.
//
// Guardar bloquea la fila de la tarea (`FOR UPDATE`), como enviar: un guardado que llega mientras el
// capitán envía espera, ve la entrega ya enviada y no deja un borrador huérfano.
import { eq } from "drizzle-orm";
import {
  type BorradorGuardado,
  borradorDeValor,
  type GuardarBorrador,
  limpiarBorrador,
  mismoBorrador,
  type ResultadoBorrador,
  rutasBorrador,
} from "@/lib/borrador-grupal";
import { carpetasDeEntrega } from "@/lib/carpeta-entrega";
import { contexto } from "@/lib/data/entregas";
import type { Db, Tx } from "@/lib/db";
import { borradoresGrupales, entregas } from "@/lib/db/schema";
import { permisoEntrega, yaEnviada } from "@/lib/entregas";

/**
 * Guarda el borrador del equipo en UNA transacción (D546): solo el capitán de una grupal abierta
 * (`permisoEntrega`, D012) y mientras la entrega no haya salido (también si ya la envió el equipo
 * antes de que él entrara, D545). Con la `version` que vio el cliente: si la fila tiene otra,
 * `cambio` sin escribir. Idempotente: lo mismo que ya está guardado devuelve `ok` sin escribir.
 */
export async function guardarBorradorEnTransaccion(
  db: Db,
  uid: string,
  entrada: GuardarBorrador,
  ahora: number,
): Promise<ResultadoBorrador> {
  const { tareaId } = entrada;
  return db.transaction(async (tx): Promise<ResultadoBorrador> => {
    const c = await contexto(tx, uid, tareaId, true);
    if (!c) return { ok: false, error: "no-existe" };
    const p = permisoEntrega(c.usuario, c.tarea, tareaId, c.equipo, ahora);
    if (!p.ok)
      return {
        ok: false,
        error:
          p.error === "cerrada" ||
          p.error === "sin-equipo" ||
          p.error === "no-capitan"
            ? p.error
            : "no-existe",
      };
    if (p.permiso.tipo !== "grupal" || !c.tarea || !c.equipo)
      return { ok: false, error: "no-existe" };
    const entregaId = p.permiso.entregaId;
    const [previa] = await tx
      .select({ estado: entregas.estado })
      .from(entregas)
      .where(eq(entregas.id, entregaId));
    if (previa && yaEnviada(previa)) return { ok: false, error: "enviada" };
    const [fila] = await tx
      .select()
      .from(borradoresGrupales)
      .where(eq(borradoresGrupales.entregaId, entregaId))
      .for("update");
    const respuestas = limpiarBorrador(
      c.tarea.preguntas,
      entrada.respuestas,
      tareaId,
      carpetasDeEntrega(entregaId),
    );
    const actual = fila?.version ?? 0;
    // Un reintento (la respuesta se perdió) o dos pestañas con lo mismo: nada que escribir
    if (fila && mismoBorrador(borradorDeValor(fila.respuestas), respuestas))
      return { ok: true, version: actual };
    if (entrada.version !== actual)
      return { ok: false, error: "cambio", version: actual };
    const nueva = {
      entregaId,
      tareaId,
      equipoId: c.equipo.id,
      respuestas,
      actualizadoPor: uid,
      actualizadoEn: ahora,
      version: actual + 1,
    };
    await tx
      .insert(borradoresGrupales)
      .values(nueva)
      .onConflictDoUpdate({ target: borradoresGrupales.entregaId, set: nueva });
    return { ok: true, version: nueva.version };
  });
}

/** El borrador del equipo (validado), o `null` si no hay. */
export async function leerBorradorGrupal(
  db: Tx,
  entregaId: string,
): Promise<BorradorGuardado | null> {
  const [f] = await db
    .select()
    .from(borradoresGrupales)
    .where(eq(borradoresGrupales.entregaId, entregaId));
  return f
    ? {
        respuestas: borradorDeValor(f.respuestas),
        actualizadoEn: f.actualizadoEn,
        actualizadoPor: f.actualizadoPor,
        version: f.version,
      }
    : null;
}

/** Versión del borrador para la huella del sondeo (D547); `null` sin fila. */
export async function leerVersionBorrador(
  db: Tx,
  entregaId: string,
): Promise<number | null> {
  const [f] = await db
    .select({ version: borradoresGrupales.version })
    .from(borradoresGrupales)
    .where(eq(borradoresGrupales.entregaId, entregaId));
  return f?.version ?? null;
}

/** Al eliminar una tarea: sus borradores se van con ella. Devuelve las imágenes que nombraban. */
export async function borrarBorradoresDeTarea(
  tx: Tx,
  tareaId: string,
): Promise<string[]> {
  const filas = await tx
    .delete(borradoresGrupales)
    .where(eq(borradoresGrupales.tareaId, tareaId))
    .returning({ respuestas: borradoresGrupales.respuestas });
  return filas.flatMap((f) => rutasBorrador(borradorDeValor(f.respuestas)));
}

/**
 * Al eliminar un equipo: sus borradores se van con él. Devuelve las imágenes que nombraban; quien
 * llama descuenta las que sigue usando una entrega suya.
 */
export async function borrarBorradoresDeEquipo(
  tx: Tx,
  equipoId: string,
): Promise<string[]> {
  const filas = await tx
    .delete(borradoresGrupales)
    .where(eq(borradoresGrupales.equipoId, equipoId))
    .returning({ respuestas: borradoresGrupales.respuestas });
  return filas.flatMap((f) => rutasBorrador(borradorDeValor(f.respuestas)));
}
