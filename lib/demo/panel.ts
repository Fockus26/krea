// Props de ejemplo del Panel del profesor para la vista previa (D066, D069). Las reales salen de Firestore (fase 07).
// Lo REAL del seed: nombres, equipos, quién es capitán, evaluados y raspados de "Identidad de marca".
// PLACEHOLDER (HANDOFF §8, CONTENT_CHECKLIST fila 78): la cola de entregas (tareas, fechas y quién entregó),
// salvo la 1.ª y la 2.ª que fija el brief de la ola 3; los motivos y fechas de los ajustes (`lib/demo/ajustes.ts`).

import type { DatosPanel } from "@/components/sections/profe-panel/panel-view";
import type { FilaEvaluar } from "@/components/sections/profe-panel/pending-reviews";
import type { FilaAjuste } from "@/components/sections/profe-panel/recent-adjustments";
import { AJUSTES } from "@/lib/demo/ajustes";
import {
  alumnoPorCedula,
  alumnosDeSeccion,
  type DemoAlumno,
  equipoPorId,
  nombreCorto,
  primerNombre,
  type Seccion,
  TAREA_IDENTIDAD,
} from "@/lib/demo/seed";
import { formatFecha } from "@/lib/fecha";
import { entregaMetaTexto } from "@/lib/panel";
import { primerApellido } from "@/lib/ranking";

/** Entrega pendiente de evaluar. Misma forma de las dos primeras que la cola de Evaluar (W3). */
type EntregaDemo =
  | {
      id: string;
      tipo: "grupal";
      equipoId: string;
      /** Quien entregó (capitán, D012). */
      entregoCedula: string;
      tarea: string;
      /** ISO local sin zona. */
      entregadoEn: string;
    }
  | {
      id: string;
      tipo: "individual";
      cedula: string;
      tarea: string;
      entregadoEn: string;
    };

const LOGO = "Logo y paleta del emprendimiento";
const IDENTIDAD = TAREA_IDENTIDAD.titulo;

/**
 * Las 7 entregas del lienzo (4 individuales · 3 grupales). Las dos primeras son las del brief; el lienzo pinta 5.
 * Las 6.ª y 7.ª son de 5C (elegidas del seed) para que el filtro de sección tenga algo que filtrar.
 */
export const ENTREGAS_PANEL: readonly EntregaDemo[] = [
  {
    id: "5a-g2-logo",
    tipo: "grupal",
    equipoId: "5a-g2",
    entregoCedula: "33272397", // Yeilin Duarte (capitana)
    tarea: LOGO,
    entregadoEn: "2026-10-25T16:12",
  },
  {
    id: "32828381-identidad",
    tipo: "individual",
    cedula: "32828381", // Jorge Quintero
    tarea: IDENTIDAD,
    entregadoEn: "2026-10-24T09:00",
  },
  {
    id: "5a-g6-logo",
    tipo: "grupal",
    equipoId: "5a-g6",
    entregoCedula: "33282883", // Heymi Sierra
    tarea: LOGO,
    entregadoEn: "2026-10-25T11:30",
  },
  {
    id: "33368217-identidad",
    tipo: "individual",
    cedula: "33368217", // Camila Flórez
    tarea: IDENTIDAD,
    entregadoEn: "2026-10-24T14:20",
  },
  {
    id: "5a-g3-logo",
    tipo: "grupal",
    equipoId: "5a-g3",
    entregoCedula: "34126088", // Zaida Carrero
    tarea: LOGO,
    entregadoEn: "2026-10-26T08:45",
  },
  {
    id: "33214862-identidad",
    tipo: "individual",
    cedula: "33214862", // Branger Saray (5C)
    tarea: IDENTIDAD,
    entregadoEn: "2026-10-26T10:10",
  },
  {
    id: "32408800-identidad",
    tipo: "individual",
    cedula: "32408800", // Jeanpier Villegas (5C)
    tarea: IDENTIDAD,
    entregadoEn: "2026-10-26T12:05",
  },
];

function aFilaEvaluar(e: EntregaDemo): FilaEvaluar {
  const fecha = formatFecha(e.entregadoEn.slice(0, 10));
  if (e.tipo === "grupal") {
    const equipo = equipoPorId(e.equipoId);
    return {
      id: e.id,
      seccion: equipo.seccion,
      tipo: "grupal",
      nombre: equipo.nombre,
      nombreCorto: equipo.nombre,
      visual: {
        tipo: "equipo",
        teamId: equipo.id,
        tema: equipo.tema ?? equipo.nombre,
      },
      meta: entregaMetaTexto({
        tarea: e.tarea,
        tipo: "grupal",
        fecha,
        entrego: primerNombre(alumnoPorCedula(e.entregoCedula)),
      }),
    };
  }
  const alumno = alumnoPorCedula(e.cedula);
  return {
    id: e.id,
    seccion: alumno.seccion,
    tipo: "individual",
    nombre: `${nombreCorto(alumno)} · ${alumno.seccion}`,
    nombreCorto: nombreCorto(alumno),
    visual: {
      tipo: "alumno",
      estilo: "adventurer-neutral",
      seed: alumno.cedula,
      nombre: nombreCorto(alumno),
    },
    meta: entregaMetaTexto({ tarea: e.tarea, tipo: "individual", fecha }),
  };
}

function aFilaAjuste(a: (typeof AJUSTES)[number]): FilaAjuste {
  if (a.destino.tipo === "alumno") {
    const alumno = alumnoPorCedula(a.destino.cedula);
    return {
      id: a.id,
      seccion: alumno.seccion,
      nombre: nombreCorto(alumno),
      valor: a.valor,
      motivo: a.motivo,
      fecha: a.fecha,
    };
  }
  const equipo = equipoPorId(a.destino.id);
  return {
    id: a.id,
    seccion: equipo.seccion,
    nombre: `Equipo ${equipo.nombre}`,
    valor: a.valor,
    motivo: a.motivo,
    fecha: a.fecha,
  };
}

/** "María de los Ángeles Méndez": nombres + primer apellido (el lienzo no pone el segundo). */
function nombreRaspado(a: DemoAlumno): string {
  return `${a.nombres} ${primerApellido(a.apellidos)}`;
}

function avanceDe(sec: Seccion) {
  const cedulas = new Set(alumnosDeSeccion(sec).map((a) => a.cedula));
  return {
    evaluados: TAREA_IDENTIDAD.evaluaciones.filter((e) => cedulas.has(e.cedula))
      .length,
    total: cedulas.size,
  };
}

export function panelDe(): DatosPanel {
  return {
    entregas: ENTREGAS_PANEL.map(aFilaEvaluar),
    ajustes: AJUSTES.map(aFilaAjuste),
    tareaEvaluada: TAREA_IDENTIDAD.titulo,
    avance: { "5A": avanceDe("5A"), "5C": avanceDe("5C") },
    raspados: TAREA_IDENTIDAD.evaluaciones
      .filter((e) => e.nota < 10)
      .map((e) => {
        const alumno = alumnoPorCedula(e.cedula);
        return {
          seccion: alumno.seccion,
          nombre: nombreRaspado(alumno),
          nota: e.nota,
        };
      }),
  };
}
