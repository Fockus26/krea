// Textos y lógica de Perfil (HANDOFF §3 Perfil; lienzo design/canvas/Perfil.dc.html).
// Lógica pura, sin React.
import type { DicebearEstilo } from "@/lib/dicebear";
import { formatNota } from "@/lib/grades";

/** "33272397" → "C.I. 33.272.397": puntos de miles solo para mostrar (la cédula se guarda sin ellos). */
export function cedulaTexto(cedula: string): string {
  const conPuntos = cedula.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `C.I. ${conPuntos}`;
}

/** "Capitán · 5A-G2" (el lienzo dice "Capitana" para Yeilin: el género va por prop, D075). */
export function capitanChipTexto(equipoId: string, femenino = false): string {
  const corto = equipoId.toUpperCase();
  return `${femenino ? "Capitana" : "Capitán"} · ${corto}`;
}

/** Chip de base: solo si no es 20 (D006). */
export function baseChipTexto(base: number): string | null {
  return base === 20 ? null : `Base ${formatNota(base)}`;
}

/**
 * Nombres y apellidos en los 4 campos del lienzo: el primero es la primera palabra y el
 * segundo, el resto ("María de los Ángeles" → "María" + "de los Ángeles"). Vacío si no hay.
 */
export function partirNombre(completo: string): [string, string] {
  const [primero = "", ...resto] = completo.trim().split(/\s+/);
  return [primero, resto.join(" ")];
}

/** Pestañas de estilo de avatar (§3 Perfil), en el orden del lienzo. */
export const ESTILOS_AVATAR: ReadonlyArray<{
  estilo: DicebearEstilo;
  texto: string;
}> = [
  { estilo: "adventurer-neutral", texto: "Aventurero" },
  { estilo: "fun-emoji", texto: "Emoji" },
  { estilo: "bottts-neutral", texto: "Robot" },
  { estilo: "notionists-neutral", texto: "Retrato" },
];

export const OPCIONES_POR_TANDA = 8;

/**
 * Semillas de una tanda de 8 opciones. La tanda 0 empieza por la semilla actual (la opción
 * elegida se ve primero); "Otros 8" pasa a la siguiente tanda. Deterministas: la misma tanda
 * muestra los mismos avatares (no hay azar en el render).
 */
export function semillasAvatar(base: string, tanda: number): string[] {
  return Array.from({ length: OPCIONES_POR_TANDA }, (_, i) =>
    tanda === 0 && i === 0 ? base : `${base}-${tanda}-${i}`,
  );
}

/** Nombre accesible de una opción: "Opción 1, elegida" sale de aria-checked; aquí solo "Opción 1". */
export function opcionAvatarTexto(n: number): string {
  return `Opción ${n}`;
}
