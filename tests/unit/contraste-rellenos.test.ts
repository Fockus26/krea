import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { contraste } from "@/lib/grades";

/**
 * Rellenos de color con texto (D328): `danger`, chip «VS», botón quitar imagen y la marca de «entregada».
 * En claro y en oscuro (explícito y por sistema) el texto es `--on-*` y debe llegar a 4,5:1 sobre el
 * relleno (`--error-fill`, `--success-fill`), también en el hover de `danger` (`brightness-92`).
 * El relleno, como componente no textual, a ≥ 3:1 contra `--bg` y `--surface`. Lee `app/globals.css`.
 */
const css = readFileSync(
  join(import.meta.dir, "..", "..", "app", "globals.css"),
  "utf8",
);

function bloque(inicioBusqueda: string): Record<string, string> {
  const inicio = css.indexOf(inicioBusqueda);
  if (inicio === -1) throw new Error(`No existe ${inicioBusqueda}`);
  const abre = css.indexOf("{", inicio);
  const cierra = css.indexOf("}", abre);
  const out: Record<string, string> = {};
  for (const m of css
    .slice(abre + 1, cierra)
    .matchAll(/(--[\w-]+):\s*([^;]+);/g))
    out[m[1]] = m[2].trim().replace(/\s*\/\*.*$/, "");
  return out;
}

const rgb = (h: string) =>
  [1, 3, 5].map((i) => Number.parseInt(h.slice(i, i + 2), 16));
const hex = (c: number[]) =>
  `#${c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
/** `filter: brightness(k)` multiplica cada canal. */
const brillo = (h: string, k: number) => hex(rgb(h).map((v) => v * k));

const claro = bloque(':root,\n[data-theme="light"]');
const oscuroExplicito = { ...claro, ...bloque('[data-theme="dark"] {') };
// el bloque de sistema empieza con `:root:not(...)`: se lee tras la media query
const sistema = (() => {
  const m = css.indexOf("@media (prefers-color-scheme: dark)");
  const abre = css.indexOf("{", css.indexOf("{", m) + 1);
  const cierra = css.indexOf("}", abre);
  const out: Record<string, string> = { ...claro };
  for (const x of css
    .slice(abre + 1, cierra)
    .matchAll(/(--[\w-]+):\s*([^;]+);/g))
    out[x[1]] = x[2].trim().replace(/\s*\/\*.*$/, "");
  return out;
})();

const temas = [
  ["claro", claro],
  ["oscuro explícito", oscuroExplicito],
  ["oscuro por sistema", sistema],
] as const;

const pares = [
  ["--error-fill", "--on-error"],
  ["--success-fill", "--on-success"],
] as const;

describe("rellenos con texto: blanco ≥ 4,5:1 (D328)", () => {
  for (const [nombre, t] of temas)
    for (const [relleno, tinta] of pares)
      test(`${relleno} / ${tinta} en ${nombre}`, () => {
        expect(contraste(t[tinta], t[relleno])).toBeGreaterThanOrEqual(4.5);
      });

  for (const [nombre, t] of temas)
    test(`danger en hover (brightness-92) en ${nombre}`, () => {
      expect(
        contraste(t["--on-error"], brillo(t["--error-fill"], 0.92)),
      ).toBeGreaterThanOrEqual(4.5);
    });
});

describe("el relleno se distingue del fondo: ≥ 3:1 (D328)", () => {
  for (const [nombre, t] of temas)
    for (const [relleno] of pares)
      for (const fondo of ["--bg", "--surface"])
        test(`${relleno} sobre ${fondo} en ${nombre}`, () => {
          expect(contraste(t[relleno], t[fondo])).toBeGreaterThanOrEqual(3);
        });
});

describe("en oscuro el texto sobre el relleno es blanco", () => {
  for (const [nombre, t] of temas.slice(1)) {
    test(nombre, () => {
      expect(t["--on-error"]).toBe("#ffffff");
      expect(t["--on-success"]).toBe("#ffffff");
    });
  }
});
