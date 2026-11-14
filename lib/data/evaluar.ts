// Evaluar sobre Postgres (fase 07 W7, D204–D205, D327). Sin `server-only` para que las pruebas lo
// corran sobre PGlite; la app lo usa solo desde lib/acciones/evaluar.ts, después de
// `exigirSesion("profesor")` (el autor sale de la sesión).
//
// Evaluar cambia puntos: la entrega y el ranking de su sección se escriben en la MISMA transacción
// (D175), con la sección bloqueada y releída dentro (lib/data/ranking.ts).
import { eq } from "drizzle-orm";
import { entregaDeFila, filaDeEntrega, tareaDeFila } from "@/lib/data/filas";
import { conEntrega, escribirRanking, leerSeccion } from "@/lib/data/ranking";
import type { Db } from "@/lib/db";
import { entregas, tareas } from "@/lib/db/schema";
import {
  armarEvaluacion,
  deshacerEvaluacion,
  entregaEvaluada,
  type GuardarEvaluacion,
  type ResultadoEvaluar,
} from "@/lib/evaluar-datos";

/**
 * Guarda (o corrige) la evaluación de una entrega y recalcula el ranking de su sección. Evaluar
 * no depende del estado de la tarea (una cerrada se sigue evaluando, D202).
 */
export async function evaluarEnTransaccion(
  db: Db,
  autorId: string,
  envio: GuardarEvaluacion,
  ahora: number,
): Promise<ResultadoEvaluar> {
  return db.transaction(async (tx): Promise<ResultadoEvaluar> => {
    const [f] = await tx
      .select()
      .from(entregas)
      .where(eq(entregas.id, envio.entregaId));
    if (!f) return { ok: false, error: "no-existe" };
    // Una fila que no valida no se pisa
    const e = entregaDeFila(f);
    if (!e) return { ok: false, error: "invalida" };
    const { id, ...entrega } = e;
    const datos = await leerSeccion(tx, entrega.seccion);
    // Releída tras el bloqueo: otro profe pudo evaluarla mientras esperábamos el turno. La fila
    // se bloquea (como al enviar, `enviarEnTransaccion`): si el alumno la está editando, se espera
    // a su commit y se ve la versión nueva (D397)
    const [f2] = await tx
      .select()
      .from(entregas)
      .where(eq(entregas.id, id))
      .for("update");
    const actual = f2 ? entregaDeFila(f2) : null;
    if (!actual) return { ok: false, error: "no-existe" };
    const { id: _, ...entregaActual } = actual;
    // El alumno la editó desde que el profe abrió el formulario: no se puntúa lo que no vio
    if (
      envio.enviadaEn !== undefined &&
      envio.enviadaEn !== entregaActual.enviadaEn
    ) {
      return { ok: false, error: "editada" };
    }
    const [ft] = await tx
      .select()
      .from(tareas)
      .where(eq(tareas.id, entregaActual.tareaId));
    if (!ft) return { ok: false, error: "no-existe" };
    const t = tareaDeFila(ft);
    if (!t) return { ok: false, error: "invalida" };
    const { id: __, ...tarea } = t;

    const r = armarEvaluacion({
      entrega: entregaActual,
      tarea,
      envio,
      autorId,
      ahora,
    });
    if (!r.ok) return r;
    const nueva = entregaEvaluada(entregaActual, r.evaluacion);
    await tx
      .update(entregas)
      .set(filaDeEntrega(id, nueva))
      .where(eq(entregas.id, id));
    await escribirRanking(
      tx,
      entregaActual.seccion,
      conEntrega(datos, { id, ...nueva }),
      ahora,
    );
    return { ok: true, id, evaluadaEn: ahora };
  });
}

/** «Deshacer» la evaluación recién guardada (D205) y recalcular el ranking. */
export async function deshacerEvaluacionEnTransaccion(
  db: Db,
  autorId: string,
  entregaId: string,
  evaluadaEn: number,
  ahora: number,
): Promise<ResultadoEvaluar> {
  return db.transaction(async (tx): Promise<ResultadoEvaluar> => {
    const [f] = await tx
      .select({ seccion: entregas.seccion })
      .from(entregas)
      .where(eq(entregas.id, entregaId));
    if (!f) return { ok: false, error: "no-existe" };
    const datos = await leerSeccion(tx, f.seccion);
    const [f2] = await tx
      .select()
      .from(entregas)
      .where(eq(entregas.id, entregaId));
    const e = f2 ? entregaDeFila(f2) : null;
    if (!e) return { ok: false, error: f2 ? "invalida" : "no-existe" };
    const { id: _, ...entrega } = e;
    const r = deshacerEvaluacion(entrega, evaluadaEn, autorId);
    if (!r.ok) return r;
    await tx
      .update(entregas)
      .set(filaDeEntrega(entregaId, r.entrega))
      .where(eq(entregas.id, entregaId));
    await escribirRanking(
      tx,
      entrega.seccion,
      conEntrega(datos, { id: entregaId, ...r.entrega }),
      ahora,
    );
    return { ok: true, id: entregaId, evaluadaEn };
  });
}
