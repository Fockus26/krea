// Ranking en vivo (HANDOFF §8, D007, D011): puestos de competencia 1-2-2-4.

import { puntosRanking } from "./grades";

/** Cuántos puestos finales forman la zona de riesgo. */
export const ZONA_RIESGO = 5;
/** Hasta qué puesto se muestra el chip "Empate" (lógica de UI, ver `mostrarChipEmpate`). */
export const TOP_CHIP_EMPATE = 10;

export interface RankingEntrada {
  id: string;
  puntos: number;
  /** Primer apellido, para desempatar alfabéticamente. Ver `primerApellido`. */
  primerApellido: string;
}

export interface RankingPuesto {
  /** Puesto de competencia: 1, 2, 2, 4… */
  puesto: number;
  /** Comparte puesto con otra fila. */
  empate: boolean;
  /** Dentro de los 5 últimos puestos, incluyendo empatados en el borde. */
  enRiesgo: boolean;
}

/** Primera palabra de los apellidos: "Quintero Arenas" → "Quintero". */
export function primerApellido(apellidos: string): string {
  return apellidos.trim().split(/\s+/)[0] ?? "";
}

const comparaApellido = new Intl.Collator("es", { sensitivity: "base" });

/**
 * Ordena por puntos (desc) y asigna puestos de competencia. Dentro de un empate,
 * orden alfabético por primer apellido (español: la tilde no altera el orden).
 * Devuelve las filas ordenadas, cada una con sus datos originales + `RankingPuesto`.
 * Zona de riesgo = puestos >= al de la fila que ocupa el 5.º lugar desde el final,
 * así los empatados en el borde entran también (puede haber más de 5 filas).
 * Con 5 filas o menos, todas quedan en riesgo.
 */
export function rankCompetition<T extends RankingEntrada>(
  lista: readonly T[],
): Array<T & RankingPuesto> {
  const ordenada = [...lista].sort(
    (a, b) =>
      b.puntos - a.puntos ||
      comparaApellido.compare(a.primerApellido, b.primerApellido),
  );
  const puestos = ordenada.map((fila, i) => {
    let puesto = i + 1;
    while (puesto > 1 && ordenada[puesto - 2].puntos === fila.puntos) puesto--;
    return puesto;
  });
  const puestoBorde = puestos[Math.max(0, ordenada.length - ZONA_RIESGO)];
  return ordenada.map((fila, i) => {
    const puesto = puestos[i];
    return {
      ...fila,
      puesto,
      empate: puestos.filter((p) => p === puesto).length > 1,
      enRiesgo: puesto >= puestoBorde,
    };
  });
}

/** El chip "Empate" solo se muestra en el top 10 (HANDOFF §8). */
export function mostrarChipEmpate(fila: RankingPuesto): boolean {
  return fila.empate && fila.puesto <= TOP_CHIP_EMPATE;
}

/**
 * Puntos del equipo = suma de sus notas grupales que aportan (>= 10) + ajustes del equipo.
 * NO es la suma de los puntos de sus integrantes (HANDOFF §8).
 */
export function puntosEquipo(
  notasGrupales: ReadonlyArray<number | null>,
  ajustes: ReadonlyArray<number> = [],
): number {
  const base = notasGrupales.reduce<number>(
    (suma, n) => suma + puntosRanking(n),
    0,
  );
  return ajustes.reduce((suma, a) => suma + a, base);
}
