import { describe, expect, test } from "bun:test";
import {
  COMPRESSION_STEPS,
  formatFileSize,
  IMAGE_ACCEPT,
  IMAGE_MAX_BYTES,
  IMAGE_MAX_SIDE,
  IMAGE_TARGET_BYTES,
  nextCompressionStep,
  progressPercent,
  targetSize,
  validateImage,
} from "@/lib/image";

describe("validateImage (§2.17)", () => {
  test("acepta JPG y PNG de hasta 25 MB", () => {
    expect(validateImage({ type: "image/jpeg", size: 1024 })).toEqual({
      ok: true,
    });
    expect(validateImage({ type: "image/png", size: IMAGE_MAX_BYTES })).toEqual(
      { ok: true },
    );
  });

  test("rechaza otros tipos con mensaje en español", () => {
    const result = validateImage({ type: "image/gif", size: 1024 });
    expect(result).toEqual({
      ok: false,
      reason: "tipo",
      message: "Solo se aceptan imágenes JPG o PNG.",
    });
    expect(validateImage({ type: "application/pdf", size: 10 }).ok).toBe(false);
  });

  test("rechaza más de 25 MB e indica el peso", () => {
    const result = validateImage({
      type: "image/jpeg",
      size: IMAGE_MAX_BYTES + 1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("peso");
      expect(result.message).toBe("La imagen pesa 25 MB. El máximo es 25 MB.");
    }
    const grande = validateImage({
      type: "image/png",
      size: 30.3 * 1024 * 1024,
    });
    if (!grande.ok) expect(grande.message).toContain("30,3 MB");
  });

  test("rechaza archivos vacíos", () => {
    const result = validateImage({ type: "image/png", size: 0 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("vacio");
  });

  test("el accept del input coincide con los tipos", () => {
    expect(IMAGE_ACCEPT).toBe("image/jpeg,image/png");
  });
});

describe("targetSize: lado mayor a 1600 sin agrandar", () => {
  test("horizontal", () => {
    expect(targetSize(4000, 3000)).toEqual({ width: 1600, height: 1200 });
  });

  test("vertical", () => {
    expect(targetSize(3000, 4000)).toEqual({ width: 1200, height: 1600 });
  });

  test("cuadrada", () => {
    expect(targetSize(3200, 3200)).toEqual({ width: 1600, height: 1600 });
  });

  test("más pequeña que 1600 no se agranda", () => {
    expect(targetSize(800, 600)).toEqual({ width: 800, height: 600 });
    expect(targetSize(1600, 900)).toEqual({ width: 1600, height: 900 });
  });

  test("proporción extrema no deja un lado en 0", () => {
    expect(targetSize(16000, 3)).toEqual({ width: 1600, height: 1 });
  });
});

describe("límites de peso", () => {
  test("original hasta 25 MB y objetivo guardado de 1,5 MB", () => {
    expect(IMAGE_MAX_BYTES).toBe(25 * 1024 * 1024);
    expect(IMAGE_TARGET_BYTES).toBe(1.5 * 1024 * 1024);
    expect(
      validateImage({ type: "image/jpeg", size: IMAGE_MAX_BYTES }).ok,
    ).toBe(true);
    expect(
      validateImage({ type: "image/jpeg", size: IMAGE_MAX_BYTES + 1 }).ok,
    ).toBe(false);
  });
});

describe("escalera de compresión", () => {
  test("empieza en 1600 px y calidad 0,8", () => {
    expect(nextCompressionStep(0)).toEqual({
      side: IMAGE_MAX_SIDE,
      quality: 0.8,
    });
  });

  test("calidad y lado nunca suben, y la calidad baja antes que el lado", () => {
    for (let i = 1; i < COMPRESSION_STEPS.length; i++) {
      const prev = COMPRESSION_STEPS[i - 1];
      const cur = COMPRESSION_STEPS[i];
      expect(cur.side).toBeLessThanOrEqual(prev.side);
      if (cur.side === prev.side)
        expect(cur.quality).toBeLessThan(prev.quality);
    }
    expect(COMPRESSION_STEPS.at(-1)?.side).toBeLessThan(IMAGE_MAX_SIDE);
  });

  test("tiene tope: pasado el último paso devuelve null", () => {
    expect(nextCompressionStep(COMPRESSION_STEPS.length - 1)).not.toBeNull();
    expect(nextCompressionStep(COMPRESSION_STEPS.length)).toBeNull();
  });
});

describe("formatFileSize", () => {
  test("bytes, KB y MB con coma", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(230 * 1024)).toBe("230 KB");
    expect(formatFileSize(1.2 * 1024 * 1024)).toBe("1,2 MB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5 MB");
  });

  test("el límite entre KB y MB", () => {
    expect(formatFileSize(1023)).toBe("1023 B");
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(1024 * 1024)).toBe("1 MB");
  });
});

describe("progressPercent", () => {
  test("redondea y recorta a 0–100", () => {
    expect(progressPercent(44.6)).toBe(45);
    expect(progressPercent(-5)).toBe(0);
    expect(progressPercent(140)).toBe(100);
    expect(progressPercent(Number.NaN)).toBe(0);
  });
});
