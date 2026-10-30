// Imagen de una respuesta (HANDOFF §2.17): validación, tamaño destino, peso y compresión.
// Todo es puro y probado salvo `compressImage`, que necesita DOM (createImageBitmap + canvas).

/** Tipos aceptados por la subida. */
export const IMAGE_TYPES = ["image/jpeg", "image/png"] as const;
/** Valor del atributo `accept` del `<input type="file">`. */
export const IMAGE_ACCEPT = IMAGE_TYPES.join(",");
/** Peso máximo del archivo original: 5 MB. */
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
/** Lado mayor tras comprimir, en píxeles. */
export const IMAGE_MAX_SIDE = 1600;
/** Calidad JPEG de la compresión. */
export const IMAGE_QUALITY = 0.8;

export type ImageValidation =
  | { ok: true }
  | { ok: false; reason: "tipo" | "peso" | "vacio"; message: string };

/** Valida tipo y peso del archivo elegido; los mensajes se muestran tal cual en la alerta. */
export function validateImage(file: {
  type: string;
  size: number;
}): ImageValidation {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return {
      ok: false,
      reason: "tipo",
      message: "Solo se aceptan imágenes JPG o PNG.",
    };
  }
  if (file.size <= 0) {
    return {
      ok: false,
      reason: "vacio",
      message: "El archivo está vacío. Elige otra imagen.",
    };
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return {
      ok: false,
      reason: "peso",
      message: `La imagen pesa ${formatFileSize(file.size)}. El máximo es ${formatFileSize(IMAGE_MAX_BYTES)}.`,
    };
  }
  return { ok: true };
}

/**
 * Tamaño destino: el lado mayor queda en `maxSide` y la proporción se conserva.
 * Una imagen que ya cabe no se agranda.
 */
export function targetSize(
  width: number,
  height: number,
  maxSide: number = IMAGE_MAX_SIDE,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxSide) return { width, height };
  const scale = maxSide / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** Peso legible con coma es-VE: "1,2 MB", "230 KB", "512 B" (1 MB = 1024 KB). */
export function formatFileSize(bytes: number): string {
  const decimal = (n: number) =>
    (Math.round(n * 10) / 10).toLocaleString("es-VE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
      useGrouping: false,
    });
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${decimal(bytes / 1024)} KB`;
  return `${decimal(bytes / (1024 * 1024))} MB`;
}

/** Porcentaje entero de 0 a 100 para el texto y `aria-valuenow`. */
export function progressPercent(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  return Math.min(100, Math.max(0, Math.round(progress)));
}

/**
 * Comprime en el cliente: redimensiona a `IMAGE_MAX_SIDE` por el lado mayor y exporta JPEG 0,8.
 * Necesita DOM (`createImageBitmap` y `<canvas>`), así que no se prueba en `bun test`: la lógica
 * que decide el tamaño es `targetSize`, que sí está probada. Respeta la orientación EXIF.
 * Un PNG con transparencia queda sobre fondo blanco (JPEG no tiene alfa).
 */
export async function compressImage(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  try {
    const { width, height } = targetSize(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No se pudo preparar la imagen.");
    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("No se pudo comprimir.")),
        "image/jpeg",
        IMAGE_QUALITY,
      );
    });
  } finally {
    bitmap.close();
  }
}
