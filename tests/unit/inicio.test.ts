import { describe, expect, test } from "bun:test";
import {
  avanceTexto,
  capitanTexto,
  deltaSemanaTexto,
  desglosePuntos,
  equipoChipTexto,
  equipoMetaTexto,
  lineaPendientes,
  puestoTexto,
} from "@/lib/inicio";

describe("lineaPendientes", () => {
  test("al día, una y varias (la más cercana, sin importar el orden)", () => {
    expect(lineaPendientes([])).toBe("Estás al día.");
    expect(lineaPendientes([{ fecha: "2026-11-03" }])).toBe(
      "Tienes 1 tarea por entregar. Vence el 03/11/2026.",
    );
    expect(
      lineaPendientes([{ fecha: "2026-11-07" }, { fecha: "2026-10-30" }]),
    ).toBe("Tienes 2 tareas por entregar. La más cercana vence el 30/10/2026.");
  });
});

describe("desglosePuntos", () => {
  test("lienzo: 18,5 + 19", () => {
    expect(desglosePuntos(18.5, 19, true)).toBe(
      "18,5 de tu nota individual + 19 de la grupal. Las notas menores de 10 no suman.",
    );
  });
  test("una nota menor de 10 o pendiente aporta 0 (D003, D007)", () => {
    expect(desglosePuntos(8, 17, true)).toBe(
      "0 de tu nota individual + 17 de la grupal. Las notas menores de 10 no suman.",
    );
    expect(desglosePuntos(null, null, true)).toBe(
      "0 de tu nota individual + 0 de la grupal. Las notas menores de 10 no suman.",
    );
  });
  test("sin equipo no hay parte grupal", () => {
    expect(desglosePuntos(15, null, false)).toBe(
      "15 de tu nota individual. Las notas menores de 10 no suman.",
    );
  });
});

describe("textos cortos", () => {
  test("puesto, delta, chip y meta del equipo", () => {
    expect(puestoTexto(1, 35)).toBe("#1 de 35");
    expect(deltaSemanaTexto(0)).toBeNull();
    expect(deltaSemanaTexto(2)).toBe("Subiste 2 puestos esta semana");
    expect(deltaSemanaTexto(1)).toBe("Subiste 1 puesto esta semana");
    expect(deltaSemanaTexto(-3)).toBe("Bajaste 3 puestos esta semana");
    expect(equipoChipTexto(1, 6, 19)).toBe("#1 de 6 · 19 pts");
    expect(equipoChipTexto(2, 6, 17.5)).toBe("#2 de 6 · 17,5 pts");
    expect(equipoMetaTexto("Repostería", 4)).toBe(
      "Tema: Repostería · 4 integrantes",
    );
    expect(equipoMetaTexto(null, 1)).toBe("1 integrante");
  });
  test("capitán: tú o el nombre; género por prop", () => {
    expect(capitanTexto("Yeilin Duarte", true, true)).toEqual({
      etiqueta: "Capitana:",
      quien: "tú",
    });
    expect(capitanTexto("Jorge Quintero", false)).toEqual({
      etiqueta: "Capitán:",
      quien: "Jorge Quintero",
    });
  });
  test("avance", () => {
    expect(avanceTexto("borrador")).toBe("Borrador guardado");
    expect(avanceTexto("sin-empezar")).toBe("Sin empezar");
  });
});
