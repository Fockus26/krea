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
