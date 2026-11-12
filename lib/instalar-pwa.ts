/**
 * Instalar KREA como app (D368–D370). La decisión de qué mostrar es una función pura; la lectura
 * del navegador y el evento `beforeinstallprompt` viven en `useInstalarPwa`.
 */

/** Donde el script del `<head>` deja el evento si llega antes de hidratar (D371). */
export const CLAVE_EVENTO_INSTALAR = "__kreaInstalar";

/**
 * Script en línea del `<head>` (D371): guarda `beforeinstallprompt` aunque llegue antes de que
 * React monte; `escucharInstalacion` lo recoge después. Constante estática, sin datos del usuario.
 */
export const INSTALAR_SCRIPT = `window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.${CLAVE_EVENTO_INSTALAR}=e;});`;

export type EstadoInstalacion =
  | "instalada" // ya corre como app: no se muestra nada
  | "disponible" // Chrome/Edge: botón que lanza el diálogo del navegador
  | "ios" // Safari de iPhone/iPad: pasos «Compartir › Agregar a inicio»
  | "no-disponible"; // otro navegador sin evento: nada

export type EntradaInstalacion = {
  /** `(display-mode: standalone)` coincide */
  standalone: boolean;
  /** `navigator.standalone` (solo iOS) */
  iosStandalone: boolean;
  esIOS: boolean;
  /** llegó `beforeinstallprompt` y está guardado */
  hayEvento: boolean;
};

export function estadoInstalacion(e: EntradaInstalacion): EstadoInstalacion {
  if (e.standalone || e.iosStandalone) return "instalada";
  if (e.hayEvento) return "disponible";
  if (e.esIOS) return "ios";
  return "no-disponible";
}

/** iPhone/iPad; el iPad moderno se presenta como «MacIntel» pero con pantalla táctil. */
export function esDispositivoIOS(
  plataforma: string,
  userAgent: string,
  puntosTactiles: number,
): boolean {
  if (/iPhone|iPad|iPod/.test(userAgent)) return true;
  return plataforma === "MacIntel" && puntosTactiles > 1;
}
