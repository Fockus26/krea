// Textos y lógica de Perfil (HANDOFF §3 Perfil; lienzo design/canvas/Perfil.dc.html).
// Lógica pura, sin React.
import { z } from "zod";
import { PASSWORD_MIN, validarPassword } from "@/lib/auth";
import { DICEBEAR_ESTILOS, type DicebearEstilo } from "@/lib/dicebear";
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

/* ---------- Lo que Perfil guarda (fase 07, D191, D192) ---------- */

/**
 * Avatar elegido por el alumno: uno de los 4 estilos y una semilla de las que ofrece Perfil
 * (`semillasAvatar` con su cédula). Así nadie guarda una semilla arbitraria por el body.
 */
export function zAvatarElegido(cedula: string) {
  const semilla = new RegExp(
    `^${cedula}(-\\d{1,6}-[0-${OPCIONES_POR_TANDA - 1}])?$`,
  );
  return z.object({
    estilo: z.enum(DICEBEAR_ESTILOS),
    semilla: z.string().regex(semilla, "Avatar no válido"),
  });
}

/** Cambio de contraseña: la actual no vacía y la nueva con el mínimo (D192). */
export const zCambioPassword = z.object({
  actual: z.string().min(1).max(4096),
  nueva: z
    .string()
    .max(4096)
    .refine((pw) => validarPassword(pw).estado === "ok", "Contraseña corta"),
});

/** «Crea tu contraseña» tras entrar con la temporal (D232): solo la nueva, con el mínimo. */
export const zCrearPassword = zCambioPassword.pick({ nueva: true });

export type ErrorCambioPassword =
  | "actual"
  | "invalida"
  | "bloqueado"
  | "red"
  | "sesion";

/** Copy de los errores del cambio de contraseña. PLACEHOLDER (CONTENT_CHECKLIST fila 127). */
export const ERROR_CAMBIO_PASSWORD: Record<ErrorCambioPassword, string> = {
  actual: "La contraseña actual no coincide.",
  invalida: `La contraseña nueva necesita al menos ${PASSWORD_MIN} caracteres.`,
  bloqueado: "Demasiados intentos. Espera unos minutos y vuelve a intentar.",
  red: "No pudimos guardar la contraseña. Revisa tu internet y vuelve a intentar.",
  sesion: "Tu sesión venció. Vuelve a entrar para cambiar la contraseña.",
};
