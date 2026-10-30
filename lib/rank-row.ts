// Textos y tipos de fila del ranking (HANDOFF §2.9–2.10, §6, §8). Puro: sin React.

import { type RankingPuesto, TOP_CHIP_EMPATE } from "./ranking";
import { formatDecimal } from "./stepper";

export const RIESGO_SEPARADOR = "Zona de riesgo · 5 últimos";

export type RankRowKind = "top" | "normal" | "riesgo";

/**
 * Tipo visual de la fila. La zona de riesgo gana sobre el top 10: con 10 alumnos o menos los
 * puestos finales caen en los dos y la fila apagada es la que dice la verdad del ranking.
 * Top 10 = puesto de competencia <= 10 (un 10.º empatado cuenta).
 */
export function rankRowKind(
  fila: Pick<RankingPuesto, "puesto" | "enRiesgo">,
): RankRowKind {
  if (fila.enRiesgo) return "riesgo";
  return fila.puesto <= TOP_CHIP_EMPATE ? "top" : "normal";
}

/** "30,5 puntos", "1 punto". Los puntos del ranking van con coma es-VE (nunca `toFixed`). */
export function puntosTexto(puntos: number): string {
  return `${formatDecimal(puntos)} ${puntos === 1 ? "punto" : "puntos"}`;
}

export type DeltaDir = "up" | "down" | "eq";

export function deltaDir(delta: number): DeltaDir {
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "eq";
}

/** Texto visible del chip: el número de puestos, o "=" si no cambió. */
export function deltaVisible(delta: number): string {
  return delta === 0 ? "=" : String(Math.abs(delta));
}

/** Texto accesible del chip: "subió 2 puestos", "bajó 1 puesto", "sin cambios". */
export function deltaTexto(delta: number): string {
  const n = Math.abs(delta);
  if (delta === 0) return "sin cambios";
  return `${delta > 0 ? "subió" : "bajó"} ${n} ${n === 1 ? "puesto" : "puestos"}`;
}

export type RankRowLabelInput = {
  puesto: number;
  nombre: string;
  puntos: number;
  /** Puestos que subió (+) o bajó (−); omitido = no se informa. */
  delta?: number;
  empate?: boolean;
  esTu?: boolean;
};

/** Nombre accesible del `<li>`: "Puesto 4, María Méndez, 30,5 puntos, subió 2 puestos". */
export function rankRowLabel({
  puesto,
  nombre,
  puntos,
  delta,
  empate,
  esTu,
}: RankRowLabelInput): string {
  const partes = [`Puesto ${puesto}`, nombre, puntosTexto(puntos)];
  if (delta !== undefined) partes.push(deltaTexto(delta));
  if (empate) partes.push("empatado");
  if (esTu) partes.push("eres tú");
  return partes.join(", ");
}

/** Nombre accesible de una columna del podio: "Puesto 1, María Méndez, 42 puntos". */
export function podiumLabel(
  entrada: Pick<RankRowLabelInput, "puesto" | "nombre" | "puntos">,
): string {
  return rankRowLabel(entrada);
}

/**
 * Parte la lista en dos justo antes de la primera fila en riesgo, para pintar el separador
 * entre dos `<ol>`. Las filas en riesgo van siempre al final (vienen de `rankCompetition`).
 */
export function splitRiesgo<T extends { enRiesgo: boolean }>(
  filas: readonly T[],
): { principal: T[]; riesgo: T[] } {
  const corte = filas.findIndex((f) => f.enRiesgo);
  if (corte === -1) return { principal: [...filas], riesgo: [] };
  return { principal: filas.slice(0, corte), riesgo: filas.slice(corte) };
}

// ---- Anuncios de texto (HANDOFF §6): región viva única por página ----

export type RankEvento =
  | { tipo: "sube"; nombre: string; puesto: number }
  | { tipo: "podio"; nombre: string }
  | { tipo: "riesgo"; nombre: string };

export function anuncioTexto(evento: RankEvento): string {
  switch (evento.tipo) {
    case "sube":
      return `${evento.nombre} subió al puesto ${evento.puesto}`;
    case "podio":
      return `${evento.nombre} entró al podio`;
    case "riesgo":
      return `${evento.nombre} bajó a la zona de riesgo`;
  }
}

/** Uno solo → su frase; varios (llegan en 1 s) → "3 cambios en el ranking: a; b; c". */
export function agruparAnuncios(eventos: readonly RankEvento[]): string {
  if (eventos.length === 0) return "";
  if (eventos.length === 1) return anuncioTexto(eventos[0]);
  return `${eventos.length} cambios en el ranking: ${eventos.map(anuncioTexto).join("; ")}`;
}
