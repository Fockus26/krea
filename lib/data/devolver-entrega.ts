// «Devolver al alumno» y «Eliminar entrega» sobre Postgres (tanda 11-14 X1, D411–D415). Sin
// `server-only` para que las pruebas lo corran sobre PGlite; la app lo usa solo desde
// lib/acciones/devolver-entrega.ts, después de `exigirSesion("profesor")`.
//
// Las dos cambian puntos: la entrega y el ranking de su sección se escriben en la MISMA transacción
// (D175), con la sección bloqueada y la entrega releída con `FOR UPDATE` (como Evaluar, D397: si el
// alumno la está editando, se espera a su commit y se compara con la versión nueva).
import { eq } from "drizzle-orm";
import { entregaDeFila, filaDeEntrega, tareaDeFila } from "@/lib/data/filas";
import { borrarPartesDeEntrega } from "@/lib/data/partes";
import {
  conEntrega,
  type DatosSeccion,
  escribirRanking,
  leerSeccion,
  sinEntrega,
} from "@/lib/data/ranking";
import type { Db, Tx } from "@/lib/db";
import { entregas, tareas } from "@/lib/db/schema";
import {
  comprobarDevolver,
  comprobarEliminar,
  type DevolverEntrega,
  devolverEntrega,
  type EliminarEntrega,
  type ErrorDevolverEntrega,
  type ResultadoDevolver,
} from "@/lib/devolver-entrega";
import { type Entrega, rutasImagen } from "@/lib/modelo";

/** Lo que devuelve eliminar: además, las imágenes que hay que borrar de B2 tras el commit. */
export type ResultadoEliminarTx =
  | { ok: true; id: string; imagenes: string[] }
  | { ok: false; error: ErrorDevolverEntrega };

type Bloqueada =
  | { ok: true; entrega: Entrega; datos: DatosSeccion }
  | { ok: false; error: ErrorDevolverEntrega };

/** Bloquea la sección de la entrega y la relee con `FOR UPDATE` (ya dentro del turno). */
async function bloquearEntrega(tx: Tx, id: string): Promise<Bloqueada> {
  const [f] = await tx
    .select({ seccion: entregas.seccion })
    .from(entregas)
    .where(eq(entregas.id, id));
  if (!f) return { ok: false, error: "no-existe" };
  const datos = await leerSeccion(tx, f.seccion);
  const [f2] = await tx
    .select()
    .from(entregas)
    .where(eq(entregas.id, id))
    .for("update");
  if (!f2) return { ok: false, error: "no-existe" };
  const e = entregaDeFila(f2);
  if (!e) return { ok: false, error: "invalida" };
  const { id: _, ...entrega } = e;
  return { ok: true, entrega, datos };
}

/**
 * Devuelve la entrega al alumno (D411–D412): sin evaluación, `entregada`, y el ranking de su
 * sección recalculado. Solo si la nota es la que el profe veía y la tarea sigue abierta.
 */
export async function devolverEnTransaccion(
  db: Db,
  envio: DevolverEntrega,
  ahora: number,
): Promise<ResultadoDevolver> {
  return db.transaction(async (tx): Promise<ResultadoDevolver> => {
    const b = await bloquearEntrega(tx, envio.entregaId);
    if (!b.ok) return b;
    const { entrega, datos } = b;
    const [ft] = await tx
      .select()
      .from(tareas)
      .where(eq(tareas.id, entrega.tareaId));
    if (!ft) return { ok: false, error: "no-existe" };
    const t = tareaDeFila(ft);
    if (!t) return { ok: false, error: "invalida" };
    const error = comprobarDevolver(entrega, t, envio.evaluadaEn, ahora);
    if (error) return { ok: false, error };

    const id = envio.entregaId;
    const nueva = devolverEntrega(entrega);
    await tx
      .update(entregas)
      .set(filaDeEntrega(id, nueva))
      .where(eq(entregas.id, id));
    await escribirRanking(
      tx,
      entrega.seccion,
      conEntrega(datos, { id, ...nueva }),
      ahora,
    );
    return { ok: true, id };
  });
}

/**
 * Elimina la entrega (D413): borra la fila, las partes de su reparto (D421) y recalcula el ranking
 * de su sección, en cualquier estado de la tarea. Devuelve las rutas de sus imágenes (las de la
 * entrega y las de sus partes) para borrarlas de B2 DESPUÉS del commit.
 */
export async function eliminarEntregaEnTransaccion(
  db: Db,
  envio: EliminarEntrega,
  ahora: number,
): Promise<ResultadoEliminarTx> {
  return db.transaction(async (tx): Promise<ResultadoEliminarTx> => {
    const b = await bloquearEntrega(tx, envio.entregaId);
    if (!b.ok) return b;
    const { entrega, datos } = b;
    const error = comprobarEliminar(entrega, envio);
    if (error) return { ok: false, error };

    const id = envio.entregaId;
    await tx.delete(entregas).where(eq(entregas.id, id));
    // Grupal por partes (D421): el reparto se va con la entrega. Una parte aceptada comparte la
    // imagen con la respuesta del capitán: cada ruta va una sola vez
    const dePartes = await borrarPartesDeEntrega(tx, id);
    await escribirRanking(tx, entrega.seccion, sinEntrega(datos, id), ahora);
    const deEntrega = Object.values(entrega.respuestas).flatMap(rutasImagen);
    return {
      ok: true,
      id,
      imagenes: [...new Set([...deEntrega, ...dePartes])],
    };
  });
}
