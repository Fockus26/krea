// Imagen de una respuesta (HANDOFF §2.17): validación, tamaño destino, peso y compresión.
// Todo es puro y probado salvo `compressImage`, que necesita DOM (createImageBitmap + canvas).

/** Tipos aceptados por la subida. */
export const IMAGE_TYPES = ["image/jpeg", "image/png"] as const;
/** Valor del atributo `accept` del `<input type="file">`. */
export const IMAGE_ACCEPT = IMAGE_TYPES.join(",");
/** Peso máximo del archivo original: 25 MB (fotos de celular; se comprimen antes de subir). */
export const IMAGE_MAX_BYTES = 25 * 1024 * 1024;
/** Peso objetivo de lo que se guarda tras comprimir: 1,5 MB (el servidor acepta hasta 2,5 MB). */
export const IMAGE_TARGET_BYTES = 1.5 * 1024 * 1024;
/** Lado mayor tras comprimir, en píxeles. */
export const IMAGE_MAX_SIDE = 1600;
/** Calidad JPEG del primer intento de compresión. */
export const IMAGE_QUALITY = 0.8;

export type CompressionStep = { side: number; quality: number };

/**
 * Escalera de intentos: primero baja la calidad con el lado completo; si aún no cabe,
 * baja también el lado. El primer paso es el de siempre (1600 px, 0,8).
 */
export const COMPRESSION_STEPS: readonly CompressionStep[] = [
  { side: IMAGE_MAX_SIDE, quality: IMAGE_QUALITY },
  { side: IMAGE_MAX_SIDE, quality: 0.7 },
  { side: IMAGE_MAX_SIDE, quality: 0.6 },
  { side: IMAGE_MAX_SIDE, quality: 0.5 },
  { side: 1400, quality: 0.7 },
  { side: 1200, quality: 0.6 },
  { side: 1000, quality: 0.5 },
];

/** Paso `attempt` (desde 0) de la escalera, o `null` cuando ya no quedan intentos. */
export function nextCompressionStep(attempt: number): CompressionStep | null {
  return COMPRESSION_STEPS[attempt] ?? null;
}

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
 * Comprime en el cliente: redimensiona por el lado mayor y exporta JPEG, recorriendo
 * `COMPRESSION_STEPS` hasta que el resultado pese ≤ `IMAGE_TARGET_BYTES`. Si ningún paso
 * alcanza, devuelve el último (el servidor aún acepta hasta 2,5 MB).
 * Necesita DOM (`createImageBitmap` y `<canvas>`), así que no se prueba en `bun test`: la lógica
 * que decide tamaño y escalera es pura y sí está probada. Respeta la orientación EXIF.
 * Un PNG con transparencia queda sobre fondo blanco (JPEG no tiene alfa).
 * Se decodifica una sola vez y se reescala en canvas por intento (no se re-decodifica).
 */
export async function compressImage(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  try {
    let result: Blob | null = null;
    for (let attempt = 0; ; attempt++) {
      const step = nextCompressionStep(attempt);
      if (!step) break;
      const { width, height } = targetSize(
        bitmap.width,
        bitmap.height,
        step.side,
      );
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("No se pudo preparar la imagen.");
      context.fillStyle = "white";
      context.fillRect(0, 0, width, height);
      context.drawImage(bitmap, 0, 0, width, height);
      result = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) =>
            blob ? resolve(blob) : reject(new Error("No se pudo comprimir.")),
          "image/jpeg",
          step.quality,
        );
      });
      if (result.size <= IMAGE_TARGET_BYTES) break;
    }
    if (!result) throw new Error("No se pudo comprimir.");
    return result;
  } finally {
    bitmap.close();
  }
}
