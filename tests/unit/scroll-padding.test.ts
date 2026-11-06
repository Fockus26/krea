import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

/**
 * D-M4 (QA versión 1): con Tab en móvil el elemento enfocado quedaba bajo la barra inferior fija.
 * Por debajo de lg, y con altura suficiente para que la barra sea fija (D218), el documento
 * reserva el alto de la barra + la zona segura como `scroll-padding-bottom` (D222).
 */
const css = readFileSync("app/globals.css", "utf8");

describe("scroll-padding para la barra inferior (D-M4)", () => {
  test("html reserva la barra inferior por debajo de lg", () => {
    const bloque = css.match(
      /@media \(width < 64rem\) and \(height >= 30rem\) \{\s*html \{([^}]*)\}/,
    );
    expect(bloque).not.toBeNull();
    const cuerpo = (bloque?.[1] ?? "").replace(/\s+/g, " ");
    expect(cuerpo).toContain(
      "scroll-padding-bottom: calc( var(--h-bnav) + env(safe-area-inset-bottom, 0px)",
    );
  });
  test("no suma scroll-padding-top general (las anclas ya usan scroll-margin-top)", () => {
    expect(css).not.toMatch(/(^|\n)\s*html \{[^}]*scroll-padding-top/);
  });
});
