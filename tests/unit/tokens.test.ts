import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..", "..");
const css = readFileSync(join(root, "app", "globals.css"), "utf8");

/** Extrae el cuerpo de la primera regla cuyo selector es exactamente `selector`. */
function block(source: string, selector: string): string {
  const start = source.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`No existe el bloque ${selector}`);
  const open = source.indexOf("{", start);
  const close = source.indexOf("}", open);
  return source.slice(open + 1, close);
}

function vars(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of body.matchAll(/(--[\w-]+):\s*([^;]+);/g))
    out[m[1]] = m[2].trim();
  return out;
}

const light = vars(block(css, ':root,\n[data-theme="light"]'));
const dark = vars(block(css, '[data-theme="dark"]'));
const media = css.slice(css.indexOf("@media (prefers-color-scheme: dark)"));
const system = vars(block(media, ':root:not([data-theme="light"])'));

// HANDOFF §1.1–1.2 (valores base; los derivados son color-mix)
const THEME_TOKENS = [
  "bg",
  "surface",
  "surface-2",
  "surface-3",
  "text",
  "text-2",
  "text-dis",
  "divider",
  "input",
  "success",
  "warning",
  "error",
  "secondary",
  "on-secondary",
  "grade-ink",
  "sel-bg",
  "sel-text",
  "scroll-thumb",
  "scroll-track",
  "toast-bg",
  "toast-text",
  "accent",
  "accent-ink",
  "on-accent",
  "splash",
  "shadow-1",
  "shadow-2",
  "shadow-3",
];

describe("tokens de globals.css", () => {
  test("claro define todos los tokens", () => {
    for (const t of THEME_TOKENS) expect(light[`--${t}`]).toBeDefined();
  });

  test("oscuro redefine lo que cambia con el tema", () => {
    const sameInBoth = ["secondary", "on-secondary", "grade-ink", "splash"];
    for (const t of THEME_TOKENS.filter((x) => !sameInBoth.includes(x))) {
      expect(dark[`--${t}`]).toBeDefined();
    }
  });

  test("valores clave de HANDOFF", () => {
    expect(light["--bg"]).toBe("#f6f4fa");
    expect(dark["--bg"]).toBe("#14121a");
    expect(light["--accent"]).toBe("#295ac3");
    expect(dark["--accent"]).toBe("#7aa2f7");
    expect(light["--grade-ink"]).toBe("#111111");
    expect(dark["--grade-ink"]).toBeUndefined(); // no se invierte
    expect(light["--tint-ok"]).toBe("10%"); // §8: no 14 % en claro
    expect(dark["--tint-ok"]).toBe("14%");
    expect(light["--tint-1"]).toBe("12%");
    expect(dark["--tint-2"]).toBe("28%");
  });

  test("los 4 acentos, en claro y en oscuro, con los hex del handoff", () => {
    const expected = {
      rojo: ["#ee0400", "#c80300", "#ff6b5e"],
      verde: ["#115445", "#115445", "#4fc4a6"],
      morado: ["#734ad1", "#734ad1", "#a98bf0"],
    } as const;
    for (const [name, [acc, ink, darkAcc]] of Object.entries(expected)) {
      const l = vars(block(css, `[data-accent="${name}"]`));
      expect(l["--accent"]).toBe(acc);
      expect(l["--accent-ink"]).toBe(ink);
      const d = vars(block(css, `[data-theme="dark"][data-accent="${name}"]`));
      expect(d["--accent"]).toBe(darkAcc);
      expect(d["--accent-ink"]).toBe(darkAcc);
      const s = vars(
        block(media, `:root:not([data-theme="light"])[data-accent="${name}"]`),
      );
      expect(s).toEqual(d);
    }
  });

  test("'sistema' (media query) repite exactamente los valores de oscuro", () => {
    expect(system).toEqual(dark);
  });

  test("tintes derivados con color-mix", () => {
    const derived = block(css, ":root,\n[data-theme],\n[data-accent]");
    for (const t of [
      "accent-soft",
      "accent-soft-2",
      "accent-hover",
      "chip-ok-bg",
      "chip-warn-bg",
      "chip-err-bg",
      "chip-prize-bg",
      "alert-err-bg",
      "alert-warn-bg",
      "alert-ok-bg",
    ]) {
      expect(derived).toMatch(new RegExp(`--${t}:\\s*color-mix\\(\\s*in srgb`));
    }
  });

  test("movimiento, radios y z-index", () => {
    for (const t of [
      "--d-fast",
      "--d-normal",
      "--d-rank",
      "--d-celebrate",
      "--ease",
      "--bounce",
      "--r-sm",
      "--r-md",
      "--r-lg",
      "--z-toast",
      "--z-overlay",
    ]) {
      expect(css).toContain(`${t}:`);
    }
    expect(css).toContain("prefers-reduced-motion: reduce");
  });
});

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|css)$/.test(name)) out.push(p);
  }
  return out;
}

describe("cero valores mágicos", () => {
  test("no hay colores hex fuera de globals.css en app/", () => {
    const offenders = walk(join(root, "app"))
      .filter((f) => !f.endsWith("globals.css"))
      .filter((f) => /#[0-9a-fA-F]{3,8}\b/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
});
