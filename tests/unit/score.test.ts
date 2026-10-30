import { describe, expect, test } from "bun:test";
import {
  isScoreKey,
  pushScoreKey,
  SCORE_BUFFER_MS,
  type ScoreBuffer,
  scoreLabel,
  scoreMode,
  scoreOptions,
  scoreShortcuts,
  scoreText,
} from "@/lib/score";

describe("scoreMode y scoreOptions (§2.12, D004)", () => {
  test("0,5 → 2 botones", () => {
    expect(scoreOptions(0.5)).toEqual([0, 0.5]);
    expect(scoreMode(0.5)).toBe("buttons");
  });

  test("6 → 13 botones, todavía botones", () => {
    const opts = scoreOptions(6);
    expect(opts).toHaveLength(13);
    expect(opts[0]).toBe(0);
    expect(opts.at(-1)).toBe(6);
    expect(scoreMode(6)).toBe("buttons");
  });

  test("6,5 → stepper", () => {
    expect(scoreMode(6.5)).toBe("stepper");
    expect(scoreMode(20)).toBe("stepper");
  });

  test("todas las opciones caen en pasos de 0,5", () => {
    for (const v of scoreOptions(4.5))
      expect(Number.isInteger(v * 2)).toBe(true);
    expect(scoreOptions(4.5)).toHaveLength(10);
  });
});

describe("scoreShortcuts (D055: al paso, medios hacia arriba)", () => {
  test("20 → 0 · 5 · 10 · 15 · 20 (tablero Contenido extremo)", () => {
    expect(scoreShortcuts(20)).toEqual([0, 5, 10, 15, 20]);
  });

  test("7 → ¼ = 1,75 sube a 2 · ¾ = 5,25 sube a 5,5", () => {
    expect(scoreShortcuts(7)).toEqual([0, 2, 3.5, 5.5, 7]);
  });

  test("8 y 6,5", () => {
    expect(scoreShortcuts(8)).toEqual([0, 2, 4, 6, 8]);
    // 1,625 → 1,5 · 3,25 → 3,5 · 4,875 → 5
    expect(scoreShortcuts(6.5)).toEqual([0, 1.5, 3.5, 5, 6.5]);
  });
});

describe("textos del puntaje", () => {
  test("coma es-VE, sin decimales de más", () => {
    expect(scoreText(3.5)).toBe("3,5");
    expect(scoreText(4)).toBe("4");
  });

  test("nombre accesible con singular y plural", () => {
    expect(scoreLabel(1)).toBe("1 punto");
    expect(scoreLabel(0)).toBe("0 puntos");
    expect(scoreLabel(0.5)).toBe("0,5 puntos");
    expect(scoreLabel(3.5)).toBe("3,5 puntos");
  });
});

/** Teclea una secuencia; cada tecla llega `gap` ms después de la anterior. */
function teclear(keys: string[], max: number, gap = 100) {
  let buffer: ScoreBuffer = null;
  const values: (number | null)[] = [];
  for (const [i, k] of keys.entries()) {
    const r = pushScoreKey(buffer, k, max, i * gap);
    buffer = r.buffer;
    values.push(r.value);
  }
  return { buffer, values };
}

describe("pushScoreKey (D054)", () => {
  test("solo dígitos, coma y punto son teclas de puntaje", () => {
    expect(isScoreKey("7")).toBe(true);
    expect(isScoreKey(",")).toBe(true);
    expect(isScoreKey(".")).toBe(true);
    expect(isScoreKey("Enter")).toBe(false);
    expect(isScoreKey("a")).toBe(false);
    expect(pushScoreKey(null, "Enter", 6, 0)).toEqual({
      buffer: null,
      value: null,
    });
  });

  test('"1" → 1 · "1" "7" → 17 si cabe', () => {
    expect(teclear(["1"], 4).values).toEqual([1]);
    expect(teclear(["1", "7"], 20).values).toEqual([1, 17]);
  });

  test('"3" "," "5" → 3,5 (la coma sola fija 3)', () => {
    expect(teclear(["3", ",", "5"], 4).values).toEqual([3, 3, 3.5]);
  });

  test("el punto cuenta como coma", () => {
    expect(teclear(["2", ".", "5"], 4).values).toEqual([2, 2, 2.5]);
  });

  test('"," al inicio = "0,"', () => {
    expect(teclear([",", "5"], 4).values).toEqual([0, 0.5]);
  });

  test("fuera de rango: un dígito que se pasa empieza un número nuevo", () => {
    // 32 no cabe en 4 → empieza "2"
    expect(teclear(["3", "2"], 4).values).toEqual([3, 2]);
    // 17 no cabe y 7 tampoco → rechazado, se queda el 1
    const r = teclear(["1", "7"], 4);
    expect(r.values).toEqual([1, null]);
    expect(r.buffer?.text).toBe("1");
  });

  test("un dígito suelto mayor que el valor se rechaza", () => {
    expect(teclear(["9"], 6).values).toEqual([null]);
  });

  test("coma doble: la segunda se ignora", () => {
    const r = teclear(["3", ",", ","], 4);
    expect(r.values).toEqual([3, 3, null]);
    expect(r.buffer?.text).toBe("3,");
  });

  test("decimales fuera del paso o de más se ignoran", () => {
    expect(teclear(["3", ",", "2"], 4).values).toEqual([3, 3, null]);
    expect(teclear(["3", ",", "0"], 4).values).toEqual([3, 3, 3]);
    expect(teclear(["3", ",", "5", "5"], 4).values).toEqual([3, 3, 3.5, null]);
  });

  test("decimal que supera el valor se ignora (4,5 con valor 4)", () => {
    expect(teclear(["4", ",", "5"], 4).values).toEqual([4, 4, null]);
  });

  test("coma sobre el máximo con valor fraccionario", () => {
    expect(teclear(["2", ",", "5"], 2.5).values).toEqual([2, 2, 2.5]);
  });

  test("caducidad: pasado el tiempo empieza de cero", () => {
    const a = pushScoreKey(null, "1", 20, 0);
    const b = pushScoreKey(a.buffer, "5", 20, SCORE_BUFFER_MS + 1);
    expect(b.value).toBe(5);
    // justo en el límite todavía se suma
    const c = pushScoreKey(a.buffer, "5", 20, SCORE_BUFFER_MS);
    expect(c.value).toBe(15);
  });

  test("la caducidad es un parámetro", () => {
    const a = pushScoreKey(null, "1", 20, 0, 300);
    expect(pushScoreKey(a.buffer, "2", 20, 400, 300).value).toBe(2);
    expect(pushScoreKey(a.buffer, "2", 20, 200, 300).value).toBe(12);
  });

  test("una tecla rechazada no alarga la caducidad", () => {
    const a = pushScoreKey(null, "3", 4, 0);
    const b = pushScoreKey(a.buffer, ",", 4, 500);
    const c = pushScoreKey(b.buffer, ",", 4, 900); // rechazada
    expect(c.buffer?.at).toBe(500);
  });
});
