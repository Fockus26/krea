// D347: el número de la píldora de nota es siempre blanco con sombra suave (elección de César),
// en todos los lugares que pintan una píldora con número.
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GRADE_NUMERO_CLASS, GRADE_SOMBRA } from "@/lib/grades";
import { OG_COLORS } from "@/lib/site";

const raiz = join(import.meta.dir, "..", "..");
const leer = (ruta: string) => readFileSync(join(raiz, ruta), "utf8");

describe("número de la píldora siempre blanco con sombra (D347)", () => {
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
      expect(src).toContain("GRADE_NUMERO_CLASS");
      expect(src).not.toContain("GRADE_INK_CLASS");
    }
  });

  test("la imagen OG pinta el número en blanco con la misma sombra", () => {
    expect(OG_COLORS.GRADE_INK).toBe("#FFFFFF");
    expect(leer("app/opengraph-image.tsx")).toContain(
      "textShadow: GRADE_SOMBRA",
    );
  });
});
