// Carga de una tarea que se hizo en papel antes de la web (caso único, 2026-11-10): crea la tarea
// publicada y deja a sus alumnos como «entregados» y evaluados con el puntaje de cada pregunta, sin
// respuestas (el profe las pasa luego desde la ficha del alumno). Sin `server-only`: la usan
// `scripts/importar-tarea-historica.ts` y las pruebas sobre PGlite.
//
// La tarea y las entregas van en una transacción; cada evaluación pasa por `evaluarEnTransaccion`
// (la misma de la pantalla Evaluar), que escribe la entrega y el ranking de su sección juntos (D175).
// Idempotente: la tarea que ya existe no se pisa y la entrega que ya existe no se vuelve a evaluar.
import { eq } from "drizzle-orm";
import { evaluarEnTransaccion } from "@/lib/data/evaluar";
import { filaDeEntrega, filaDeTarea } from "@/lib/data/filas";
import { leerUsuario } from "@/lib/data/usuarios";
import type { Db } from "@/lib/db";
import { entregas, tareas } from "@/lib/db/schema";
import {
  type Entrega,
  idEntrega,
  sumaValores,
  type Tarea,
  zEntrega,
  zTarea,
} from "@/lib/modelo";

/** Puntos de un alumno, en el orden de las preguntas de la tarea. */
export type NotaHistorica = { cedula: string; puntos: readonly number[] };

export type ResultadoAlumnoHistorico =
  | { cedula: string; estado: "evaluada"; puntaje: number }
  | { cedula: string; estado: "ya-estaba" }
  | {
      cedula: string;
      estado: "error";
      motivo: "no-existe" | "otra-seccion" | "puntos" | string;
    };

export type ResultadoTareaHistorica = {
  tarea: "creada" | "ya-estaba";
  alumnos: ResultadoAlumnoHistorico[];
};

/** Los puntos de cada pregunta (`p.valor` como tope); `null` si no encajan. */
export function puntosPorPregunta(
  tarea: Pick<Tarea, "preguntas">,
  puntos: readonly number[],
): Record<string, number> | null {
  if (puntos.length !== tarea.preguntas.length) return null;
  const out: Record<string, number> = {};
  for (const [i, p] of tarea.preguntas.entries()) {
    const v = puntos[i];
    if (v === undefined || v < 0 || v > p.valor || !Number.isInteger(v * 2))
      return null;
    out[p.id] = v;
  }
  return out;
}

export async function cargarTareaHistorica(
  db: Db,
  {
    id,
    tarea,
    notas,
    autorId,
    ahora,
    ensayo = false,
  }: {
    id: string;
    tarea: Tarea;
    notas: readonly NotaHistorica[];
    /** Cédula del profe que figura como evaluador. */
    autorId: string;
    ahora: number;
    /** Solo dice lo que haría, sin escribir. */
    ensayo?: boolean;
  },
): Promise<ResultadoTareaHistorica> {
  const t = zTarea.parse(tarea);
  const alumnos: ResultadoAlumnoHistorico[] = [];
  const porEvaluar: Array<{
    entregaId: string;
    puntos: Record<string, number>;
  }> = [];

  const creada = await db.transaction(async (tx) => {
    const [existe] = await tx
      .select({ id: tareas.id })
      .from(tareas)
      .where(eq(tareas.id, id));
    if (!existe && !ensayo) await tx.insert(tareas).values(filaDeTarea(id, t));

    for (const n of notas) {
      const puntos = puntosPorPregunta(t, n.puntos);
      if (!puntos) {
        alumnos.push({ cedula: n.cedula, estado: "error", motivo: "puntos" });
        continue;
      }
      const u = await leerUsuario(tx, n.cedula);
      if (!u || u.rol !== "estudiante" || !u.seccion) {
        alumnos.push({
          cedula: n.cedula,
          estado: "error",
          motivo: "no-existe",
        });
        continue;
      }
      if (!t.secciones.includes(u.seccion)) {
        alumnos.push({
          cedula: n.cedula,
          estado: "error",
          motivo: "otra-seccion",
        });
        continue;
      }
      const entregaId = idEntrega(id, n.cedula);
      const [previa] = await tx
        .select({ id: entregas.id })
        .from(entregas)
        .where(eq(entregas.id, entregaId));
      if (previa) {
        alumnos.push({ cedula: n.cedula, estado: "ya-estaba" });
        continue;
      }
      const entrega: Entrega = zEntrega.parse({
        tareaId: id,
        tipo: "individual",
        titularId: n.cedula,
        seccion: u.seccion,
        integrantes: [n.cedula],
        estado: "entregada",
        // Sin respuestas: se cargan después desde la ficha del alumno
        respuestas: {},
        enviadaPor: n.cedula,
        enviadaEn: ahora,
        evaluacion: null,
      });
      if (!ensayo)
        await tx.insert(entregas).values(filaDeEntrega(entregaId, entrega));
      porEvaluar.push({ entregaId, puntos });
      alumnos.push({
        cedula: n.cedula,
        estado: "evaluada",
        puntaje: sumaValores(Object.values(puntos).map((valor) => ({ valor }))),
      });
    }
    return !existe;
  });

  if (!ensayo) {
    for (const { entregaId, puntos } of porEvaluar) {
      const r = await evaluarEnTransaccion(
        db,
        autorId,
        { entregaId, puntos, comentarios: {}, version: null },
        ahora,
      );
      if (!r.ok) {
        const i = alumnos.findIndex(
          (a) => idEntrega(id, a.cedula) === entregaId,
        );
        const cedula = alumnos[i]?.cedula ?? entregaId;
        alumnos[i] = { cedula, estado: "error", motivo: r.error };
      }
    }
  }
  return { tarea: creada ? "creada" : "ya-estaba", alumnos };
}
