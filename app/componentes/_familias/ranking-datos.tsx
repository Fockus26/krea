import type { PodiumEntrada } from "@/components/krea/podium";
import type { RankListFila } from "@/components/krea/rank-list";
import { TeamLogo } from "@/components/krea/team-logo";
import { UserAvatar } from "@/components/krea/user-avatar";
import { DICEBEAR_ESTILOS } from "@/lib/dicebear";
import { primerApellido, rankCompetition } from "@/lib/ranking";

// Datos de ejemplo del ranking. Nombres, puntos y capitanes son provisionales (CONTENT_CHECKLIST 41–43).
// Los puntos están pensados para ver: empate en el top 10 (3.º), 11–30 y zona de riesgo de 6 filas
// (empate en el borde: el 14.º).
export const ESTUDIANTES = [
  {
    id: "e01",
    nombre: "Valentina Rojas",
    equipo: "5A-G2 Repostería",
    puntos: 42,
  },
  { id: "e02", nombre: "Jorge Quintero", equipo: "5A-G1 Barbería", puntos: 28 },
  {
    id: "e03",
    nombre: "Camila Duarte",
    equipo: "5A-G2 Repostería",
    puntos: 38,
  },
  { id: "e04", nombre: "Diego Salazar", equipo: "5A-G3 Ropa", puntos: 38 },
  { id: "e05", nombre: "Luniel Morón", equipo: "5A-G1 Barbería", puntos: 40.5 },
  { id: "e06", nombre: "María Méndez", equipo: "5A-G3 Ropa", puntos: 33 },
  {
    id: "e07",
    nombre: "Franyer Hernández",
    equipo: "5A-G4 Mascotas",
    puntos: 35.5,
  },
  { id: "e08", nombre: "Sofía Pérez", equipo: "5A-G5 Celulares", puntos: 30.5 },
  {
    id: "e09",
    nombre: "Mariana Linares",
    equipo: "5A-G4 Mascotas",
    puntos: 26.5,
  },
  {
    id: "e10",
    nombre: "Ángel Ñáñez",
    equipo: "5A-G6 Ñandú Studio",
    puntos: 25,
  },
  {
    id: "e11",
    nombre: "Andrea Coronado",
    equipo: "5A-G5 Celulares",
    puntos: 23,
  },
  {
    id: "e12",
    nombre: "Luis Brito",
    equipo: "5A-G6 Ñandú Studio",
    puntos: 21.5,
  },
  {
    id: "e13",
    nombre: "Gabriela Ferrer",
    equipo: "5A-G2 Repostería",
    puntos: 18,
  },
  { id: "e14", nombre: "Samuel Ortega", equipo: "5A-G3 Ropa", puntos: 14.5 },
  {
    id: "e15",
    nombre: "Daniela Pacheco",
    equipo: "5A-G1 Barbería",
    puntos: 14.5,
  },
  {
    id: "e16",
    nombre: "Carlos Bastidas",
    equipo: "5A-G4 Mascotas",
    puntos: 13,
  },
  {
    id: "e17",
    nombre: "Nathalie Reyes",
    equipo: "5A-G5 Celulares",
    puntos: 12.5,
  },
  {
    id: "e18",
    nombre: "Pedro Villalba",
    equipo: "5A-G6 Ñandú Studio",
    puntos: 11,
  },
  { id: "e19", nombre: "Isabella Marcano", equipo: "5A-G3 Ropa", puntos: 9 },
] as const;

type EstudianteId = (typeof ESTUDIANTES)[number]["id"];

/** Cambio de puesto de ejemplo por alumno (+ subió, − bajó, 0 igual; sin dato = sin chip). */
const DELTAS: Partial<Record<EstudianteId, number>> = {
  e01: 0,
  e05: 1,
  e03: 2,
  e07: -1,
  e06: 3,
  e08: 0,
  e02: -2,
  e10: 1,
  e14: -1,
  e16: 0,
  e18: -3,
};

