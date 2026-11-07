import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  contraste,
  GRADE_INK_CLARA,
  GRADE_INK_OSCURA,
  gradeColor,
  gradeInk,
} from "@/lib/grades";

/**
 * Contraste WCAG de los tokens de `app/globals.css` (D236, D238). Lee los valores del CSS, así
 * que un cambio de token que rompa 4,5:1 falla aquí. Los derivados (`color-mix` sobre sRGB) se
 * recalculan con la misma fórmula que el navegador.
 */
const css = readFileSync(
  join(import.meta.dir, "..", "..", "app", "globals.css"),
  "utf8",
);

function bloque(fuente: string, selector: string): Record<string, string> {
  const inicio = fuente.indexOf(`${selector} {`);
  if (inicio === -1) throw new Error(`No existe el bloque ${selector}`);
  const abre = fuente.indexOf("{", inicio);
  const cierra = fuente.indexOf("}", abre);
  const out: Record<string, string> = {};
  for (const m of fuente
    .slice(abre + 1, cierra)
    .matchAll(/(--[\w-]+):\s*([^;]+);/g))
    out[m[1]] = m[2].trim().replace(/\s*\/\*.*$/, "");
  return out;
}

const rgb = (hex: string) =>
  [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
const hex = (c: number[]) =>
  `#${c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
/** `color-mix(in srgb, a p%, b)` */
const mezcla = (a: string, p: number, b: string) => {
  const [x, y] = [rgb(a), rgb(b)];
  return hex(x.map((v, i) => v * p + y[i] * (1 - p)));
};
const pct = (v: string) => Number.parseFloat(v) / 100;

const dark = bloque(css, '[data-theme="dark"]');
const claro = bloque(css, ':root,\n[data-theme="light"]');
const sistema = bloque(
  css.slice(css.indexOf("@media (prefers-color-scheme: dark)")),
  ':root:not([data-theme="light"])',
);

const ACENTOS = ["azul", "rojo", "verde", "morado"] as const;
function acento(tema: "claro" | "oscuro", nombre: (typeof ACENTOS)[number]) {
  const base = tema === "claro" ? claro : dark;
  if (nombre === "azul") return base;
  const sel =
    tema === "claro"
      ? `[data-accent="${nombre}"]`
      : `[data-theme="dark"][data-accent="${nombre}"]`;
  return { ...base, ...bloque(css, sel) };
}

const MIN = 4.5;

for (const tema of ["claro", "oscuro"] as const) {
  describe(`contraste de tokens en ${tema}`, () => {
    for (const nombre of ACENTOS) {
      const t = acento(tema, nombre);
      const accent = t["--accent"];
      const ink = t["--accent-ink"];
      const on = t["--on-accent"];
      const soft = mezcla(accent, pct(t["--tint-1"]), t["--surface"]);
      const soft2 = mezcla(accent, pct(t["--tint-2"]), t["--surface"]);
      const hover = mezcla(accent, 0.88, t["--hover-mix"]);
      const sel = mezcla(accent, pct(t["--tint-sel"]), t["--bg"]);

      const pares: Array<[string, string, string]> = [
        ["--on-accent sobre --accent (botón primario)", on, accent],
        ["--on-accent sobre --accent-hover", on, hover],
        ["--accent-ink sobre --bg", ink, t["--bg"]],
        ["--accent-ink sobre --surface", ink, t["--surface"]],
        ["--accent-ink sobre --surface-2", ink, t["--surface-2"]],
        ["--accent-ink sobre --accent-soft", ink, soft],
        ["--accent-ink sobre --accent-soft-2", ink, soft2],
        ["--text sobre --accent-soft-2", t["--text"], soft2],
        ["--sel-text sobre --sel-bg (::selection)", t["--sel-text"], sel],
      ];
      for (const [nombrePar, fg, bg] of pares) {
        test(`${nombre}: ${nombrePar} ≥ ${MIN}:1`, () => {
          expect(contraste(fg, bg)).toBeGreaterThanOrEqual(MIN);
        });
      }
    }

    test("texto y estados sobre las superficies", () => {
      const t = acento(tema, "azul");
      for (const fondo of ["--bg", "--surface", "--surface-2"]) {
        for (const fg of ["--text", "--text-2"]) {
          expect(contraste(t[fg], t[fondo])).toBeGreaterThanOrEqual(MIN);
        }
        for (const fg of ["--success", "--warning", "--error"]) {
          expect(contraste(t[fg], t[fondo])).toBeGreaterThanOrEqual(MIN);
        }
      }
      expect(contraste(t["--on-error"], t["--error"])).toBeGreaterThanOrEqual(
        MIN,
      );
    });
  });
}

describe("el tema del sistema repite los valores del oscuro (D238)", () => {
  test("tintes y selección", () => {
    for (const k of [
      "--tint-1",
      "--tint-2",
      "--tint-sel",
      "--tint-prize-card",
    ]) {
      expect(sistema[k]).toBe(dark[k]);
    }
    expect(sistema["--sel-text"]).toBe(dark["--sel-text"]);
  });
});

describe("tintas de la píldora de nota (D236)", () => {
  test("los tokens CSS espejan las constantes de lib/grades.ts", () => {
    expect(claro["--grade-ink"].toUpperCase()).toBe(GRADE_INK_OSCURA);
    expect(claro["--grade-ink-on-dark"].toUpperCase()).toBe(GRADE_INK_CLARA);
  });

  test("cada nota de 1 a 20 en pasos de 0,5 alcanza 4,5:1 con su tinta", () => {
    for (let n = 1; n <= 20; n += 0.5) {
      const tinta =
        gradeInk(n) === "clara" ? GRADE_INK_CLARA : GRADE_INK_OSCURA;
      expect(contraste(tinta, gradeColor(n))).toBeGreaterThanOrEqual(MIN);
    }
  });

  test("a cada décima de la escala (1–20) la tinta elegida alcanza 4,5:1 (D286)", () => {
    for (let d = 10; d <= 200; d++) {
      const n = d / 10;
      const tinta =
        gradeInk(n) === "clara" ? GRADE_INK_CLARA : GRADE_INK_OSCURA;
      expect(contraste(tinta, gradeColor(n))).toBeGreaterThanOrEqual(MIN);
    }
  });

  test("en los extremos de la escala la tinta es la clara, en el medio la oscura (D286)", () => {
    for (const n of [1, 1.5, 19.5, 20]) expect(gradeInk(n)).toBe("clara");
    for (let n = 2; n <= 19; n += 0.5) expect(gradeInk(n)).toBe("oscura");
  });

  test("elige la tinta de mayor contraste", () => {
    for (let n = 1; n <= 20; n += 0.5) {
      const fondo = gradeColor(n);
      const mejor = Math.max(
        contraste(GRADE_INK_CLARA, fondo),
        contraste(GRADE_INK_OSCURA, fondo),
      );
      const tinta =
        gradeInk(n) === "clara" ? GRADE_INK_CLARA : GRADE_INK_OSCURA;
      expect(contraste(tinta, fondo)).toBe(mejor);
    }
  });
});

describe("foco de los campos (D237)", () => {
  test("el foco del <input> interior se apaga y la caja lo lleva", () => {
    expect(css).toContain('[data-slot="input-group"] > input:focus-visible');
    expect(css).toContain('[data-slot="input-group"]:focus-within');
  });
});

describe("botón ocupado vs deshabilitado (D285)", () => {
  const boton = readFileSync(
    join(import.meta.dir, "..", "..", "components", "ui", "button.tsx"),
    "utf8",
  );

  test("los colores de deshabilitado no aplican a un botón con aria-busy", () => {
    expect(boton).not.toMatch(/(^|[\s"])(?:aria-)?disabled:bg-surface-3/m);
    expect(boton).toContain("not-aria-busy:disabled:bg-surface-3");
    expect(boton).toContain("not-aria-busy:aria-disabled:text-text-dis");
  });

  test("ocupado conserva la variante: pares ya cubiertos arriba, 4,5:1 en 4 acentos × 2 temas", () => {
    for (const tema of ["claro", "oscuro"] as const) {
      for (const nombre of ACENTOS) {
        const t = acento(tema, nombre);
        // primario: --on-accent sobre --accent; secundario: --accent-ink sobre --surface;
        // ghost: --accent-ink sobre --bg
        expect(
          contraste(t["--on-accent"], t["--accent"]),
        ).toBeGreaterThanOrEqual(MIN);
        expect(
          contraste(t["--accent-ink"], t["--surface"]),
        ).toBeGreaterThanOrEqual(MIN);
        expect(contraste(t["--accent-ink"], t["--bg"])).toBeGreaterThanOrEqual(
          MIN,
        );
      }
    }
  });
});
