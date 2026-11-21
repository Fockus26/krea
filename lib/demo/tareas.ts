// Tareas de ejemplo de las vistas previas (D066). Solo "Identidad de marca" es real (seed); las demás
// son las del prototipo (design/prototype/app.js `allTasks`) y son PLACEHOLDER: títulos, fechas,
// premios y preguntas (CONTENT_CHECKLIST fila 53). Las notas que muestran sí son reales: la individual
// de "Identidad de marca" y la grupal vigente de cada equipo (seed).

import {
  type DemoAlumno,
  type DemoPregunta,
  equipoDe,
  TAREA_IDENTIDAD,
} from "@/lib/demo/seed";
import { comparaFecha } from "@/lib/fecha";
import type { AvanceEntrega } from "@/lib/inicio";

export type TipoTarea = "individual" | "grupal";
export type EstadoTarea = "abierta" | "evaluada";

export type DemoTarea = {
  id: string;
  titulo: string;
  tipo: TipoTarea;
  estado: EstadoTarea;
  /** Día civil ISO: fecha de entrega (abierta) o de evaluación (evaluada). */
  fecha: string;
  /** Grupal o individual (D263). */
  premio?: string;
  preguntas: readonly DemoPregunta[];
};

export const TAREAS: readonly DemoTarea[] = [
  {
    id: TAREA_IDENTIDAD.id,
    titulo: TAREA_IDENTIDAD.titulo,
    tipo: "individual",
    estado: "evaluada",
    fecha: "2026-10-10",
    preguntas: TAREA_IDENTIDAD.preguntas,
  },
  {
    id: "logo-y-paleta",
    titulo: "Logo y paleta de la marca",
    tipo: "grupal",
    estado: "evaluada",
    fecha: "2026-10-17",
    premio: "Cuenta Canva Pro por 3 meses para todo el equipo",
    preguntas: [],
  },
  {
    id: "presentacion-producto",
    titulo: "Presentación del producto",
    tipo: "grupal",
    estado: "abierta",
    fecha: "2026-11-07",
    premio: "Salida al cine con todo pago",
    preguntas: [
      {
        id: "p1",
        enunciado: "Sube una foto del prototipo de tu producto",
        formato: "imagen",
        valor: 6,
      },
      {
        id: "p2",
        enunciado: "¿A qué precio lo venderían y por qué?",
        formato: "texto",
        valor: 4,
      },
      {
        id: "p3",
        enunciado: "Escribe el guion de 1 minuto para presentarlo",
        formato: "texto",
        valor: 6,
      },
      {
        id: "p4",
        enunciado: "Sube el afiche de lanzamiento",
        formato: "imagen",
        valor: 4,
      },
    ],
  },
  {
    id: "competencia",
    titulo: "Análisis de la competencia",
    tipo: "individual",
    estado: "abierta",
    fecha: "2026-11-03",
    preguntas: [
      {
        id: "p1",
        enunciado: "Nombra 3 marcas que vendan lo mismo que tu equipo",
        formato: "texto",
        valor: 6,
      },
      {
        id: "p2",
        enunciado: "¿Qué hacen mejor que ustedes?",
        formato: "texto",
        valor: 7,
      },
      {
        id: "p3",
        enunciado: "Sube una captura del perfil de una de ellas",
        formato: "imagen",
        valor: 7,
      },
    ],
  },
];

/** PLACEHOLDER: qué tareas tiene empezadas el alumno de la vista previa (el borrador vive en el teléfono, §3). */
export const AVANCE_DEMO: Readonly<Record<string, AvanceEntrega>> = {
  "presentacion-producto": "borrador",
  competencia: "sin-empezar",
};

export type NotaDeTarea = {
  tarea: DemoTarea;
  /** Puntaje sobre 20 sin escalar; `null` = Pendiente (D003). */
  puntaje: number | null;
};

/**
 * Notas del alumno: la individual real de "Identidad de marca" y, en las grupales, la nota grupal
 * vigente de su equipo (seed). Orden de §3 Mis notas: evaluadas más recientes primero, luego
 * pendientes por fecha.
 */
export function notasDe(alumno: DemoAlumno): NotaDeTarea[] {
  const equipo = equipoDe(alumno);
  const notas = TAREAS.map((tarea): NotaDeTarea => {
    if (tarea.estado !== "evaluada") return { tarea, puntaje: null };
    if (tarea.tipo === "grupal") {
      return { tarea, puntaje: equipo ? equipo.notaGrupal : null };
    }
    // La única individual evaluada es la del seed
    const ev = TAREA_IDENTIDAD.evaluaciones.find(
      (e) => e.cedula === alumno.cedula,
    );
    return { tarea, puntaje: ev?.nota ?? null };
  });
  return ordenarNotas(notas);
}

export function ordenarNotas(notas: readonly NotaDeTarea[]): NotaDeTarea[] {
  const evaluadas = notas
    .filter((n) => n.puntaje !== null)
    .sort((a, b) => comparaFecha(b.tarea.fecha, a.tarea.fecha));
  const pendientes = notas
    .filter((n) => n.puntaje === null)
    .sort((a, b) => comparaFecha(a.tarea.fecha, b.tarea.fecha));
  return [...evaluadas, ...pendientes];
}

/** Tareas abiertas por fecha de entrega (la más cercana primero). */
export function porEntregar(): DemoTarea[] {
  return TAREAS.filter((t) => t.estado === "abierta").sort((a, b) =>
    comparaFecha(a.fecha, b.fecha),
  );
}
