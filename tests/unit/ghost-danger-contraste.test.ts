import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { contraste } from "@/lib/grades";

/**
 * `ghost-danger` (D297): texto `--error` sobre la superficie, sobre el hover (`--alert-err-bg`) y
 * sobre el activo (`--chip-err-bg`), en claro y oscuro. El rojo no depende del acento: el resultado
 * es el mismo en los 4. Lee los valores de `app/globals.css`.
 */
const css = readFileSync(
  join(import.meta.dir, "..", "..", "app", "globals.css"),
  "utf8",
);

function bloque(selector: string): Record<string, string> {
  const inicio = css.indexOf(`${selector} {`);
  if (inicio === -1) throw new Error(`No existe el bloque ${selector}`);
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
const mezcla = (a: string, p: number, b: string) => {
  const [x, y] = [rgb(a), rgb(b)];
  return hex(x.map((v, i) => v * p + y[i] * (1 - p)));
};

const claro = bloque(':root,\n[data-theme="light"]');
const oscuro = { ...claro, ...bloque('[data-theme="dark"]') };

describe("ghost-danger: --error legible en reposo, hover y activo (D297)", () => {
  for (const [nombre, t] of [
    ["claro", claro],
    ["oscuro", oscuro],
  ] as const) {
    test(nombre, () => {
      const error = t["--error"];
      const surface = t["--surface"];
      const hover = mezcla(
        error,
        Number.parseFloat(t["--tint-alert-err"]) / 100,
        surface,
      );
      const activo = mezcla(
        error,
        Number.parseFloat(t["--tint-err"]) / 100,
        surface,
      );
      for (const fondo of [surface, hover, activo])
        expect(contraste(error, fondo)).toBeGreaterThanOrEqual(4.5);
    });
  }
});
