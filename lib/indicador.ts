// Indicador que se desliza (pestañas, segmentados; D279). Puro: el hook
// `components/krea/indicador.tsx` mide el DOM, llama a esto y anima con transform.

/** Caja de la opción activa relativa al contenido de la lista (px). */
export type Caja = { x: number; y: number; w: number; h: number };

type Rect = { left: number; top: number; width: number; height: number };

/** Menos de esto es ruido de subpíxeles: no hay nada que animar. */
export const INDICADOR_UMBRAL_PX = 0.5;

/**
 * Una memoria más vieja que esto no es «la opción de la página anterior» sino una visita vieja:
 * el indicador aparece en su sitio sin viajar.
 */
export const INDICADOR_MEMORIA_MS = 1000;

/**
 * Caja de `item` dentro de `lista`, en coordenadas del contenido (suma el scroll y resta el
 * borde: el indicador es un hijo absoluto de la lista y se desplaza con ella).
 */
export function cajaRelativa(
  item: Rect,
  lista: Rect,
  scroll: { left: number; top: number } = { left: 0, top: 0 },
  borde: { left: number; top: number } = { left: 0, top: 0 },
): Caja {
  return {
    x: item.left - lista.left + scroll.left - borde.left,
    y: item.top - lista.top + scroll.top - borde.top,
    w: item.width,
    h: item.height,
  };
}

/**
 * FLIP del indicador: el `transform` inicial que lo deja donde estaba (`antes`) estando ya en
 * `despues`; al animar a `translate(despues)` viaja y se estira hasta la nueva opción.
 * `eje: "x"` (línea bajo las pestañas): ni sube ni baja ni cambia de alto. `null` si no se movió
 * o si alguna caja no tiene tamaño (lista oculta).
 */
export function flipIndicador(
  antes: Caja | null,
  despues: Caja,
  eje: "x" | "xy" = "xy",
  umbral: number = INDICADOR_UMBRAL_PX,
): string | null {
  if (!antes || antes.w <= 0 || despues.w <= 0) return null;
  const dy = eje === "x" ? 0 : antes.y;
  const sy = eje === "x" || despues.h <= 0 ? 1 : antes.h / despues.h;
  const quieto =
    Math.abs(antes.x - despues.x) <= umbral &&
    Math.abs(antes.w - despues.w) <= umbral &&
    (eje === "x" ||
      (Math.abs(antes.y - despues.y) <= umbral &&
        Math.abs(antes.h - despues.h) <= umbral));
  if (quieto) return null;
  return `${traslado(antes.x, dy)} scale(${redondear(antes.w / despues.w)}, ${redondear(sy)})`;
}

/** `transform` de reposo del indicador en `caja`. */
export function transformDe(caja: Caja, eje: "x" | "xy" = "xy"): string {
  return traslado(caja.x, eje === "x" ? 0 : caja.y);
}

function traslado(x: number, y: number): string {
  return `translate(${redondear(x)}px, ${redondear(y)}px)`;
}

function redondear(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * ¿Sirve la memoria guardada para animar desde ella? Solo si es de hace menos de
 * `INDICADOR_MEMORIA_MS` (la navegación que acaba de pasar).
 */
export function memoriaVigente(
  entrada: { caja: Caja; t: number } | undefined,
  ahora: number,
  maximo: number = INDICADOR_MEMORIA_MS,
): Caja | null {
  if (!entrada) return null;
  const edad = ahora - entrada.t;
  return edad >= 0 && edad <= maximo ? entrada.caja : null;
}