function seedDe(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

/** Estudiantes con puntos (sobrescribibles), ordenados y con puesto/empate/riesgo. */
export function estudiantesOrdenados(
  puntos: Partial<Record<string, number>> = {},
) {
  return rankCompetition(
    ESTUDIANTES.map((e) => ({
      ...e,
      puntos: puntos[e.id] ?? e.puntos,
      primerApellido: primerApellido(e.nombre.split(" ").slice(1).join(" ")),
    })),
  );
}

type Ordenado = ReturnType<typeof estudiantesOrdenados>[number];

export function filaEstudiante(
  e: Ordenado,
  opciones: {
    me?: string;
    deltas?: Partial<Record<string, number>>;
    moving?: string;
    efecto?: { id: string; tipo: "sube" | "riesgo" } | null;
  } = {},
): RankListFila {
  const i = ESTUDIANTES.findIndex((x) => x.id === e.id);
  const deltas = opciones.deltas ?? DELTAS;
  return {
    id: e.id,
    puesto: e.puesto,
    empate: e.empate,
    enRiesgo: e.enRiesgo,
    nombre: e.nombre,
    puntos: e.puntos,
    subtitulo: e.equipo,
    delta: deltas[e.id],
    esTu: opciones.me === e.id,
    moving: opciones.moving === e.id,
    efecto: opciones.efecto?.id === e.id ? opciones.efecto.tipo : undefined,
    media: (
      <UserAvatar
        estilo={DICEBEAR_ESTILOS[i % DICEBEAR_ESTILOS.length]}
        seed={seedDe(e.nombre)}
        nombre={e.nombre}
        size={40}
      />
    ),
  };
}

const EQUIPOS = [
  {
    id: "5a-g2",
    tema: "Repostería",
    integrantes: 5,
    capitan: "Valentina Rojas",
    puntos: 57,
  },
  {
    id: "5a-g3",
    tema: "Ropa",
    integrantes: 5,
    capitan: "María Méndez",
    puntos: 52,
  },
  {
    id: "5a-g5",
    tema: "Celulares",
    integrantes: 5,
    capitan: "Christian Sepúlveda",
    puntos: 51,
  },
  {
    id: "5a-g1",
    tema: "Barbería",
    integrantes: 6,
    capitan: "Jorge Quintero",
    puntos: 51,
  },
  {
    id: "5a-g4",
    tema: "Mascotas",
    integrantes: 5,
    capitan: "Delianyely Romero",
    puntos: 47,
  },
  {
    id: "5a-g6",
    tema: "Ñandú Studio",
    integrantes: 6,
    capitan: "Heymi Sierra",
    puntos: 44,
  },
] as const;

export function equiposOrdenados() {
  return rankCompetition(
    EQUIPOS.map((e) => ({ ...e, primerApellido: e.tema })),
  );
}

/** Filas de equipo: subtítulo "n integrantes · capitán {nombre}", logo de 40. */
export function filasEquipos(): RankListFila[] {
  const deltas = [0, 1, -1, 2, 0, -2];
  return equiposOrdenados().map((e, i) => ({
    id: e.id,
    puesto: e.puesto,
    empate: e.empate,
    enRiesgo: e.enRiesgo,
    nombre: `${e.id.toUpperCase()} ${e.tema}`,
    puntos: e.puntos,
    subtitulo: `${e.integrantes} integrantes · capitán ${e.capitan}`,
    delta: deltas[i],
    media: <TeamLogo teamId={e.id} tema={e.tema} size={40} />,
  }));
}

export function podioEstudiantes(
  filas: ReturnType<typeof estudiantesOrdenados>,
): PodiumEntrada[] {
  return filas.slice(0, 3).map((e) => ({
    tipo: "estudiante",
    id: e.id,
    puesto: e.puesto,
    nombre: e.nombre,
    puntos: e.puntos,
    estilo:
      DICEBEAR_ESTILOS[
        ESTUDIANTES.findIndex((x) => x.id === e.id) % DICEBEAR_ESTILOS.length
      ],
    seed: seedDe(e.nombre),
  }));
}

export function podioEquipos(): PodiumEntrada[] {
  return equiposOrdenados()
    .slice(0, 3)
    .map((e) => ({
      tipo: "equipo",
      id: e.id,
      puesto: e.puesto,
      nombre: `${e.id.toUpperCase()} ${e.tema}`,
      puntos: e.puntos,
      teamId: e.id,
      tema: e.tema,
    }));
}
