// Textos y lógica pura de Ingresar y Recuperar (HANDOFF §3; copy final del lienzo
// design/canvas/Ingresar.dc.html). Sin React.

/** Mínimo de la contraseña nueva (lienzo: "Mínimo 8 caracteres."). */
export const PASSWORD_MIN = 8;
/** Espera para reenviar el enlace de recuperación. */
export const REENVIO_SEGUNDOS = 60;

/** Errores del servidor al entrar (no dicen cuál de los dos campos falló, §3). */
export type ErrorIngreso =
  | "credenciales"
  | "bloqueado"
  | "red"
  | "no-disponible";

export const ERROR_INGRESO: Record<ErrorIngreso, string> = {
  credenciales:
    "La cédula o la contraseña no coinciden. Revisa y vuelve a intentar.",
  bloqueado: "Demasiados intentos. Espera 5 minutos.",
  // PLACEHOLDER de copy (CONTENT_CHECKLIST fila 123): no están en el lienzo.
  red: "No pudimos conectarnos. Revisa tu internet y vuelve a intentar.",
  "no-disponible":
    "El acceso todavía no está disponible. Avísale a tu profe y vuelve a intentar más tarde.",
};

/**
 * Código de error de Firebase Auth → error que ve el usuario (fase 07, D180). Nunca dice cuál de
 * los dos campos falló. Lo que no se reconoce cuenta como credenciales: no revela nada más.
 */
export function errorIngresoDeCodigo(codigo: string | undefined): ErrorIngreso {
  switch (codigo) {
    case "auth/too-many-requests":
      return "bloqueado";
    case "auth/network-request-failed":
      return "red";
    case "auth/configuration-not-found":
    case "auth/invalid-api-key":
    case "auth/operation-not-allowed":
      return "no-disponible";
    default:
      return "credenciales";
  }
}

/** Contraseña vacía al entrar. PLACEHOLDER de copy (CONTENT_CHECKLIST fila 56). */
export const PASSWORD_VACIA = "Escribe tu contraseña.";

export type ValidacionPassword =
  | { estado: "vacia" }
  | { estado: "corta"; faltan: number }
  | { estado: "ok"; largo: number };

/** Largo en caracteres visibles (un emoji cuenta como uno). */
function largo(pw: string): number {
  return Array.from(pw).length;
}

/**
 * Solo espacios cuenta como vacía: «8 espacios» no es una contraseña (QA versión 1, F-B1). Los
 * espacios dentro de una contraseña con otros caracteres sí cuentan para el mínimo.
 */
export function validarPassword(pw: string): ValidacionPassword {
  const n = largo(pw);
  if (n === 0 || pw.trim() === "") return { estado: "vacia" };
  if (n < PASSWORD_MIN) return { estado: "corta", faltan: PASSWORD_MIN - n };
  return { estado: "ok", largo: n };
}

/** "9 caracteres · cumple el mínimo" (lienzo). */
export function passwordOkTexto(n: number): string {
  return `${n} caracteres · cumple el mínimo`;
}

/** "Faltan 3 caracteres" / "Falta 1 carácter". PLACEHOLDER de copy (fila 56). */
export function passwordFaltanTexto(faltan: number): string {
  return faltan === 1 ? "Falta 1 carácter" : `Faltan ${faltan} caracteres`;
}

export const PASSWORDS_COINCIDEN = "Las contraseñas coinciden.";
/** Copy del prototipo (design/prototype/app.js). */
export const PASSWORDS_NO_COINCIDEN = "Las contraseñas no coinciden.";

/** `null` si aún no hay nada que decir (repetición vacía). */
export function coinciden(pw: string, repetida: string): boolean | null {
  if (repetida === "") return null;
  return pw === repetida;
}

/** Cuenta regresiva "0:45" (m:ss). */
export function formatCuenta(segundos: number): string {
  const s = Math.max(0, Math.ceil(segundos));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function reenviarTexto(segundos: number): string {
  return segundos > 0
    ? `Reenviar enlace en ${formatCuenta(segundos)}`
    : "Reenviar enlace";
}
