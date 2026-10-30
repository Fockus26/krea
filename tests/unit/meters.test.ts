import { describe, expect, test } from "bun:test";
import { liveTotalInfo, percent, sumMeterInfo } from "@/lib/meters";

describe("percent", () => {
  test("acota a 0–100 y no divide entre 0", () => {
    expect(percent(14, 20)).toBe(70);
    expect(percent(25, 20)).toBe(100);
    expect(percent(-1, 20)).toBe(0);
    expect(percent(3, 0)).toBe(0);
  });
});

describe("sumMeterInfo (§2.11, D004)", () => {
  test("faltan: warning, barra = suma / 20", () => {
    const i = sumMeterInfo(14);
    expect(i.state).toBe("under");
    expect(i.message).toBe("Faltan 6");
    expect(i.pct).toBe(70);
    expect(i.display).toBe("14 / 20");
  });

  test("singular y decimales con coma", () => {
    expect(sumMeterInfo(19).message).toBe("Falta 1");
    expect(sumMeterInfo(19.5).message).toBe("Faltan 0,5");
    expect(sumMeterInfo(13.5).message).toBe("Faltan 6,5");
    expect(sumMeterInfo(13.5).display).toBe("13,5 / 20");
  });

  test("se pasó: barra al 100 %", () => {
    const i = sumMeterInfo(22);
    expect(i.state).toBe("over");
    expect(i.message).toBe("Te pasaste por 2");
    expect(i.pct).toBe(100);
    expect(sumMeterInfo(20.5).message).toBe("Te pasaste por 0,5");
  });

  test("exacta", () => {
    const i = sumMeterInfo(20);
    expect(i.state).toBe("exact");
    expect(i.message).toBe("Suma exacta");
    expect(i.pct).toBe(100);
  });

  test("el ruido de coma flotante no rompe la suma exacta", () => {
    expect(sumMeterInfo(0.1 + 0.2 + 19.7).state).toBe("exact");
  });

  test("texto para lector de pantalla", () => {
    expect(sumMeterInfo(14).srText).toBe("Suma de valores: 14 de 20. Faltan 6.");
  });
});

describe("liveTotalInfo (§2.11, D006, D013)", () => {
  test("pendientes: suma lo puntuado y cuenta lo que falta", () => {
    const i = liveTotalInfo([4, 5, null, null, null], 20);
    expect(i.total).toBe(9);
    expect(i.nota).toBe(9);
    expect(i.display).toBe("9 / 20");
    expect(i.progress).toBe("2 de 5 puntuadas");
    expect(i.pending).toBe("Faltan 3 preguntas por puntuar");
    expect(i.completo).toBe(false);
    expect(i.pctTotal).toBe(45);
    expect(i.pctPuntuadas).toBe(40);
  });

  test("singular", () => {
    expect(liveTotalInfo([4, null]).pending).toBe("Falta 1 pregunta por puntuar");
  });

  test("ninguna puntuada = nota Pendiente, nunca 0 (D003)", () => {
    const i = liveTotalInfo([null, null]);
    expect(i.nota).toBeNull();
    expect(i.srText).toBe("Total 0 de 20, nota pendiente. 0 de 2 puntuadas.");
  });

  test("con base 15 usa notaFinal (18,5 × 15 / 20 = 13,875 → 13,9)", () => {
    const i = liveTotalInfo([6, 4, 3.5, 5], 15);
    expect(i.total).toBe(18.5);
    expect(i.nota).toBe(13.9);
    expect(i.completo).toBe(true);
    expect(i.pending).toBe("Todas las preguntas puntuadas");
    expect(i.baseText).toBe("Nota resultante con Base 15");
    expect(i.display).toBe("18,5 / 20");
  });

  test("base con decimales se lee con coma", () => {
    expect(liveTotalInfo([10], 17.5).baseText).toBe(
      "Nota resultante con Base 17,5",
    );
  });

  test("una suma mal formada se acota a 20 en lugar de lanzar", () => {
    expect(liveTotalInfo([15, 10]).total).toBe(20);
  });
});
