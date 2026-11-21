// D347: el número de la píldora de nota es blanco con sombra suave (elección de César), en todos
// los lugares que pintan una píldora con número; D498: salvo en 9–13, donde va en tinta oscura (D498).
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  contraste,
  GRADE_INK_CLARA,
  GRADE_INK_OSCURA,
  GRADE_NUMERO_CLASS,
  GRADE_NUMERO_OSCURO_CLASS,
  GRADE_SOMBRA,
  gradeColor,
  gradeNumeroClass,
  gradeNumeroOscuro,
} from "@/lib/grades";
import { OG_COLORS } from "@/lib/site";

const raiz = join(import.meta.dir, "..", "..");
const leer = (ruta: string) => readFileSync(join(raiz, ruta), "utf8");

describe("número de la píldora: blanco con sombra (D347), oscuro en 9–13 (D498)", () => {
  test("la clase es tinta blanca + sombra del token", () => {
    expect(GRADE_NUMERO_CLASS.split(" ").sort()).toEqual(
      ["text-grade-ink-on-dark", "text-shadow-grade"].sort(),
    );
  });

  test("globals.css define la sombra y coincide con la de la imagen OG", () => {
    const m = leer("app/globals.css").match(/--text-shadow-grade:\s*([^;]+);/);
    expect(m).not.toBeNull();
    const normal = (s: string) =>
      s
        .replace(/rgba?\(\s*0[ ,]+0[ ,]+0\s*[/,]\s*/g, "rgb(0 0 0 / ")
        .replace(/\s+/g, " ")
        .trim();
    expect(normal(m?.[1] ?? "")).toBe(normal(GRADE_SOMBRA));
  });

  test("las píldoras con número usan la clase, no la tinta por contraste", () => {
    for (const ruta of [
      "components/krea/grade-pill.tsx",
      "components/sections/ranking/ranking-rules.tsx",
    ]) {
      const src = leer(ruta);
      expect(src).toContain("gradeNumeroClass(");
      expect(src).not.toContain("GRADE_INK_CLASS");
    }
  });

  test("la imagen OG pinta el número en blanco con la misma sombra (y oscuro en 9–13)", () => {
    expect(OG_COLORS.GRADE_INK).toBe("#FFFFFF");
    expect(OG_COLORS.GRADE_INK_OSCURA).toBe(GRADE_INK_OSCURA);
    const og = leer("app/opengraph-image.tsx");
    expect(og).toContain("GRADE_SOMBRA");
    expect(og).toContain("gradeNumeroOscuro(nota)");
  });

  test("9 a 13 llevan tinta oscura sin sombra; 1–8 y 14–20, blanco con sombra", () => {
    for (let n = 1; n <= 20; n++) {
      const oscuro = n >= 9 && n <= 13;
      expect(gradeNumeroOscuro(n)).toBe(oscuro);
      expect(gradeNumeroClass(n)).toBe(
        oscuro ? GRADE_NUMERO_OSCURO_CLASS : GRADE_NUMERO_CLASS,
      );
    }
  });

  test("las notas con tinta oscura llegan a 4,5:1 sin contar sombra", () => {
    for (let n = 9; n <= 13; n += 0.5) {
      expect(gradeNumeroOscuro(n)).toBe(true);
      expect(contraste(GRADE_INK_OSCURA, gradeColor(n))).toBeGreaterThanOrEqual(
        4.5,
      );
    }
  });

  test("la tinta oscura solo se usa donde el blanco es peor que el umbral", () => {
    for (let n = 1; n <= 20; n += 0.5) {
      if (gradeNumeroOscuro(n)) {
        expect(contraste(GRADE_INK_CLARA, gradeColor(n))).toBeLessThan(1.8);
      }
    }
  });
});
