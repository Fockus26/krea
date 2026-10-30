// Datos de ejemplo de las vistas previas de secciones (fase 04, D066). Lo REAL sale del seed
// (`data/seed/`, scripts/import-excel.py): nombres, cédulas, secciones, equipos, capitanes, temas,
// notas individuales/grupales y puntajes de "Identidad de marca". Nada lee Firestore: la fase 07
// cambia la fuente de estos datos, no las secciones que los reciben por props.
import alumnosJson from "@/data/seed/alumnos.json";
import gruposJson from "@/data/seed/grupos.json";
import tareaJson from "@/data/seed/tarea-identidad-marca.json";
import { puntosRanking } from "@/lib/grades";
import {
  primerApellido,
  type RankingPuesto,
  rankCompetition,
} from "@/lib/ranking";

export type Seccion = "5A" | "5C";

export type DemoAlumno = {
  cedula: string;
  seccion: Seccion;
  nombres: string;
  apellidos: string;
  /** Nota individual vigente; `null` = Pendiente (D003). */
  notaIndividual: number | null;
  equipoId: string | null;
  /** Base de evaluación 10–20 (D006). */
  base: number;
};

export type DemoEquipo = {
  id: string;
  nombre: string;
  seccion: Seccion;
  /** `null`: el equipo aún no eligió tema (dos de 5C en el seed). */
  tema: string | null;
  capitanCedula: string;
  /** Nota grupal vigente; `null` = Pendiente. */
  notaGrupal: number | null;
};

export type DemoPregunta = {
  id: string;
  enunciado: string;
  formato: "texto" | "imagen";
  valor: number;
};

export type DemoEvaluacion = {
  cedula: string;
  /** Puntaje obtenido por pregunta, en el orden de `preguntas`. */
  puntos: readonly number[];
  nota: number;
};

export type DemoTareaSeed = {
  id: string;
  titulo: string;
  tipo: "individual" | "grupal";
  preguntas: readonly DemoPregunta[];
  evaluaciones: readonly DemoEvaluacion[];
};

function seccion(valor: string): Seccion {
  if (valor === "5A" || valor === "5C") return valor;
  throw new RangeError(`Sección desconocida en el seed: ${valor}`);
}

export const ALUMNOS: readonly DemoAlumno[] = alumnosJson.map((a) => ({
  cedula: a.cedula,
  seccion: seccion(a.seccion),
  nombres: a.nombres,
  apellidos: a.apellidos,
  notaIndividual: a.notaIndividual,
  equipoId: a.grupoId,
  base: a.baseEvaluacion,
}));

export const EQUIPOS: readonly DemoEquipo[] = gruposJson.map((g) => ({
  id: g.id,
  nombre: g.nombre,
  seccion: seccion(g.seccion),
  tema: g.tema,
  capitanCedula: g.capitanCedula,
  notaGrupal: g.notaGrupal,
}));

export const TAREA_IDENTIDAD: DemoTareaSeed = {
  id: tareaJson.id,
  titulo: tareaJson.titulo,
  tipo: tareaJson.tipo === "grupal" ? "grupal" : "individual",
  preguntas: tareaJson.preguntas.map((p) => ({
    id: p.id,
    enunciado: p.enunciado,
    formato: p.formato === "imagen" ? "imagen" : "texto",
    valor: p.valor,
  })),
  evaluaciones: tareaJson.evaluaciones.map((e) => ({
    cedula: e.cedula,
    puntos: e.puntos,
    nota: e.nota,
  })),
};

/** Estudiante de las vistas previas: Yeilin Duarte, 5A, capitana de G2 (los 37,5 pts del lienzo). */
export const CEDULA_DEMO = "33272397";

export function alumnoPorCedula(cedula: string): DemoAlumno {
  const a = ALUMNOS.find((x) => x.cedula === cedula);
  if (!a) throw new RangeError(`No hay alumno con cédula ${cedula}`);
  return a;
}

export function equipoPorId(id: string): DemoEquipo {
  const e = EQUIPOS.find((x) => x.id === id);
  if (!e) throw new RangeError(`No hay equipo ${id}`);
  return e;
}

export function equipoDe(alumno: DemoAlumno): DemoEquipo | null {
  return alumno.equipoId ? equipoPorId(alumno.equipoId) : null;
}

/** Capitán primero; después por puntos (desc) y primer apellido (HANDOFF §3 Mi equipo). */
export function integrantes(equipo: DemoEquipo): DemoAlumno[] {
  const comp = new Intl.Collator("es", { sensitivity: "base" });
  return ALUMNOS.filter((a) => a.equipoId === equipo.id).sort(
    (a, b) =>
      Number(b.cedula === equipo.capitanCedula) -
        Number(a.cedula === equipo.capitanCedula) ||
      puntosAlumno(b) - puntosAlumno(a) ||
      comp.compare(primerApellido(a.apellidos), primerApellido(b.apellidos)),
  );
}

export function esCapitan(alumno: DemoAlumno): boolean {
  const e = equipoDe(alumno);
  return e !== null && e.capitanCedula === alumno.cedula;
}

/** "Yeilin Marilyn" → "Yeilin". */
export function primerNombre(alumno: Pick<DemoAlumno, "nombres">): string {
  return alumno.nombres.trim().split(/\s+/)[0] ?? "";
}

/** Nombre completo, para filas y encabezados (los nombres largos envuelven, §4). */
export function nombreCompleto(
  alumno: Pick<DemoAlumno, "nombres" | "apellidos">,
): string {
  return `${alumno.nombres} ${alumno.apellidos}`;
}

/** Nombre corto: primer nombre + primer apellido ("Yeilin Duarte"). */
export function nombreCorto(
  alumno: Pick<DemoAlumno, "nombres" | "apellidos">,
): string {
  return `${primerNombre(alumno)} ${primerApellido(alumno.apellidos)}`;
}

/**
 * Puntos de ranking del alumno = nota individual + nota grupal de su equipo, cada una solo si
 * es >= 10 (D007, `puntosRanking`). Los ajustes de conducta llegan con la fase 07.
 */
export function puntosAlumno(alumno: DemoAlumno): number {
  const equipo = equipoDe(alumno);
  return (
    puntosRanking(alumno.notaIndividual) +
    puntosRanking(equipo ? equipo.notaGrupal : null)
  );
}

export function puntosDeEquipo(equipo: DemoEquipo): number {
  return puntosRanking(equipo.notaGrupal);
}

export type FilaRankingAlumno = DemoAlumno & RankingPuesto & { puntos: number };
export type FilaRankingEquipo = DemoEquipo & RankingPuesto & { puntos: number };

/** Ranking de estudiantes de una sección (competencia 1-2-2-4, desempate por primer apellido). */
export function rankingAlumnos(sec: Seccion): FilaRankingAlumno[] {
  return rankCompetition(
    ALUMNOS.filter((a) => a.seccion === sec).map((a) => ({
      ...a,
      id: a.cedula,
      puntos: puntosAlumno(a),
      primerApellido: primerApellido(a.apellidos),
    })),
  );
}

/** Ranking de equipos de una sección; desempata por nombre del equipo. */
export function rankingEquipos(sec: Seccion): FilaRankingEquipo[] {
  return rankCompetition(
    EQUIPOS.filter((e) => e.seccion === sec).map((e) => ({
      ...e,
      puntos: puntosDeEquipo(e),
      primerApellido: e.nombre,
    })),
  );
}

export function alumnosDeSeccion(sec: Seccion): DemoAlumno[] {
  return ALUMNOS.filter((a) => a.seccion === sec);
}
