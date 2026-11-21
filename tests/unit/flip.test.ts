import { describe, expect, test } from "bun:test";
import {
  flipDeltas,
  idsNuevos,
  idsQuitados,
  type PosicionFlip,
  parseCssTime,
} from "@/lib/flip";

const pos = (o: Record<string, PosicionFlip>) => new Map(Object.entries(o));
const y = (n: number): PosicionFlip => ({ x: 0, y: n });

describe("flipDeltas", () => {
  test("invierte: anterior − nueva (vertical)", () => {
    const d = flipDeltas(
      pos({ a: y(0), b: y(64), c: y(128) }),
      pos({ a: y(64), b: y(0), c: y(128) }),
    );
    expect(d.get("a")).toEqual({ dx: 0, dy: -64 });
    expect(d.get("b")).toEqual({ dx: 0, dy: 64 });
    expect(d.has("c")).toBe(false);
  });

  test("solo X (misma fila de una cuadrícula)", () => {
    const d = flipDeltas(
      pos({ a: { x: 0, y: 10 } }),
      pos({ a: { x: 300, y: 10 } }),
    );
    expect(d.get("a")).toEqual({ dx: -300, dy: 0 });
  });

  test("diagonal (salta de fila y de columna)", () => {
    const d = flipDeltas(
      pos({ a: { x: 300, y: 0 } }),
      pos({ a: { x: 0, y: 120 } }),
    );
    expect(d.get("a")).toEqual({ dx: 300, dy: -120 });
  });

  test("el umbral es por eje: el ruido de un eje no se arrastra", () => {
    const d = flipDeltas(
      pos({ a: { x: 0, y: 10 } }),
      pos({ a: { x: 0.3, y: 50 } }),
    );
    expect(d.get("a")).toEqual({ dx: 0, dy: -40 });
  });

  test("bajo el umbral en ambos ejes no se anima", () => {
    const d = flipDeltas(
      pos({ a: { x: 5, y: 10 }, b: y(20) }),
      pos({ a: { x: 5.3, y: 10.3 }, b: y(20), n: y(99) }),
    );
    expect(d.size).toBe(0);
  });

  test("los que desaparecen se ignoran", () => {
    expect(
      flipDeltas(pos({ a: y(0), z: y(5) }), pos({ a: y(8) })).get("a"),
    ).toEqual({ dx: 0, dy: -8 });
  });

  test("sin posiciones previas no hay nada que animar", () => {
    expect(flipDeltas(new Map(), pos({ a: y(1) })).size).toBe(0);
  });
});

describe("idsNuevos e idsQuitados", () => {
  test("nuevos: están ahora y no antes, en el orden de la nueva", () => {
    expect(
      idsNuevos(pos({ a: y(0) }), pos({ n2: y(2), a: y(0), n1: y(1) })),
    ).toEqual(["n2", "n1"]);
  });

  test("quitados: estaban antes y ya no, en el orden de la anterior", () => {
    expect(
      idsQuitados(pos({ z: y(0), a: y(1), w: y(2) }), pos({ a: y(1) })),
    ).toEqual(["z", "w"]);
  });

  test("sin cambios de conjunto no hay ni nuevos ni quitados", () => {
    const m = pos({ a: y(0), b: y(1) });
    expect(idsNuevos(m, m)).toEqual([]);
    expect(idsQuitados(m, m)).toEqual([]);
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
