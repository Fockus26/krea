// Cálculo puro de los puntos del ranking a partir de los documentos de Firestore (D007, D174,
// D176, D177). El servidor lo corre en la misma transacción que evalúa o ajusta, y escribe el
// resultado en `ranking/{seccion}`; el cliente solo lo lee con onSnapshot.
import { NOTA_MIN, notaFinal, puntosRanking } from "@/lib/grades";
import type {
  Ajuste,
  Entrega,
  Equipo,
  RankingSeccion,
  SeccionId,
  Usuario,
} from "@/lib/modelo";

/** Suma en décimas enteras: las notas tienen un decimal (D013) y los ajustes van en medios. */
const decimas = (n: number) => Math.round(n * 10);

/**
 * ¿El profe marcó a este integrante «No participó» en la grupal evaluada? (D364). En una
 * individual nunca: la marca solo existe para las grupales.
 */
export function noParticipo(
  entrega: Pick<Entrega, "tipo" | "estado" | "evaluacion">,
  cedula: string,
): boolean {
  if (entrega.tipo !== "grupal" || entrega.estado !== "evaluada") return false;
  return entrega.evaluacion?.noParticiparon?.includes(cedula) ?? false;
}

/**
 * Base con la que cuenta la nota de un integrante en esta entrega (D403): la que guardó la
 * evaluación para él; si no la trae (evaluaciones de antes, o sin evaluar), su base vigente.
 */
export function baseDeIntegrante(
  entrega: Pick<Entrega, "evaluacion">,
  cedula: string,
  baseVigente: number,
): number {
  return entrega.evaluacion?.bases?.[cedula] ?? baseVigente;
}

/**
 * Nota final de un integrante en una entrega evaluada: puntaje × su base en esa entrega / 20
 * (D006, D013, D403). `base` es la vigente del alumno, de respaldo si la evaluación no guardó la
 * suya. También en las grupales: la base se aplica por integrante (D177); si el profe lo marcó
 * «No participó», `NOTA_MIN` fija, sin base (D365). `null` si no está evaluada.
 */
export function notaDeIntegrante(
  entrega: Entrega,
  base: number,
  cedula: string,
): number | null {
  if (entrega.estado !== "evaluada" || entrega.evaluacion === null) return null;
  if (noParticipo(entrega, cedula)) return NOTA_MIN;
  return notaFinal(
    entrega.evaluacion.puntaje,
    baseDeIntegrante(entrega, cedula, base),
  );
}

/** Puntos de un estudiante: sus notas (individuales y grupales) que aportan + sus ajustes. */
export function puntosDeAlumno(
  alumno: Pick<Usuario, "cedula" | "base">,
  entregas: ReadonlyArray<Entrega>,
  ajustes: ReadonlyArray<Ajuste>,
): number {
  let total = 0;
  for (const e of entregas) {
    if (!e.integrantes.includes(alumno.cedula)) continue;
    total += decimas(
      puntosRanking(notaDeIntegrante(e, alumno.base, alumno.cedula)),
    );
  }
  for (const a of ajustes) {
    if (a.destino === "alumno" && a.destinoId === alumno.cedula)
      total += decimas(a.valor);
  }
  return total / 10;
}

/**
 * Puntos de un equipo: sus notas grupales que aportan (el puntaje, sin base) + ajustes del
 * equipo. No es la suma de sus integrantes (HANDOFF §8).
 */
export function puntosDeEquipoDatos(
  equipoId: string,
  entregas: ReadonlyArray<Entrega>,
  ajustes: ReadonlyArray<Ajuste>,
): number {
  let total = 0;
  for (const e of entregas) {
    if (e.tipo !== "grupal" || e.titularId !== equipoId) continue;
    if (e.estado !== "evaluada" || e.evaluacion === null) continue;
    total += decimas(puntosRanking(e.evaluacion.puntaje));
  }
  for (const a of ajustes) {
    if (a.destino === "equipo" && a.destinoId === equipoId)
      total += decimas(a.valor);
  }
  return total / 10;
}

export type DatosRanking = {
  usuarios: ReadonlyArray<Usuario>;
  equipos: ReadonlyArray<{ id: string } & Equipo>;
  entregas: ReadonlyArray<Entrega>;
  ajustes: ReadonlyArray<Ajuste>;
};

/** Documento `ranking/{seccion}` completo. `ahora` llega por argumento (sin reloj aquí). */
export function calcularRanking(
  seccion: SeccionId,
  datos: DatosRanking,
  ahora: number,
): RankingSeccion {
  const entregas = datos.entregas.filter((e) => e.seccion === seccion);
  const ajustes = datos.ajustes.filter((a) => a.seccion === seccion);

  const alumnos: RankingSeccion["alumnos"] = {};
  for (const u of datos.usuarios) {
    if (u.rol !== "estudiante" || u.seccion !== seccion) continue;
    alumnos[u.cedula] = {
      nombres: u.nombres,
      apellidos: u.apellidos,
      equipoId: u.equipoId,
      estilo: u.avatar.estilo,
      semilla: u.avatar.semilla,
      puntos: puntosDeAlumno(u, entregas, ajustes),
    };
  }

  const equipos: RankingSeccion["equipos"] = {};
  for (const e of datos.equipos) {
    if (e.seccion !== seccion) continue;
    equipos[e.id] = {
      nombre: e.nombre,
      logoPath: e.logoPath,
      puntos: puntosDeEquipoDatos(e.id, entregas, ajustes),
    };
  }

  return { alumnos, equipos, actualizadoEn: ahora };
}
