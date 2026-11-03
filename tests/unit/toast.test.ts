import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { alturaMayor } from "@/lib/toast";

const raiz = join(import.meta.dir, "..", "..");
const css = readFileSync(join(raiz, "app", "globals.css"), "utf8");
const sonner = readFileSync(
  join(raiz, "components", "ui", "sonner.tsx"),
  "utf8",
);

describe("alturaMayor (D131)", () => {
  test("la barra más alta, redondeada hacia arriba", () => {
    expect(alturaMayor([68, 96.4])).toBe(97);
    expect(alturaMayor(new Map([["a", 72]]).values())).toBe(72);
  });

  test("sin barras visibles (vacío, 0 o no finito) = null", () => {
    expect(alturaMayor([])).toBeNull();
    expect(alturaMayor([0, 0])).toBeNull();
    expect(alturaMayor([Number.NaN])).toBeNull();
  });
});

describe("toast sobre las barras (< lg)", () => {
  test("el offset suma barra inferior y barra de acción", () => {
    expect(sonner).toContain(
      "[--toast-bottom:calc(var(--toast-bnav)_+_var(--toast-action)_+_1rem_+_env(safe-area-inset-bottom))]",
    );
    expect(sonner).toContain("lg:[--toast-bottom:1.5rem]");
  });

  test("globals.css: sin barra inferior no cuenta; con ActionBar, su alto medido", () => {
    expect(css).toContain("--toast-bnav: var(--h-bnav);");
    expect(css).toMatch(
      /html:has\(\[data-sin-barra-inferior\]\) \{\s*--toast-bnav: 0px;/,
    );
    expect(css).toMatch(
      /html:has\(\[data-slot="action-bar"\]\) \{\s*--toast-action: var\(--h-action-bar, var\(--h-review-action\)\);/,
    );
  });
});
