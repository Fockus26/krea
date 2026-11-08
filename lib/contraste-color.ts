// Contraste WCAG 2.1 sobre colores calculados del navegador (`getComputedStyle`).
// Puro: sin DOM ni React. Lo usa la matriz de /componentes (D331).

/** Color sRGB con canales 0–255 y alfa 0–1. */
export type Rgba = { r: number; g: number; b: number; a: number };

/** Mínimo AA para texto normal. */
export const AA_TEXTO = 4.5;

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

/**
 * Lee un color CSS calculado: `rgb()`/`rgba()` (coma o espacio), `color(srgb r g b / a)` y hex.
 * Devuelve `null` si el formato no se reconoce (p. ej. `oklch()`), para no inventar un valor.
 */
export function parseColor(valor: string): Rgba | null {
  const s = valor.trim().toLowerCase();
  if (s === "transparent") return { r: 0, g: 0, b: 0, a: 0 };

  const hex = /^#([0-9a-f]{3,8})$/.exec(s);
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
    if (h.length !== 6 && h.length !== 8) return null;
    const n = (i: number) => Number.parseInt(h.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
  }

  const fn = /^(rgba?|color)\((.*)\)$/.exec(s);
  if (!fn) return null;
  let cuerpo = fn[2];
  let escala = 1; // rgb() va en 0–255; color(srgb) en 0–1
  if (fn[1] === "color") {
    if (!cuerpo.startsWith("srgb ")) return null;
    cuerpo = cuerpo.slice(5);
    escala = 255;
  }
  const [canales, alfa] = cuerpo.split("/");
  const partes = canales.split(/[\s,]+/).filter(Boolean);
  const nums = partes.map((p) =>
    p.endsWith("%")
      ? (Number.parseFloat(p) / 100) * (fn[1] === "color" ? 1 : 255)
      : Number.parseFloat(p),
  );
  if (nums.length < 3 || nums.slice(0, 3).some(Number.isNaN)) return null;
  const aTexto = alfa !== undefined ? alfa.trim() : partes[3];
  let a = 1;
  if (aTexto !== undefined) {
    a = aTexto.endsWith("%")
      ? Number.parseFloat(aTexto) / 100
      : Number.parseFloat(aTexto);
    if (Number.isNaN(a)) return null;
  }
  const k = fn[1] === "color" ? escala : 1;
  return {
    r: clamp(nums[0] * k, 0, 255),
    g: clamp(nums[1] * k, 0, 255),
    b: clamp(nums[2] * k, 0, 255),
    a: clamp(a, 0, 1),
  };
}

/** Pinta `frente` (con su alfa) sobre `fondo`; el resultado queda opaco si el fondo lo es. */
export function componer(frente: Rgba, fondo: Rgba): Rgba {
  const a = frente.a + fondo.a * (1 - frente.a);
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
  const mezcla = (f: number, b: number) =>
    (f * frente.a + b * fondo.a * (1 - frente.a)) / a;
  return {
    r: mezcla(frente.r, fondo.r),
    g: mezcla(frente.g, fondo.g),
    b: mezcla(frente.b, fondo.b),
    a,
  };
}

/** Luminancia relativa WCAG de un color opaco. */
export function luminanciaRgb({ r, g, b }: Rgba): number {
  const canal = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

/** Razón de contraste WCAG (1–21) entre dos colores opacos. */
export function razonContraste(a: Rgba, b: Rgba): number {
  const x = luminanciaRgb(a);
  const y = luminanciaRgb(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/**
 * Contraste del texto contra una pila de fondos, del más cercano al texto al más lejano.
 * Los fondos con alfa se componen sobre los de abajo; el último debe ser opaco (el de la
 * celda). El texto semitransparente también se compone sobre el fondo resultante.
 * Devuelve `null` si algún color no se pudo leer.
 */
export function contrasteSobrePila(
  texto: string,
  fondos: readonly string[],
): number | null {
  const t = parseColor(texto);
  if (!t) return null;
  const capas = fondos.map(parseColor);
  if (capas.some((c) => c === null)) return null;
  let base: Rgba = { r: 255, g: 255, b: 255, a: 0 };
  for (let i = capas.length - 1; i >= 0; i--)
    base = componer(capas[i] as Rgba, base);
  if (base.a < 1) return null;
  return razonContraste(componer(t, base), base);
}

/** Pasa AA de texto normal (4,5:1). Se compara el valor truncado a 2 decimales que se muestra. */
export function pasaAA(razon: number): boolean {
  return truncar2(razon) >= AA_TEXTO;
}

/** Trunca a 2 decimales (nunca redondea hacia arriba: 4,499 no se muestra como 4,50). */
export function truncar2(n: number): number {
  return Math.floor(n * 100 + 1e-9) / 100;
}

/** «4,52:1» con coma decimal (es-VE). */
export function formatRazon(razon: number): string {
  return `${truncar2(razon).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}:1`;
}
