// Props de ejemplo de Equipos del profesor para la vista previa (D066, D069). Las reales salen de
// Firestore (fase 07). Todo viene del seed: equipos, capitanes, temas y puntos de ranking.

import {
  ALUMNOS,
  alumnosDeSeccion,
  type DemoAlumno,
  EQUIPOS,
  integrantes,
  nombreCompleto,
  rankingEquipos,
} from "@/lib/demo/seed";
import type {
  AlumnoEquipo,
  DatosEquiposProfe,
  EquipoVista,
  SeccionEquipos,
} from "@/lib/equipos-profe";

export type { AlumnoEquipo, DatosEquiposProfe, EquipoVista };

function alumnoVista(a: DemoAlumno): AlumnoEquipo {
  return { cedula: a.cedula, nombre: nombreCompleto(a), seed: a.cedula };
}

export function equiposProfeVista(seccion: SeccionEquipos): DatosEquiposProfe {
  const ranking = rankingEquipos(seccion);
  const delSeccion = alumnosDeSeccion(seccion);
  const equipos: EquipoVista[] = ranking.map((e) => ({
    id: e.id,
    nombre: e.nombre,
    tema: e.tema,
    puesto: e.puesto,
    puntos: e.puntos,
    empate: e.empate,
  }));
  return {
    seccion,
    equipos,
    alumnos: Object.fromEntries(
      ALUMNOS.filter((a) => a.seccion === seccion).map((a) => [
        a.cedula,
        alumnoVista(a),
      ]),
    ),
    inicial: {
      equipos: Object.fromEntries(
        EQUIPOS.filter((e) => e.seccion === seccion).map((e) => [
          e.id,
          {
            miembros: integrantes(e).map((m) => m.cedula),
            capitan: e.capitanCedula,
          },
        ]),
      ),
      sinEquipo: delSeccion.filter((a) => !a.equipoId).map((a) => a.cedula),
    },
    total: delSeccion.length,
  };
}
