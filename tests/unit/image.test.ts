import { describe, expect, test } from "bun:test";
import {
  formatFileSize,
  IMAGE_ACCEPT,
  IMAGE_MAX_BYTES,
  progressPercent,
  targetSize,
  validateImage,
} from "@/lib/image";

describe("validateImage (§2.17)", () => {
  test("acepta JPG y PNG de hasta 5 MB", () => {
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

  test("rechaza más de 5 MB e indica el peso", () => {
    const result = validateImage({
      type: "image/jpeg",
      size: IMAGE_MAX_BYTES + 1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("peso");
      expect(result.message).toBe("La imagen pesa 5 MB. El máximo es 5 MB.");
    }
    const grande = validateImage({
      type: "image/png",
      size: 7.3 * 1024 * 1024,
    });
    if (!grande.ok) expect(grande.message).toContain("7,3 MB");
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
