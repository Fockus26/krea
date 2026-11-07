// Lógica pura del calendario de la fecha de entrega (D283). Todo trabaja con el día civil ISO
// "aaaa-mm-dd" (el mismo que `lib/fecha.ts`): sin `Date` local ni zona, así el 14/11 es el 14/11
// en cualquier huso y el «hoy» es el que ya calcula el servidor en America/Caracas.

import { comparaFecha, esDiaValido, FECHA_ENTREGA_MAX_DIAS } from "@/lib/fecha";

export const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

/** Lunes primero (semana del liceo). `corto` es lo que se ve; `largo` lo que lee el lector. */
export const DIAS_SEMANA = [
  { corto: "lu", largo: "lunes" },
  { corto: "ma", largo: "martes" },
  { corto: "mi", largo: "miércoles" },
  { corto: "ju", largo: "jueves" },
  { corto: "vi", largo: "viernes" },
  { corto: "sá", largo: "sábado" },
  { corto: "do", largo: "domingo" },
] as const;

export type Mes = { anio: number; mes: number };

const DIA_MS = 86_400_000;

function aIso(ms: number): string {
  const f = new Date(ms);
  const a = String(f.getUTCFullYear()).padStart(4, "0");
  const m = String(f.getUTCMonth() + 1).padStart(2, "0");
  const d = String(f.getUTCDate()).padStart(2, "0");
  return `${a}-${m}-${d}`;
}

function aMs(iso: string): number {
  const [a, m, d] = iso.split("-").map(Number);
  return Date.UTC(a, m - 1, d);
}

function isoDe(anio: number, mes: number, dia: number): string {
  return aIso(Date.UTC(anio, mes - 1, dia));
}

/** "2026-11-14" → `{ anio: 2026, mes: 11 }` (mes de 1 a 12). */
export function mesDe(iso: string): Mes {
  const [anio, mes] = iso.split("-").map(Number);
  return { anio, mes };
}

/** Mes anterior (`-1`) o siguiente (`+1`) con cambio de año. */
export function desplazarMes({ anio, mes }: Mes, n: number): Mes {
  const total = anio * 12 + (mes - 1) + n;
  return { anio: Math.floor(total / 12), mes: (total % 12) + 1 };
}

/** 0 = lunes … 6 = domingo. */
export function diaSemana(iso: string): number {
  return (new Date(aMs(iso)).getUTCDay() + 6) % 7;
}

export function sumarDias(iso: string, n: number): string {
  return aIso(aMs(iso) + n * DIA_MS);
}

/** Suma meses conservando el día; si el mes destino es más corto, el último día (31/01 → 28/02). */
export function sumarMeses(iso: string, n: number): string {
  const [, , dia] = iso.split("-").map(Number);
  const destino = desplazarMes(mesDe(iso), n);
  const ultimo = diasDelMes(destino);
  return isoDe(destino.anio, destino.mes, Math.min(dia, ultimo));
}

export function diasDelMes({ anio, mes }: Mes): number {
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate();
}

/**
 * Semanas (lunes a domingo) que cubren el mes, con los días de los meses vecinos que completan
 * la primera y la última fila. Entre 4 y 6 filas de 7 días ISO.
 */
export function semanasDelMes(mes: Mes): string[][] {
  const primero = isoDe(mes.anio, mes.mes, 1);
  const ultimo = isoDe(mes.anio, mes.mes, diasDelMes(mes));
  const inicio = sumarDias(primero, -diaSemana(primero));
  const fin = sumarDias(ultimo, 6 - diaSemana(ultimo));
  const semanas: string[][] = [];
  for (let d = inicio; comparaFecha(d, fin) <= 0; d = sumarDias(d, 7)) {
    semanas.push(Array.from({ length: 7 }, (_, i) => sumarDias(d, i)));
  }
  return semanas;
}

/** "noviembre de 2026" */
export function tituloMes({ anio, mes }: Mes): string {
  return `${MESES[mes - 1]} de ${anio}`;
}

