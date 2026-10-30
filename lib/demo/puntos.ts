// Props de ejemplo de Ajustes de puntos para la vista previa (D066, D069). Las reales salen de Firestore (fase 07).
// Lo REAL del seed: alumnos, equipos, secciones y puntos actuales del ranking (`rankingAlumnos`/`rankingEquipos`).
// PLACEHOLDER (HANDOFF §8, CONTENT_CHECKLIST filas 92 y 93): motivos y fechas del historial (`AJUSTES_HISTORIAL`),
// el detalle del ejemplo inicial y el estilo de avatar de los alumnos (fila 60).
import { AJUSTES_HISTORIAL, type DemoAjuste } from "@/lib/demo/ajustes";
import {
  alumnoPorCedula,
  equipoPorId,
  nombreCorto,
  rankingAlumnos,
  rankingEquipos,
  type Seccion,
} from "@/lib/demo/seed";
import { USUARIO_PROFESOR } from "@/lib/demo/usuarios";
import {
  type Candidato,
  type FilaHistorial,
  type MotivoId,
  nombreDestino,
  separarMotivo,
  type TipoDestino,
} from "@/lib/puntos";

const SECCIONES: readonly Seccion[] = ["5A", "5C"];

/** Candidatos del combobox por tipo y sección, ordenados por nombre (el profe busca por nombre, no por puesto). */
export type CandidatosPuntos = Record<
  TipoDestino,
  Record<Seccion, Candidato[]>
>;

const porNombre = new Intl.Collator("es", { sensitivity: "base" });

function alumnos(sec: Seccion): Candidato[] {
  return rankingAlumnos(sec)
    .map(
      (a): Candidato => ({
        id: a.cedula,
        tipo: "alumno",
        seccion: a.seccion,
        nombre: nombreCorto(a),
        puntos: a.puntos,
        primerApellido: a.primerApellido,
        // PLACEHOLDER: el estilo de avatar lo elige cada alumno (fila 60 del checklist)
        avatar: {
          tipo: "alumno",
          estilo: "adventurer-neutral",
          seed: a.cedula,
        },
      }),
    )
    .sort((x, y) => porNombre.compare(x.nombre, y.nombre));
}

function equipos(sec: Seccion): Candidato[] {
  return rankingEquipos(sec)
    .map(
      (e): Candidato => ({
        id: e.id,
        tipo: "equipo",
        seccion: e.seccion,
        nombre: e.nombre,
        puntos: e.puntos,
        primerApellido: e.nombre,
        avatar: { tipo: "equipo", tema: e.tema ?? e.nombre, logo: null },
      }),
    )
    .sort((x, y) => porNombre.compare(x.nombre, y.nombre));
}

export function candidatosPuntos(): CandidatosPuntos {
  const vacio = () => ({ "5A": [], "5C": [] }) as Record<Seccion, Candidato[]>;
  const c: CandidatosPuntos = { alumno: vacio(), equipo: vacio() };
  for (const s of SECCIONES) {
    c.alumno[s] = alumnos(s);
    c.equipo[s] = equipos(s);
  }
  return c;
}

function aFila(a: DemoAjuste): FilaHistorial {
  const { motivo, detalle } = separarMotivo(a.motivo, a.detalle);
  const base = {
    id: a.id,
    valor: a.valor,
    motivo,
    fecha: a.fecha,
    profe: a.profe ?? USUARIO_PROFESOR.nombre,
    anulado: AJUSTES_HISTORIAL.some((x) => x.anulaA === a.id),
    nuevo: false,
    ...(detalle === undefined ? {} : { detalle }),
    ...(a.anulaA === undefined ? {} : { anulaA: a.anulaA }),
  };
  if (a.destino.tipo === "alumno") {
    const al = alumnoPorCedula(a.destino.cedula);
    return {
      ...base,
      tipo: "alumno",
      destinoId: al.cedula,
      seccion: al.seccion,
      nombre: nombreDestino("alumno", nombreCorto(al)),
    };
  }
  const eq = equipoPorId(a.destino.id);
  return {
    ...base,
    tipo: "equipo",
    destinoId: eq.id,
    seccion: eq.seccion,
    nombre: nombreDestino("equipo", eq.nombre),
  };
}

/** Historial del lienzo (5 filas). Los puntos del seed ya los incluyen: no suman a la vista previa (D120). */
export function historialPuntos(): FilaHistorial[] {
  return AJUSTES_HISTORIAL.map(aFila);
}

export type InicialAjuste = {
  tipo: TipoDestino;
  seccion: Seccion;
  destinoId: string;
  motivo: MotivoId;
  detalle: string;
};

/** Ejemplo inicial del lienzo: Jorge Quintero (5A) + Participación destacada. */
export const AJUSTE_INICIAL: InicialAjuste = {
  tipo: "alumno",
  seccion: "5A",
  destinoId: "32828381", // Jorge Quintero
  motivo: "participacion",
  // PLACEHOLDER (fila 93): el detalle del lienzo
  detalle: "Explicó su moodboard a toda la clase",
};
