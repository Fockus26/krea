import { describe, expect, test } from "bun:test";
import { gradeColor } from "@/lib/grades";
import {
  answerImageAlt,
  barWidth,
  lockedMessage,
  questionBar,
  questionValueText,
} from "@/lib/question";

describe("questionValueText (§2.16)", () => {
  test("detalle: obtenido / valor con coma", () => {
    expect(questionValueText("detalle", 4, 3.5)).toBe("3,5 / 4");
    expect(questionValueText("detalle", 4, 4)).toBe("4 / 4");
    expect(questionValueText("detalle", 4, 0)).toBe("0 / 4");
  });

  test("detalle sin nota es Pendiente, nunca 0 (D003)", () => {
    expect(questionValueText("detalle", 4, null)).toBe("Pendiente · vale 4");
    expect(questionValueText("detalle", 4)).toBe("Pendiente · vale 4");
  });

  test("evaluar: vale n; responder: n pts", () => {
    expect(questionValueText("evaluar", 4)).toBe("vale 4");
    expect(questionValueText("evaluar", 2.5)).toBe("vale 2,5");
    expect(questionValueText("responder", 4)).toBe("4 pts");
    expect(questionValueText("responder", 6)).toBe("6 pts");
  });
});

describe("questionBar (§2.11)", () => {
  test("relleno proporcional y color de la escala de nota", () => {
    const bar = questionBar(3.5, 4);
    expect(bar.fraction).toBe(0.875);
    expect(bar.color).toBe(gradeColor(17.5));
    expect(bar.text).toBe("3,5 / 4");
  });

  test("nota completa llena la barra", () => {
    const bar = questionBar(4, 4);
    expect(bar.fraction).toBe(1);
    expect(bar.color).toBe(gradeColor(20));
  });

  test("null: sin relleno ni color y 'Pendiente' (D003)", () => {
    expect(questionBar(null, 4)).toEqual({
      fraction: 0,
      color: null,
      text: "Pendiente",
    });
  });

  test("0 puntos: sin relleno pero con texto '0 / 4'", () => {
    const bar = questionBar(0, 4);
    expect(bar.fraction).toBe(0);
    expect(bar.color).toBeNull();
    expect(bar.text).toBe("0 / 4");
  });

  test("obtenido mayor que el valor se recorta a 1; valor 0 no divide", () => {
    expect(questionBar(5, 4).fraction).toBe(1);
    expect(questionBar(1, 0).fraction).toBe(0);
  });
});

describe("barWidth", () => {
  test("porcentaje con un decimal como máximo", () => {
    expect(barWidth(0.875)).toBe("87.5%");
    expect(barWidth(1)).toBe("100%");
    expect(barWidth(0)).toBe("0%");
  });
});

describe("textos accesibles", () => {
  test("alt de la respuesta en imagen", () => {
    expect(answerImageAlt("Juana", 3)).toBe(
      "Respuesta de Juana a la pregunta 3",
    );
  });

  test("aviso de capitán (D012)", () => {
    expect(lockedMessage("Mateo")).toBe("Solo Mateo puede responder.");
  });
});
