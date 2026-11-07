// Props de ejemplo del Panel del profesor para la vista previa (D066, D069). Las reales salen de Firestore (fase 07).
// Lo REAL del seed: nombres, equipos, quién es capitán, evaluados y raspados de "Identidad de marca".
// PLACEHOLDER (HANDOFF §8, CONTENT_CHECKLIST fila 78): la cola de entregas (tareas, fechas y quién entregó),
// salvo la 1.ª y la 2.ª que fija el brief de la ola 3; los motivos y fechas de los ajustes (`lib/demo/ajustes.ts`).

import type { DatosPanel } from "@/components/sections/profe-panel/panel-view";
import type { FilaEvaluar } from "@/components/sections/profe-panel/pending-reviews";
import type { FilaAjuste } from "@/components/sections/profe-panel/recent-adjustments";
import { AJUSTES } from "@/lib/demo/ajustes";
import { COLA } from "@/lib/demo/evaluar";
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

/**
 * Las entregas del Panel son las de la cola de Evaluar (`COLA`, mismos ids y mismo orden): cada
 * enlace "Evaluar" del Panel lleva a `/profe/evaluar/[id]`, que existe para todas (D148).
 */
export const ENTREGAS_PANEL: readonly EntregaDemo[] = COLA.map(
  (e): EntregaDemo => {
    const entregadoEn = `${e.fecha}T${e.hora}`;
    if (e.destino.tipo === "equipo") {
      return {
        id: e.id,
        tipo: "grupal",
        equipoId: e.destino.id,
        entregoCedula: e.entregadaPor ?? "",
        tarea: e.tarea.titulo,
        entregadoEn,
      };
    }
    return {
      id: e.id,
      tipo: "individual",
      cedula: e.destino.cedula,
      tarea: e.tarea.titulo,
      entregadoEn,
    };
  },
);

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
    secciones: ["5A", "5C"],
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
