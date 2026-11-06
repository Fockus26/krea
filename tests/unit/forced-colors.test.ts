import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

/**
 * Clase D-A2/D-A3 (QA versión 1): en alto contraste el modo forzado pinta todo fondo con
 * Canvas. Lo que se dibuja solo con fondo (capas del logo con máscara) o se distingue solo
 * por fondo + sombra (opción activa) necesita su regla en `@media (forced-colors: active)`.
 */
const css = readFileSync("app/globals.css", "utf8");
const bloque =
  css.match(/@media \(forced-colors: active\) \{([\s\S]*?)\n\}/)?.[1] ?? "";

describe("alto contraste (forced-colors)", () => {
  test("hay un bloque forced-colors en globals.css", () => {
    expect(bloque).not.toBe("");
  });

  test("cada capa con máscara del logo e isotipo tiene color del sistema", () => {
    const utilidades = [
      ...css.matchAll(/@utility (krea-(?:mask|iso)-[a-z]+)/g),
    ].map((m) => m[1]);
    expect(utilidades.length).toBeGreaterThan(0);
    for (const u of utilidades) expect(bloque).toContain(`.${u}`);
  });

  test("la opción activa de segmentados, pestañas y enlaces usa Highlight", () => {
    for (const sel of [
      '[data-slot="toggle-group-item"][data-state="on"]',
      '[data-slot="tabs-trigger"][data-state="active"]',
      'a[aria-current="page"]',
    ]) {
      expect(bloque).toContain(sel);
    }
    expect(bloque).toContain("background-color: Highlight");
  });
});
