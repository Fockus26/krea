// Selector de hora propio (D361): las piezas que elige el profe (hora 1–12, minutos, a. m./p. m.)
// y su ida y vuelta con el valor guardado "HH:MM" (24 h, D352). Puro: sin DOM ni reloj.
import { esHoraValida } from "@/lib/fecha";

export type Periodo = "am" | "pm";
export type PartesHora = { hora: number; minuto: number; periodo: Periodo };

/** Horas del reloj de 12 en el orden en que se leen. */
export const HORAS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
/** Minutos de 5 en 5 (00 a 55). */
export const MINUTOS = Array.from({ length: 12 }, (_, i) => i * 5);

/** "15:30" → 3, 30, p. m. Vacío o inválido → `null`. */
export function partesDeHora(hora: string): PartesHora | null {
  if (!esHoraValida(hora)) return null;
  const [h = 0, m = 0] = hora.split(":").map(Number);
  return {
    hora: h % 12 === 0 ? 12 : h % 12,
    minuto: m,
    periodo: h < 12 ? "am" : "pm",
  };
}

/** 3, 30, p. m. → "15:30"; 12 a. m. → "00:…"; 12 p. m. → "12:…". */
export function horaDePartes({ hora, minuto, periodo }: PartesHora): string {
  const h = (hora % 12) + (periodo === "pm" ? 12 : 0);
  return `${String(h).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
}

/**
 * Primera vez que se toca una hora sin valor: minutos en 00 y el período más probable en el
 * liceo (de 7 a 11, mañana; el resto, tarde).
 */
export function periodoProbable(hora: number): Periodo {
  return hora >= 7 && hora <= 11 ? "am" : "pm";
}

/**
 * Cambia una pieza y devuelve el "HH:MM" nuevo. Sin valor previo, completa lo que falta con
 * 00 y `periodoProbable` (o las 12 si lo primero que se toca es el minuto o el período).
 */
export function cambiarPieza(
  actual: string,
  pieza: Partial<PartesHora>,
): string {
  const base = partesDeHora(actual);
  const hora = pieza.hora ?? base?.hora ?? 12;
  return horaDePartes({
    hora,
    minuto: pieza.minuto ?? base?.minuto ?? 0,
    periodo: pieza.periodo ?? base?.periodo ?? periodoProbable(hora),
  });
}

/** Los minutos que ofrece el selector: de 5 en 5, más el guardado si no cae en ese paso. */
export function minutosConGuardado(actual: string): number[] {
  const m = partesDeHora(actual)?.minuto;
  return m === undefined || MINUTOS.includes(m)
    ? MINUTOS
    : [...MINUTOS, m].sort((a, b) => a - b);
}
