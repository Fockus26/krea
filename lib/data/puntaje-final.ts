// Puntaje final de la tarea 1 sobre Postgres (`lib/puntaje-final`). Sin `server-only` para que las
// pruebas lo corran sobre PGlite; la app lo usa solo desde lib/acciones/puntaje-final.ts, después
// de `exigirSesion("profesor")` (el autor sale de la sesión).
//
// Cambia puntos: la entrega y el ranking de la sección se escriben en la MISMA transacción (D175),
// con la sección bloqueada y la entrega releída dentro (como Evaluar).
import { eq } from "drizzle-orm";
import { entregaDeFila, filaDeEntrega, tareaDeFila } from "@/lib/data/filas";
import { conEntrega, escribirRanking, leerSeccion } from "@/lib/data/ranking";
import { leerUsuario } from "@/lib/data/usuarios";
import type { Db } from "@/lib/db";
import { entregas, tareas } from "@/lib/db/schema";
import {
  type Entrega,
  type Evaluacion,
  idEntrega,
  zEntrega,
} from "@/lib/modelo";
import {
  type PonerPuntajeFinal,
  type ResultadoPuntajeFinal,
  TAREA_PUNTAJE_FINAL,
} from "@/lib/puntaje-final";

/**
 * Pone (o cambia) el puntaje final del alumno en la tarea 1, sin puntaje por pregunta
 * (`puntos: null`). Si ya entregó, la entrega conserva sus respuestas; si no, se crea evaluada y
 * sin respuestas, y el alumno las sube después sin perder la nota.
 */
export async function ponerPuntajeFinalEnTransaccion(
  db: Db,
  autorId: string,
  { cedula, puntaje }: PonerPuntajeFinal,
  ahora: number,
  tareaId: string = TAREA_PUNTAJE_FINAL,
): Promise<ResultadoPuntajeFinal> {
  return db.transaction(async (tx): Promise<ResultadoPuntajeFinal> => {
    const u = await leerUsuario(tx, cedula);
    if (!u || u.rol !== "estudiante" || u.seccion === null)
      return { ok: false, error: "no-existe" };
    const seccion = u.seccion;
    const [ft] = await tx.select().from(tareas).where(eq(tareas.id, tareaId));
    const t = ft ? tareaDeFila(ft) : null;
    if (
      !t ||
      t.estado === "borrador" ||
      t.tipo !== "individual" ||
      !t.secciones.includes(seccion)
    )
      return { ok: false, error: "sin-tarea" };

    const datos = await leerSeccion(tx, seccion);
    const id = idEntrega(tareaId, cedula);
    const [fe] = await tx.select().from(entregas).where(eq(entregas.id, id));
    const previa = fe ? entregaDeFila(fe) : null;
    // Una fila que existe pero no valida no se pisa
    if (fe && !previa) return { ok: false, error: "invalida" };

    const evaluacion: Evaluacion = {
      puntos: null,
      comentarios: {},
      puntaje,
      evaluadaPor: autorId,
      evaluadaEn: ahora,
    };
    let nueva: Entrega;
    if (previa) {
      const { id: _, ...e } = previa;
      nueva = {
        ...e,
        estado: "evaluada",
        evaluacion,
        evaluacionAnterior: e.evaluacion,
      };
    } else {
      nueva = {
        tareaId,
        tipo: "individual",
        titularId: cedula,
        seccion,
        integrantes: [cedula],
        estado: "evaluada",
        respuestas: {},
        enviadaPor: null,
        enviadaEn: null,
        evaluacion,
      };
    }
    const doc = zEntrega.safeParse(nueva);
    if (!doc.success) return { ok: false, error: "invalida" };
    const fila = filaDeEntrega(id, doc.data);
    await tx
      .insert(entregas)
      .values(fila)
      .onConflictDoUpdate({ target: entregas.id, set: fila });
    await escribirRanking(
      tx,
      seccion,
      conEntrega(datos, { id, ...doc.data }),
      ahora,
    );
    return { ok: true };
  });
}
