import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";

/**
 * D-B1 y D-B2 (QA versión 1; D230). El título de la barra superior pasa a dos líneas antes que
 * quedar en «Nueva t…» junto a «Guardar borrador» a 320 px. Los SVG de la plantilla de Next no
 * se publican.
 */
describe("barra superior y archivos de plantilla (D230)", () => {
  test("el título se parte en dos líneas, no se recorta en una", () => {
    const barra = readFileSync("components/layout/top-bar.tsx", "utf8");
    expect(barra).toContain("text-h4 min-w-0 flex-1 line-clamp-2 text-text");
    expect(barra).not.toContain("text-h4 min-w-0 flex-1 truncate");
  });
  test("sin los SVG de la plantilla en public/", () => {
    for (const f of ["next", "vercel", "file", "globe", "window"]) {
      expect(existsSync(`public/${f}.svg`)).toBe(false);
    }
  });
});
