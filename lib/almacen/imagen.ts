// Validación en el servidor de una imagen subida (D195): respuestas de entrega y, en W8, logos.
// El cliente ya comprime a JPEG ≤ 1600 px (`lib/image.ts`); aquí no se confía en eso: se mira
// el tamaño y la firma de los bytes, no el tipo que dice el navegador.

/** Peso máximo de una imagen ya comprimida. `serverActions.bodySizeLimit` deja margen sobre esto. */
export const IMAGEN_SUBIDA_MAX_BYTES = 2.5 * 1024 * 1024;

export type ErrorImagen = "vacia" | "peso" | "tipo";

/** JPEG: empieza por FF D8 FF. */
export function esJpeg(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  );
}

export function validarImagenSubida(
  bytes: Uint8Array,
): { ok: true } | { ok: false; error: ErrorImagen } {
  if (bytes.length === 0) return { ok: false, error: "vacia" };
  if (bytes.length > IMAGEN_SUBIDA_MAX_BYTES)
    return { ok: false, error: "peso" };
  if (!esJpeg(bytes)) return { ok: false, error: "tipo" };
  return { ok: true };
}

/* ---------- Logos de equipo (W8, D212) ---------- */

/**
 * Peso máximo del logo ya recortado a 512 × 512 en el cliente (D113): un WebP de ese lado pesa
 * mucho menos; el PNG (navegadores que no codifican WebP en `canvas`) cabe holgado.
 */
export const LOGO_SUBIDA_MAX_BYTES = 1.5 * 1024 * 1024;

const ascii = (bytes: Uint8Array, desde: number, texto: string) =>
  [...texto].every((c, i) => bytes[desde + i] === c.charCodeAt(0));

/** WebP: `RIFF` + 4 bytes de tamaño + `WEBP`. */
export function esWebp(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 12 && ascii(bytes, 0, "RIFF") && ascii(bytes, 8, "WEBP")
  );
}

/** PNG: 89 50 4E 47 0D 0A 1A 0A. */
export function esPng(bytes: Uint8Array): boolean {
  const firma = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  return bytes.length >= 8 && firma.every((b, i) => bytes[i] === b);
}

export type TipoLogo = {
  tipo: "image/webp" | "image/png";
  extension: "webp" | "png";
};

/** Tipo del logo por la firma de sus bytes (nunca por lo que diga el navegador). */
export function validarLogoSubido(
  bytes: Uint8Array,
): ({ ok: true } & TipoLogo) | { ok: false; error: ErrorImagen } {
  if (bytes.length === 0) return { ok: false, error: "vacia" };
  if (bytes.length > LOGO_SUBIDA_MAX_BYTES) return { ok: false, error: "peso" };
  if (esWebp(bytes)) return { ok: true, tipo: "image/webp", extension: "webp" };
  if (esPng(bytes)) return { ok: true, tipo: "image/png", extension: "png" };
  return { ok: false, error: "tipo" };
}

/** Clave del logo en B2: `equipos/{equipoId}/{uuid}.webp` (D212). */
export function claveLogo(
  equipoId: string,
  uuid: string,
  extension: TipoLogo["extension"],
): string {
  return `equipos/${equipoId}/${uuid}.${extension}`;
}

/* ---------- Foto del premio (W11, D265) ---------- */

/**
 * La foto llega comprimida por `ImageUpload` (JPEG ≤ 1600 px, `lib/image.ts`): el mismo tope que
 * una respuesta. Se aceptan también PNG y WebP por si un navegador no codifica JPEG en `canvas`.
 */
export const FOTO_PREMIO_MAX_BYTES = IMAGEN_SUBIDA_MAX_BYTES;

export type TipoFotoPremio = {
  tipo: "image/jpeg" | "image/png" | "image/webp";
  extension: "jpg" | "png" | "webp";
};

/** Tipo de la foto por la firma de sus bytes (nunca por lo que diga el navegador). */
export function validarFotoPremio(
  bytes: Uint8Array,
): ({ ok: true } & TipoFotoPremio) | { ok: false; error: ErrorImagen } {
  if (bytes.length === 0) return { ok: false, error: "vacia" };
  if (bytes.length > FOTO_PREMIO_MAX_BYTES) return { ok: false, error: "peso" };
  if (esJpeg(bytes)) return { ok: true, tipo: "image/jpeg", extension: "jpg" };
  if (esPng(bytes)) return { ok: true, tipo: "image/png", extension: "png" };
  if (esWebp(bytes)) return { ok: true, tipo: "image/webp", extension: "webp" };
  return { ok: false, error: "tipo" };
}

/** Clave de la foto en B2: `premios/{tareaId}/{uuid}.{ext}` (D265). */
export function claveFotoPremio(
  tareaId: string,
  uuid: string,
  extension: TipoFotoPremio["extension"],
): string {
  return `premios/${tareaId}/${uuid}.${extension}`;
}
