// Props de ejemplo de Inicio para la vista previa (D066, D069). Las reales salen de Firestore (fase 07).

import type { FilaPendiente } from "@/components/sections/inicio/pending-tasks";
import type { FilaNota } from "@/components/sections/inicio/recent-grades";
import type { ResumenEquipo } from "@/components/sections/inicio/team-summary";
import {
  alumnoPorCedula,
  CEDULA_DEMO,
  type DemoAlumno,
  equipoDe,
  esCapitan,
  integrantes,
  nombreCorto,
  primerNombre,
  rankingAlumnos,
  rankingEquipos,
} from "@/lib/demo/seed";
import { AVANCE_DEMO, notasDe, porEntregar } from "@/lib/demo/tareas";
import { formatFecha } from "@/lib/fecha";
import { notaFinal } from "@/lib/grades";
import {
  capitanTexto,
  desglosePuntos,
  equipoChipTexto,
  equipoMetaTexto,
  lineaPendientes,
} from "@/lib/inicio";

/** PLACEHOLDER: movimiento semanal del ranking (los deltas son de ejemplo, HANDOFF §8). */
export const DELTA_SEMANA_DEMO = 2;
/** Cuántas notas muestra Inicio antes de "Ver todas". */
export const NOTAS_EN_INICIO = 3;

export function inicioDe(alumno: DemoAlumno = alumnoPorCedula(CEDULA_DEMO)) {
  const equipo = equipoDe(alumno);
  const ranking = rankingAlumnos(alumno.seccion);
  const fila = ranking.find((f) => f.cedula === alumno.cedula);
  if (!fila)
    throw new RangeError("El alumno no está en el ranking de su sección");
  const abiertas = porEntregar();

  const notas: FilaNota[] = notasDe(alumno)
    .filter((n) => n.puntaje !== null)
    .slice(0, NOTAS_EN_INICIO)
    .map(({ tarea, puntaje }) => ({
      id: tarea.id,
      href: `/notas/${tarea.id}`,
      titulo: tarea.titulo,
      tipo: tarea.tipo,
      detalle: tarea.tipo === "grupal" ? equipo?.nombre : undefined,
      fecha: formatFecha(tarea.fecha),
      // La base del alumno escala solo sus notas individuales (D014, provisional)
      nota:
        tarea.tipo === "individual" ? notaFinal(puntaje, alumno.base) : puntaje,
      base: tarea.tipo === "individual" ? alumno.base : undefined,
    }));

  const pendientes: FilaPendiente[] = abiertas.map((t) => ({
    id: t.id,
    href: `/tareas/${t.id}`,
    titulo: t.titulo,
    tipo: t.tipo,
    vence: formatFecha(t.fecha),
    premio: t.premio,
    entregasTu: t.tipo === "grupal" && esCapitan(alumno),
    avance: AVANCE_DEMO[t.id] ?? "sin-empezar",
  }));

  let resumen: ResumenEquipo | null = null;
  if (equipo) {
    const equipos = rankingEquipos(alumno.seccion);
    const fe = equipos.find((e) => e.id === equipo.id);
    const miembros = integrantes(equipo);
    const capitan = miembros.find((m) => m.cedula === equipo.capitanCedula);
    resumen = {
      id: equipo.id,
      nombre: equipo.nombre,
      tema: equipo.tema,
      chip: fe ? equipoChipTexto(fe.puesto, equipos.length, fe.puntos) : "",
      meta: equipoMetaTexto(equipo.tema, miembros.length),
      integrantes: miembros.map((m) => ({
        id: m.cedula,
        nombre: nombreCorto(m),
        estilo: "adventurer-neutral",
        seed: m.cedula,
      })),
      // El género no está en el seed (fila 59): "Capitán" por defecto
      capitan: capitanTexto(
        capitan ? nombreCorto(capitan) : "",
        equipo.capitanCedula === alumno.cedula,
      ),
    };
  }

  return {
    alumno,
    saludo: {
      eyebrow: `Sección ${alumno.seccion} · Escuela Creativa`,
      titulo: `¡Hola, ${primerNombre(alumno)}!`,
      linea: lineaPendientes(abiertas.map((t) => ({ fecha: t.fecha }))),
    },
    puntos: {
      puntos: fila.puntos,
      puesto: fila.puesto,
      total: ranking.length,
      seccion: alumno.seccion,
      desglose: desglosePuntos(
        alumno.notaIndividual,
        equipo?.notaGrupal ?? null,
        equipo !== null,
      ),
      deltaSemana: DELTA_SEMANA_DEMO,
    },
    notas,
    pendientes,
    equipo: resumen,
  };
}
