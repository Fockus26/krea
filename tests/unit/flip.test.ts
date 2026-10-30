import { describe, expect, test } from "bun:test";
import { flipDeltas, parseCssTime } from "@/lib/flip";

const pos = (o: Record<string, number>) => new Map(Object.entries(o));

describe("flipDeltas", () => {
  test("invierte: anterior − nueva", () => {
    const d = flipDeltas(
      pos({ a: 0, b: 64, c: 128 }),
      pos({ a: 64, b: 0, c: 128 }),
    );
    expect(d.get("a")).toBe(-64);
    expect(d.get("b")).toBe(64);
    expect(d.has("c")).toBe(false);
  });

  test("filas nuevas y ruido de subpíxeles no se animan", () => {
    const d = flipDeltas(pos({ a: 10, b: 20 }), pos({ a: 10.3, b: 20, n: 99 }));
    expect(d.size).toBe(0);
  });

  test("filas que desaparecen se ignoran", () => {
    expect(flipDeltas(pos({ a: 0, z: 5 }), pos({ a: 8 })).get("a")).toBe(-8);
  });

  test("sin posiciones previas no hay nada que animar", () => {
    expect(flipDeltas(new Map(), pos({ a: 1 })).size).toBe(0);
  });
});

describe("parseCssTime", () => {
  test("ms y s", () => {
    expect(parseCssTime("600ms")).toBe(600);
    expect(parseCssTime(" 0.6s ")).toBe(600);
    expect(parseCssTime("0ms")).toBe(0);
  });

  test("lo ilegible usa el respaldo", () => {
    expect(parseCssTime("", 123)).toBe(123);
    expect(parseCssTime("rápido")).toBe(0);
  });
});
