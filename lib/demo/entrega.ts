// Props de ejemplo de /tareas y de la entrega para la vista previa (D066, D069).
// Las reales salen de Firestore (fase 07).

import type { FilaPendiente } from "@/components/sections/inicio/pending-tasks";
import type { FilaEntregada } from "@/components/sections/tareas/delivered-tasks";
import type { RespuestasIniciales } from "@/components/sections/tareas/task-answer-form";
import { inicioDe } from "@/lib/demo/inicio";
import {
  alumnoPorCedula,
  CEDULA_DEMO,
  type DemoAlumno,
  equipoDe,
  integrantes,
  nombreCompleto,
  primerNombre,
} from "@/lib/demo/seed";
import { type DemoTarea, TAREAS } from "@/lib/demo/tareas";
import { formatFecha } from "@/lib/fecha";
import { answerImageAlt } from "@/lib/question";
import {
  entregadaTexto,
  eyebrowTarea,
  horaTexto,
  puntosPreguntasTexto,
  venceTexto,
} from "@/lib/tareas";

/** Paola Padilla (5A-G2): integrante que no es capitana, para el aviso de capitán (lienzo Tarea). */
export const CEDULA_NO_CAPITAN = "45021029";

/**
 * PLACEHOLDER: imagen de respuesta (el degradado `.imgans` del lienzo). Las fotos reales llegan
 * con Storage (fase 07; CONTENT_CHECKLIST fila 65).
 */
export const IMAGEN_DEMO = `data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='rgb(247,217,196)'/><stop offset='.55' stop-color='rgb(233,162,123)'/><stop offset='1' stop-color='rgb(181,106,74)'/></linearGradient></defs><rect width='400' height='300' fill='url(#g)'/></svg>",
)}`;

/** /tareas: "Por entregar" (las filas de Inicio) y "Entregadas". */
export function tareasDe(alumno: DemoAlumno = alumnoPorCedula(CEDULA_DEMO)): {
  pendientes: FilaPendiente[];
  entregadas: FilaEntregada[];
} {
  return {
    pendientes: inicioDe(alumno).pendientes,
    // PLACEHOLDER: la fecha de entrega es la de evaluación de la tarea de ejemplo (fila 53)
    entregadas: TAREAS.filter((t) => t.estado === "evaluada").map((t) => ({
      id: t.id,
      href: `/tareas/${t.id}`,
      titulo: t.titulo,
      tipo: t.tipo,
      fecha: entregadaTexto(t.fecha),
    })),
  };
}

/** PLACEHOLDER: respuestas a medias de la capitana (como el lienzo: una lista, una subiendo, una vacía). */
const RESPUESTAS_PRESENTACION: RespuestasIniciales = {
  p1: {
    status: "lista",
    file: { name: "prototipo-cupcakes.jpg", size: 1_258_291, src: IMAGEN_DEMO },
  },
  p2: "A 2 dólares cada cupcake: cubre los ingredientes y la caja, y es lo que gasta un estudiante en la merienda.",
  p4: {
    status: "subiendo",
    progress: 64,
    file: { name: "afiche-lanzamiento.png", size: 2_097_152, src: IMAGEN_DEMO },
  },
};

/** PLACEHOLDER: respuestas completas de la vista "Entregada". */
const RESPUESTAS_ENTREGADAS: Readonly<Record<string, string>> = {
  p2: RESPUESTAS_PRESENTACION.p2 as string,
  p3: "¡Hola! Somos Dulce Prieto. Hacemos cupcakes caseros con recetas de nuestras abuelas y los traemos al liceo todos los viernes.",
};

/** PLACEHOLDER: fecha y hora de la entrega de ejemplo (lienzo: 25/10/2026, 4:12 p. m.). */
const ENTREGADA_EL = new Date(2026, 9, 25, 16, 12);

function tarea(id: string): DemoTarea {
  const t = TAREAS.find((x) => x.id === id);
  if (!t) throw new RangeError(`No hay tarea ${id}`);
  return t;
}

export type ModoEntrega = "capitan" | "no-capitan" | "individual" | "entregada";

/**
 * Modo de la entrega de `/tareas/[tarea]` según los datos: evaluada = entregada; abierta grupal =
 * la ve su capitana (la persona de ejemplo, D069); abierta individual = individual.
 */
export function modoDe(t: DemoTarea): ModoEntrega {
  if (t.estado === "evaluada") return "entregada";
  return t.tipo === "grupal" ? "capitan" : "individual";
}

/**
 * Entrega de una tarea según el modo. Sin `tareaId` usa la tarea de ejemplo del modo (vistas
 * previas de /secciones/tareas); con él, la tarea real de `/tareas/[tarea]`.
 */
export function entregaDe(modo: ModoEntrega, tareaId?: string) {
  const t = tarea(
    tareaId ??
      (modo === "individual" ? "competencia" : "presentacion-producto"),
  );
  const alumno = alumnoPorCedula(
    modo === "no-capitan" ? CEDULA_NO_CAPITAN : CEDULA_DEMO,
  );
  const equipo = equipoDe(alumno);
  const capitan = equipo
    ? integrantes(equipo).find((m) => m.cedula === equipo.capitanCedula)
    : undefined;
  const lector =
    t.tipo === "grupal" && capitan && capitan.cedula !== alumno.cedula;

  return {
    tareaId: t.id,
    tipo: t.tipo,
    titulo: t.titulo,
    eyebrow: eyebrowTarea(t.tipo, equipo?.nombre),
    vence: venceTexto(t.fecha),
    puntos: puntosPreguntasTexto(t.preguntas.map((p) => p.valor)),
    premio: t.tipo === "grupal" ? t.premio : undefined,
    preguntas: t.preguntas,
    autor: primerNombre(alumno),
    capitan:
      lector && capitan
        ? {
            nombre: nombreCompleto(capitan),
            corto: primerNombre(capitan),
            estilo: "adventurer-neutral" as const,
            seed: capitan.cedula,
          }
        : undefined,
    inicial: modo === "capitan" ? RESPUESTAS_PRESENTACION : {},
    entregada:
      modo === "entregada"
        ? {
            quien:
              capitan && t.tipo === "grupal"
                ? nombreCompleto(capitan)
                : nombreCompleto(alumno),
            // PLACEHOLDER: las tareas evaluadas no guardan la fecha de entrega ni las respuestas
            // (CONTENT_CHECKLIST fila 103): se usa la fecha de evaluación y no se listan respuestas
            fecha: formatFecha(tareaId ? t.fecha : "2026-10-25"),
            hora: horaTexto(ENTREGADA_EL),
            respuestas: (tareaId ? [] : t.preguntas).map((p, i) =>
              p.formato === "texto"
                ? {
                    tipo: "texto" as const,
                    texto: RESPUESTAS_ENTREGADAS[p.id] ?? "",
                  }
                : {
                    tipo: "imagen" as const,
                    src: IMAGEN_DEMO,
                    alt: answerImageAlt(primerNombre(capitan ?? alumno), i + 1),
                  },
            ),
          }
        : undefined,
  };
}
