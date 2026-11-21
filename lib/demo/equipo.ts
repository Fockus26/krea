// Props de ejemplo de Mi equipo para la vista previa (D066, D069). Las reales salen de Firestore (fase 07).

import type { DatosEquipo } from "@/components/sections/equipo/team-hero";
import type { Integrante } from "@/components/sections/equipo/team-members";
import type { PremioGanado } from "@/components/sections/equipo/team-prizes";
import type { FilaNota } from "@/components/sections/inicio/recent-grades";
import {
  alumnoPorCedula,
  CEDULA_DEMO,
  type DemoAlumno,
  EQUIPOS,
  equipoDe,
  integrantes,
  nombreCompleto,
  puntosAlumno,
  rankingEquipos,
} from "@/lib/demo/seed";
import { TAREAS } from "@/lib/demo/tareas";
import { enJuegoTexto, ganadorPremio, premioGanadoTexto } from "@/lib/equipo";
import { equipoMetaTexto, puestoTexto } from "@/lib/inicio";
import { fechaNotaTexto } from "@/lib/notas";

/** Hugo (5A) no tiene equipo en el seed: para el vacío. */
export const CEDULA_SIN_EQUIPO = "45019792";

export type FilaNotaEquipo = FilaNota & { enJuego?: string };

export function equipoVistaDe(
  alumno: DemoAlumno = alumnoPorCedula(CEDULA_DEMO),
): {
  equipo: DatosEquipo;
  integrantes: Integrante[];
  notas: FilaNotaEquipo[];
  premios: PremioGanado[];
} | null {
  const equipo = equipoDe(alumno);
  if (!equipo) return null;
  const ranking = rankingEquipos(alumno.seccion);
  const fila = ranking.find((e) => e.id === equipo.id);
  const miembros = integrantes(equipo);
  const grupales = TAREAS.filter((t) => t.tipo === "grupal");
  // La única nota grupal del seed es la vigente de cada equipo: es la de la tarea grupal evaluada
  const evaluadas = grupales.filter((t) => t.estado === "evaluada");

  return {
    equipo: {
      id: equipo.id,
      nombre: equipo.nombre,
      tema: equipo.tema,
      eyebrowSeccion: alumno.seccion,
      meta: equipoMetaTexto(equipo.tema, miembros.length),
      puesto: fila ? puestoTexto(fila.puesto, ranking.length) : "—",
      puntos: fila?.puntos ?? 0,
    },
    integrantes: miembros.map((m) => ({
      id: m.cedula,
      nombre: nombreCompleto(m),
      estilo: "adventurer-neutral",
      seed: m.cedula,
      puntos: puntosAlumno(m),
      esTu: m.cedula === alumno.cedula,
      esCapitan: m.cedula === equipo.capitanCedula,
    })),
    notas: grupales.map((t) => {
      const nota = t.estado === "evaluada" ? equipo.notaGrupal : null;
      return {
        id: t.id,
        href: `/notas/${t.id}`,
        titulo: t.titulo,
        tipo: "grupal",
        fecha: fechaNotaTexto(nota !== null, t.fecha),
        nota,
        enJuego: nota === null && t.premio ? enJuegoTexto(t.premio) : undefined,
      };
    }),
    premios: evaluadas.flatMap((t) => {
      if (!t.premio || equipo.notaGrupal === null) return [];
      const rivales = EQUIPOS.filter((e) => e.seccion === equipo.seccion).map(
        (e) => ({ id: e.id, nota: e.notaGrupal }),
      );
      return ganadorPremio(rivales) === equipo.id
        ? [
            {
              id: t.id,
              premio: t.premio,
              detalle: premioGanadoTexto(t.titulo, equipo.notaGrupal),
            },
          ]
        : [];
    }),
  };
}