/** "sábado, 14 de noviembre de 2026"; con `hoy` lo dice: «…, hoy». */
export function etiquetaDia(iso: string, hoy: string): string {
  const [anio, mes, dia] = iso.split("-").map(Number);
  const base = `${DIAS_SEMANA[diaSemana(iso)].largo}, ${dia} de ${MESES[mes - 1]} de ${anio}`;
  return iso === hoy ? `${base}, hoy` : base;
}

/** Rango de días elegibles de una tarea: de hoy a un año (D228); la fecha guardada siempre cabe (D200). */
export type Limites = {
  hoy: string;
  /** Fecha ya guardada de una publicada: se puede conservar aunque haya pasado (D200). */
  fechaGuardada?: string | null;
};

/** Primer y último día que el calendario deja recorrer (la guardada puede ampliar el rango). */
export function rango({ hoy, fechaGuardada }: Limites): {
  min: string;
  max: string;
} {
  let min = hoy;
  let max = sumarDias(hoy, FECHA_ENTREGA_MAX_DIAS);
  if (fechaGuardada && esDiaValido(fechaGuardada)) {
    if (comparaFecha(fechaGuardada, min) < 0) min = fechaGuardada;
    if (comparaFecha(fechaGuardada, max) > 0) max = fechaGuardada;
  }
  return { min, max };
}

/** ¿Se puede elegir? Anterior a hoy o más allá de un año no, salvo la fecha ya guardada (D200). */
export function diaDeshabilitado(iso: string, limites: Limites): boolean {
  if (iso === limites.fechaGuardada) return false;
  return (
    comparaFecha(iso, limites.hoy) < 0 ||
    comparaFecha(iso, sumarDias(limites.hoy, FECHA_ENTREGA_MAX_DIAS)) > 0
  );
}

/** Lleva un día al rango recorrible. */
export function acotar(iso: string, limites: Limites): string {
  const { min, max } = rango(limites);
  if (comparaFecha(iso, min) < 0) return min;
  if (comparaFecha(iso, max) > 0) return max;
  return iso;
}

/** ¿Hay mes anterior / siguiente al que ir? (para deshabilitar las flechas del encabezado) */
export function hayMes(mes: Mes, n: -1 | 1, limites: Limites): boolean {
  const { min, max } = rango(limites);
  const destino = desplazarMes(mes, n);
  const m = mesDe(n < 0 ? min : max);
  return n < 0
    ? destino.anio * 12 + destino.mes >= m.anio * 12 + m.mes
    : destino.anio * 12 + destino.mes <= m.anio * 12 + m.mes;
}

/**
 * Siguiente día con foco según la tecla del patrón ARIA de cuadrícula de fecha: flechas (día /
 * semana), Inicio y Fin (lunes / domingo de la semana), RePág y AvPág (mes; con Mayús, año).
 * `null` si la tecla no mueve el foco.
 */
export function moverFoco(
  iso: string,
  tecla: string,
  limites: Limites,
  mayus = false,
): string | null {
  let destino: string;
  switch (tecla) {
    case "ArrowLeft":
      destino = sumarDias(iso, -1);
      break;
    case "ArrowRight":
      destino = sumarDias(iso, 1);
      break;
    case "ArrowUp":
      destino = sumarDias(iso, -7);
      break;
    case "ArrowDown":
      destino = sumarDias(iso, 7);
      break;
    case "Home":
      destino = sumarDias(iso, -diaSemana(iso));
      break;
    case "End":
      destino = sumarDias(iso, 6 - diaSemana(iso));
      break;
    case "PageUp":
      destino = sumarMeses(iso, mayus ? -12 : -1);
      break;
    case "PageDown":
      destino = sumarMeses(iso, mayus ? 12 : 1);
      break;
    default:
      return null;
  }
  return acotar(destino, limites);
}

/** Día con el que abre: el del campo si es válido y cabe, si no hoy. */
export function focoInicial(valor: string | null, limites: Limites): string {
  const base = valor && esDiaValido(valor) ? valor : limites.hoy;
  return acotar(base, limites);
}
