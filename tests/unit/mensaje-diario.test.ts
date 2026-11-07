import { describe, expect, test } from "bun:test";
import {
  bandaDePromedio,
  diaDelAnio,
  MENSAJES,
  mensajeDelDia,
} from "@/lib/mensaje-diario";

describe("mensaje del día (D274)", () => {
  test("bandas por promedio", () => {
    expect(bandaDePromedio(null)).toBe("sin-notas");
    expect(bandaDePromedio(9.9)).toBe("raspado");
    expect(bandaDePromedio(10)).toBe("media");
    expect(bandaDePromedio(13.5)).toBe("media");
    expect(bandaDePromedio(14)).toBe("alta");
    expect(bandaDePromedio(16.5)).toBe("alta");
    expect(bandaDePromedio(17)).toBe("excelente");
    expect(bandaDePromedio(20)).toBe("excelente");
  });

  test("diaDelAnio", () => {
    expect(diaDelAnio("2026-01-01")).toBe(1);
    expect(diaDelAnio("2026-11-06")).toBe(310);
    expect(diaDelAnio("2024-12-31")).toBe(366);
    expect(() => diaDelAnio("basura")).toThrow(RangeError);
  });

  test("determinista por fecha y banda", () => {
    expect(mensajeDelDia(15, "2026-11-06")).toBe(
      mensajeDelDia(15, "2026-11-06"),
    );
    expect(mensajeDelDia(15, "2026-11-06")).toBe(
      MENSAJES.alta[310 % MENSAJES.alta.length],
    );
  });

  test("cambia con los días y recorre todos los de la banda", () => {
    const vistos = new Set<string>();
    for (let d = 1; d <= 30; d++) {
      vistos.add(mensajeDelDia(12, `2026-11-${String(d).padStart(2, "0")}`));
    }
    expect(vistos.size).toBe(MENSAJES.media.length);
    expect(mensajeDelDia(12, "2026-11-06")).not.toBe(
      mensajeDelDia(12, "2026-11-07"),
    );
  });

  test("3–5 mensajes por banda, sin texto vacío ni lorem", () => {
    for (const lista of Object.values(MENSAJES)) {
      expect(lista.length).toBeGreaterThanOrEqual(3);
      expect(lista.length).toBeLessThanOrEqual(5);
      for (const m of lista) expect(m.trim().length).toBeGreaterThan(10);
    }
  });
});
