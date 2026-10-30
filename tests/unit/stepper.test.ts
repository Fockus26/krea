import { describe, expect, test } from "bun:test";
import {
  atMax,
  atMin,
  formatDecimal,
  parseDecimal,
  snapToStep,
  stepValue,
} from "@/lib/stepper";

const BASE = { min: 10, max: 20, step: 0.5 };

describe("snapToStep", () => {
  test("redondea al paso más cercano (medios hacia arriba)", () => {
    expect(snapToStep(17.2, BASE)).toBe(17);
    expect(snapToStep(17.3, BASE)).toBe(17.5);
    expect(snapToStep(17.25, BASE)).toBe(17.5);
  });
  test("respeta los límites", () => {
    expect(snapToStep(9, BASE)).toBe(10);
    expect(snapToStep(25, BASE)).toBe(20);
  });
  test("el paso por defecto es 0,5", () => {
    expect(snapToStep(3.3, { min: 0, max: 6 })).toBe(3.5);
  });
  test("no finito vuelve al mínimo", () => {
    expect(snapToStep(Number.NaN, BASE)).toBe(10);
  });
  test("cuenta los pasos desde el mínimo", () => {
    expect(snapToStep(2.4, { min: 0.25, max: 5, step: 0.5 })).toBe(2.25);
  });
  test("sin ruido de coma flotante", () => {
    expect(snapToStep(0.1 + 0.2, { min: 0, max: 1, step: 0.1 })).toBe(0.3);
  });
});

describe("parseDecimal", () => {
  test("acepta coma y punto", () => {
    expect(parseDecimal("17,5")).toBe(17.5);
    expect(parseDecimal("17.5")).toBe(17.5);
    expect(parseDecimal(" 18 ")).toBe(18);
    expect(parseDecimal("17,")).toBe(17);
    expect(parseDecimal(",5")).toBe(0.5);
  });
  test("rechaza lo que no es un número", () => {
    expect(parseDecimal("")).toBeNull();
    expect(parseDecimal("abc")).toBeNull();
    expect(parseDecimal("1,2,3")).toBeNull();
    expect(parseDecimal("1.2.3")).toBeNull();
    expect(parseDecimal("-")).toBeNull();
    expect(parseDecimal("1e3")).toBeNull();
  });
});

describe("formatDecimal", () => {
  test("coma decimal (es-VE), sin ceros de más", () => {
    expect(formatDecimal(17.5)).toBe("17,5");
    expect(formatDecimal(18)).toBe("18");
    expect(formatDecimal(0.5)).toBe("0,5");
  });
  test("los decimales siguen al paso", () => {
    expect(formatDecimal(1.25, 0.25)).toBe("1,25");
    expect(formatDecimal(1.5, 1)).toBe("2");
  });
});

describe("stepValue y límites", () => {
  test("suma y resta un paso", () => {
    expect(stepValue(17, 1, BASE)).toBe(17.5);
    expect(stepValue(17, -1, BASE)).toBe(16.5);
  });
  test("no pasa de los límites", () => {
    expect(stepValue(20, 1, BASE)).toBe(20);
    expect(stepValue(10, -1, BASE)).toBe(10);
  });
  test("parte de un valor fuera de paso", () => {
    expect(stepValue(17.2, 1, BASE)).toBe(17.5);
  });
  test("atMin / atMax", () => {
    expect(atMin(10, BASE)).toBe(true);
    expect(atMin(10.5, BASE)).toBe(false);
    expect(atMax(20, BASE)).toBe(true);
    expect(atMax(19.5, BASE)).toBe(false);
  });
});
