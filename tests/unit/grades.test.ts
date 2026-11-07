import { describe, expect, test } from "bun:test";
import { formatNota, gradeColor, notaFinal, puntosRanking } from "@/lib/grades";

describe("gradeColor", () => {
  const tabla: Array<[number, string]> = [
    [1, "#E00000"],
    [2, "#FF1B03"],
    [3, "#FF3606"],
    [5, "#FF6301"],
    [8, "#F9A800"],
    [9, "#F7BE00"],
    [10, "#F5D400"],
    [10.5, "#EFE102"],
    [11, "#E7EA04"],
    [11.5, "#D1E505"],
    [12, "#BDE007"],
    [13, "#97D50A"],
    [14, "#75CB0D"],
    [15, "#57C110"],
    [17, "#25AE14"],
    [18, "#16A31C"],
    [18.5, "#179C26"],
    [19, "#17942F"],
    [19.5, "#147A2F"],
    [20, "#147133"],
  ];
  for (const [n, hex] of tabla) {
    test(`${n} → ${hex}`, () => {
      expect(gradeColor(n)).toBe(hex);
    });
  }

  test("n < 1 se trata como 1", () => {
    expect(gradeColor(0)).toBe(gradeColor(1));
    expect(gradeColor(-3)).toBe(gradeColor(1));
  });
});

describe("formatNota", () => {
  test("coma decimal y 1 decimal máximo", () => {
    expect(formatNota(18.5)).toBe("18,5");
    expect(formatNota(14)).toBe("14");
    expect(formatNota(13.9)).toBe("13,9");
    expect(formatNota(13.875)).toBe("13,9");
  });
  test("null es Pendiente, no 0 (D003)", () => {
    expect(formatNota(null)).toBe("Pendiente");
    expect(formatNota(0)).toBe("0");
  });
});

describe("notaFinal", () => {
  test("base 20 no cambia el puntaje", () => {
    expect(notaFinal(17, 20)).toBe(17);
    expect(notaFinal(13.5, 20)).toBe(13.5);
  });
  test("mitad hacia arriba (D013)", () => {
    expect(notaFinal(18.5, 15)).toBe(13.9); // 13,875
    expect(notaFinal(17, 15)).toBe(12.8); // 12,75 → 12,8
    expect(notaFinal(16.5, 15)).toBe(12.4); // 12,375 → 12,4
  });
  test("casos sin redondeo y bordes", () => {
    expect(notaFinal(0.5, 10)).toBe(0.3); // 0,25 → 0,3
    expect(notaFinal(0, 10)).toBe(0);
    expect(notaFinal(20, 10)).toBe(10);
    expect(notaFinal(10, 12.5)).toBe(6.3); // 6,25 → 6,3
    expect(notaFinal(9, 13)).toBe(5.9); // 5,85 → 5,9
  });
  test("puntaje null → null", () => {
    expect(notaFinal(null, 15)).toBeNull();
  });
  test("valida puntaje y base", () => {
    expect(() => notaFinal(10, 9.5)).toThrow(RangeError);
    expect(() => notaFinal(10, 20.5)).toThrow(RangeError);
    expect(() => notaFinal(10, 15.25)).toThrow(RangeError);
    expect(() => notaFinal(10.25, 15)).toThrow(RangeError);
    expect(() => notaFinal(21, 15)).toThrow(RangeError);
    expect(() => notaFinal(-1, 15)).toThrow(RangeError);
  });
});

describe("puntosRanking", () => {
  test("null o < 10 aporta 0; desde 10 aporta la nota (D007)", () => {
    expect(puntosRanking(null)).toBe(0);
    expect(puntosRanking(9.5)).toBe(0);
    expect(puntosRanking(10)).toBe(10);
    expect(puntosRanking(17.5)).toBe(17.5);
  });
});
