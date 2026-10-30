// Máscaras de datos personales (HANDOFF líneas 285 y 435).

const PUNTO = "•";

/** Primera letra + 4 puntos + `@dominio`: `yosoy@gmail.com` → `y••••@gmail.com`. */
export function maskEmail(email: string): string {
  const arroba = email.lastIndexOf("@");
  if (arroba < 1) return PUNTO.repeat(4);
  return `${email[0]}${PUNTO.repeat(4)}${email.slice(arroba)}`;
}

/** 2 primeros + 3 puntos + 3 últimos: `33217397` → `33•••397`. Menos de 6 dígitos: todo oculto. */
export function maskCedula(cedula: string): string {
  if (cedula.length < 6) return PUNTO.repeat(cedula.length);
  return `${cedula.slice(0, 2)}${PUNTO.repeat(3)}${cedula.slice(-3)}`;
}
