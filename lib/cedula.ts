// Cédula venezolana para el login (D008, HANDOFF §2.2): solo dígitos, de 7 a 9.

export const CEDULA_MIN = 7;
export const CEDULA_MAX = 9;

// Mensajes literales del handoff (§2.2 Cédula)
export const CEDULA_MSG_SOLO_NUMEROS =
  "La cédula lleva solo números: de 7 a 9 dígitos.";
export const CEDULA_MSG_FALTAN =
  "Faltan dígitos: la cédula tiene de 7 a 9 números.";

/** Descarta todo lo que no sea dígito (puntos, espacios, "V-") y corta en 9. */
export function sanitizeCedula(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, CEDULA_MAX);
}

/**
 * Mensaje de error o `null` si la cédula es válida.
 * - algo que no es dígito, o más de 9 dígitos → "solo números: de 7 a 9"
 * - menos de 7 dígitos (incluida la vacía) → "faltan dígitos"
 * Se valida el texto tal cual (sin sanear): quien pega "V-12.345.678" ya pasó por `sanitizeCedula`.
 */
export function validateCedula(valor: string): string | null {
  const texto = valor.trim();
  if (/\D/.test(texto) || texto.length > CEDULA_MAX) {
    return CEDULA_MSG_SOLO_NUMEROS;
  }
  if (texto.length < CEDULA_MIN) return CEDULA_MSG_FALTAN;
  return null;
}

/**
 * Pegar en un campo con `maxlength`: el navegador cortaría el texto pegado ANTES de
 * descartar los puntos ("V-12.345.678" quedaría en "V-12.345."). Se sanea lo pegado y se
 * inserta en la selección; devuelve el valor nuevo y dónde queda el cursor.
 */
export function pasteCedula(
  actual: string,
  inicio: number,
  fin: number,
  pegado: string,
): { value: string; caret: number } {
  const antes = sanitizeCedula(actual.slice(0, inicio));
  const despues = sanitizeCedula(actual.slice(fin));
  const insertado = sanitizeCedula(pegado);
  const value = sanitizeCedula(antes + insertado + despues);
  const caret = Math.min(antes.length + insertado.length, value.length);
  return { value, caret };
}
