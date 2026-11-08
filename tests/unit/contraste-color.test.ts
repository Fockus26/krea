import { describe, expect, test } from "bun:test";
import {
  componer,
  contrasteSobrePila,
  formatRazon,
  parseColor,
  pasaAA,
  razonContraste,
  truncar2,
} from "@/lib/contraste-color";
import { contraste } from "@/lib/grades";

describe("parseColor", () => {
  test("rgb() y rgba() con coma o espacio", () => {
    expect(parseColor("rgb(255, 0, 10)")).toEqual({
      r: 255,
      g: 0,
      b: 10,
      a: 1,
    });
    expect(parseColor("rgba(255, 0, 10, 0.5)")).toEqual({
      r: 255,
      g: 0,
      b: 10,
      a: 0.5,
    });
    expect(parseColor("rgb(255 0 10 / 25%)")).toEqual({
      r: 255,
      g: 0,
      b: 10,
      a: 0.25,
    });
  });
  test("color(srgb) y hex", () => {
    expect(parseColor("color(srgb 1 0.5 0 / 0.5)")).toEqual({
      r: 255,
      g: 127.5,
      b: 0,
      a: 0.5,
    });
    expect(parseColor("#fff")).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseColor("#11111180")?.a).toBeCloseTo(0.5, 2);
  });
  test("transparent es alfa 0; formatos desconocidos, null", () => {
    expect(parseColor("transparent")?.a).toBe(0);
    expect(parseColor("rgba(0, 0, 0, 0)")?.a).toBe(0);
    expect(parseColor("oklch(0.5 0.1 200)")).toBeNull();
    expect(parseColor("color(display-p3 1 0 0)")).toBeNull();
  });
});

describe("razonContraste", () => {
  const blanco = { r: 255, g: 255, b: 255, a: 1 };
  const negro = { r: 0, g: 0, b: 0, a: 1 };
  test("blanco sobre negro es 21:1 y mismo color 1:1", () => {
    expect(razonContraste(blanco, negro)).toBeCloseTo(21, 5);
    expect(razonContraste(negro, blanco)).toBeCloseTo(21, 5);
    expect(razonContraste(blanco, blanco)).toBeCloseTo(1, 5);
  });
  test("gris #767676 sobre blanco ≈ 4,54:1 (referencia WCAG)", () => {
    const gris = parseColor("#767676");
    expect(gris).not.toBeNull();
    expect(razonContraste(gris as never, blanco)).toBeCloseTo(4.54, 2);
  });
  test("coincide con contraste() de lib/grades", () => {
    const a = parseColor("#1D4ED8") as never;
    const b = parseColor("#F4F0FA") as never;
    expect(razonContraste(a, b)).toBeCloseTo(
      contraste("#1D4ED8", "#F4F0FA"),
      8,
    );
  });
});

describe("componer y pila de fondos", () => {
  test("50 % negro sobre blanco da gris medio", () => {
    const c = componer(
      { r: 0, g: 0, b: 0, a: 0.5 },
      { r: 255, g: 255, b: 255, a: 1 },
    );
    expect(c.r).toBeCloseTo(127.5, 5);
    expect(c.a).toBe(1);
  });
  test("fondo transparente se mide contra el de la celda", () => {
    const r = contrasteSobrePila("rgb(0, 0, 0)", [
      "rgba(0, 0, 0, 0)",
      "rgb(255, 255, 255)",
    ]);
    expect(r).toBeCloseTo(21, 5);
  });
  test("fondo con alfa se compone sobre el siguiente", () => {
    const r = contrasteSobrePila("rgb(0, 0, 0)", [
      "rgba(255, 255, 255, 0.5)",
      "rgb(255, 255, 255)",
    ]);
    expect(r).toBeCloseTo(21, 5);
  });
  test("pila sin fondo opaco o con color ilegible, null", () => {
    expect(contrasteSobrePila("rgb(0 0 0)", ["rgba(0, 0, 0, 0)"])).toBeNull();
    expect(contrasteSobrePila("oklch(0 0 0)", ["rgb(1 1 1)"])).toBeNull();
  });
});

describe("AA y formato", () => {
  test("umbral 4,5 sobre el valor mostrado", () => {
    expect(pasaAA(4.5)).toBe(true);
    expect(pasaAA(4.499)).toBe(false);
    expect(truncar2(4.499)).toBe(4.49);
    expect(pasaAA(21)).toBe(true);
    expect(pasaAA(3)).toBe(false);
  });
  test("coma decimal es-VE", () => {
    expect(formatRazon(21)).toBe("21,00:1");
    expect(formatRazon(4.5449)).toBe("4,54:1");
  });
});
