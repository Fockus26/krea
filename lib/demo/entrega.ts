// Props de ejemplo de /tareas y de la entrega para la vista previa (D066, D069).
// Las reales salen de Firestore (fase 07).

import type { FilaPendiente } from "@/components/sections/inicio/pending-tasks";
import type { FilaEntregada } from "@/components/sections/tareas/delivered-tasks";
import type { ParteDeIntegrante } from "@/components/sections/tareas/partes-integrante";
import type { FilaRepartoPanel } from "@/components/sections/tareas/reparto-panel";
import type {
  BloqueoPregunta,
  RespuestasIniciales,
} from "@/components/sections/tareas/task-answer-form";
import { inicioDe } from "@/lib/demo/inicio";
import {
  alumnoPorCedula,
  CEDULA_DEMO,
  type DemoAlumno,
  equipoDe,
  integrantes,
  nombreCompleto,
  nombreCorto,
  primerNombre,
} from "@/lib/demo/seed";
import { type DemoTarea, TAREAS } from "@/lib/demo/tareas";
import { formatFecha } from "@/lib/fecha";
import { bloqueoTexto, parteTomadaTexto } from "@/lib/partes";
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
    premio: t.premio,
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

/* ---------- Reparto (D422, D461) ---------- */

export type ModoReparto = "reparto-capitan" | "reparto-integrante";

/**
 * Galería del reparto de «Presentación del producto» (D529), con el equipo real 5A-G2: una
 * pregunta por estado. p1 entregada al capitán por otro integrante; p2 aceptada, p3 asignada sin
 * entregar y p4 tomada por la capitana («La respondo yo»), las tres de Paola. `capitan`: el panel
 * Reparto y los bloqueos de su formulario; `integrante`: lo que ve Paola. Los datos los arma la
 * página real con `repartoVista`; aquí van a mano, con los mismos textos.
 */
export function repartoDe(modo: ModoReparto) {
  const t = tarea("presentacion-producto");
  const capitana = alumnoPorCedula(CEDULA_DEMO);
  const paola = alumnoPorCedula(CEDULA_NO_CAPITAN);
  const equipo = equipoDe(capitana);
  const otro =
    (equipo ? integrantes(equipo) : []).find(
      (a) => a.cedula !== capitana.cedula && a.cedula !== paola.cedula,
    ) ?? paola;
  const texto = (id: string) => ({
    tipo: "texto" as const,
    texto: RESPUESTAS_ENTREGADAS[id] ?? "",
  });
  const imagen = (autor: DemoAlumno, numero: number) => ({
    tipo: "imagen" as const,
    src: IMAGEN_DEMO,
    alt: answerImageAlt(primerNombre(autor), numero),
  });

  if (modo === "reparto-integrante") {
    const partes: ParteDeIntegrante[] = [
      { mia: false, bloqueadaPor: primerNombre(otro) },
      {
        mia: true,
        estado: "aceptada",
        inicial: RESPUESTAS_ENTREGADAS.p2 ?? null,
        respuesta: texto("p2"),
      },
      { mia: true, estado: "asignada", inicial: null, respuesta: null },
      {
        mia: false,
        bloqueadaPor: primerNombre(capitana),
        aviso: parteTomadaTexto(primerNombre(capitana)),
      },
    ];
    return {
      modo,
      tareaId: t.id,
      preguntas: t.preguntas,
      partes,
      capitan: primerNombre(capitana),
      autor: primerNombre(paola),
      titular: paola.cedula,
    } as const;
  }

  const filas: FilaRepartoPanel[] = [
    {
      preguntaId: "p1",
      numero: 1,
      enunciado: t.preguntas[0]?.enunciado ?? "",
      asignado: otro.cedula,
      nombre: nombreCorto(otro),
      estado: "entregada",
      respuesta: imagen(otro, 1),
    },
    {
      preguntaId: "p2",
      numero: 2,
      enunciado: t.preguntas[1]?.enunciado ?? "",
      asignado: paola.cedula,
      nombre: nombreCorto(paola),
      estado: "aceptada",
      respuesta: texto("p2"),
    },
    {
      preguntaId: "p3",
      numero: 3,
      enunciado: t.preguntas[2]?.enunciado ?? "",
      asignado: paola.cedula,
      nombre: nombreCorto(paola),
      estado: "asignada",
      respuesta: null,
    },
    {
      preguntaId: "p4",
      numero: 4,
      enunciado: t.preguntas[3]?.enunciado ?? "",
      asignado: paola.cedula,
      nombre: nombreCorto(paola),
      estado: "tomada",
      respuesta: null,
    },
  ];
  // Las de otros, vigentes y no tomadas, van en solo lectura en su formulario (D462)
  const bloqueos: Record<string, BloqueoPregunta> = {
    p1: {
      texto: bloqueoTexto("entregada", nombreCorto(otro)),
      respuesta: imagen(otro, 1),
      aceptada: false,
      nombre: nombreCorto(otro),
      tomable: false,
    },
    p2: {
      texto: bloqueoTexto("aceptada", nombreCorto(paola)),
      respuesta: texto("p2"),
      aceptada: true,
      nombre: nombreCorto(paola),
      tomable: false,
    },
    p3: {
      texto: bloqueoTexto("asignada", nombreCorto(paola)),
      respuesta: null,
      aceptada: false,
      nombre: nombreCorto(paola),
      tomable: true,
    },
  };
  return {
    modo,
    tareaId: t.id,
    preguntas: t.preguntas,
    filas,
    integrantes: (equipo ? integrantes(equipo) : [])
      .filter((a) => a.cedula !== capitana.cedula)
      .map((a) => ({ id: a.cedula, nombre: nombreCorto(a) })),
    bloqueos,
    autor: primerNombre(capitana),
  } as const;
}
