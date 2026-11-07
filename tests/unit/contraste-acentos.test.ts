import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { contraste } from "@/lib/grades";
import {
  ACENTOS,
  auditar,
  MIN_TEXTO,
  tokens,
  tokensSistema,
} from "../../scripts/qa/contraste-acentos";

/**
 * Guardián de la auditoría `scripts/qa/contraste-acentos.ts` (D301–D303): cada par texto/fondo de
 * botones, chips y podio, en los 4 acentos × claro/oscuro, alcanza su umbral.
 */
describe("auditoría de contraste por acento", () => {
  const filas = auditar();

  test("cubre 4 acentos × 2 temas", () => {
    const combos = new Set(filas.map((f) => `${f.tema}/${f.acento}`));
    expect(combos.size).toBe(8);
    for (const g of ["botón primario", "chip acc", "podio", "podio destello"])
      expect(filas.some((f) => f.grupo === g)).toBe(true);
  });

  for (const f of auditar()) {
    test(`${f.tema} · ${f.acento} · ${f.grupo} · ${f.par} ≥ ${f.min}:1`, () => {
      expect(f.ratio).toBeGreaterThanOrEqual(f.min);
    });
  }
});

describe("texto del botón de acento lleno (D301)", () => {
  test("en oscuro el texto es blanco en los 4 acentos y llega a 4,5:1 (reposo, hover, activo)", () => {
    for (const a of ACENTOS) {
      const t = tokens("oscuro", a);
      expect(t["--on-accent"].toLowerCase()).toBe("#ffffff");
      expect(contraste(t["--on-accent"], t["--accent"])).toBeGreaterThanOrEqual(
        MIN_TEXTO,
      );
    }
  });

  test("el relleno oscurecido sigue siendo un gráfico visible (≥ 3:1) sobre --bg y --surface", () => {
    for (const a of ACENTOS) {
      const t = tokens("oscuro", a);
      expect(contraste(t["--accent"], t["--bg"])).toBeGreaterThanOrEqual(3);
      expect(contraste(t["--accent"], t["--surface"])).toBeGreaterThanOrEqual(
        3,
      );
    }
  });

  test("el texto de acento (--accent-ink) en oscuro conserva el tono claro", () => {
    for (const a of ACENTOS) {
      const t = tokens("oscuro", a);
      expect(contraste(t["--accent-ink"], t["--bg"])).toBeGreaterThanOrEqual(
        MIN_TEXTO,
      );
    }
  });

  test("el tema del sistema repite el oscuro (acento, texto, hover)", () => {
    for (const a of ACENTOS) {
      const s = tokensSistema(a);
      const d = tokens("oscuro", a);
      for (const k of ["--accent", "--accent-ink"]) expect(s[k]).toBe(d[k]);
      expect(s["--on-accent"]).toBe(d["--on-accent"]);
      expect(s["--hover-mix"]).toBe(d["--hover-mix"]);
    }
  });
});

describe("podio en claro (D303)", () => {
  const css = readFileSync(
    join(import.meta.dir, "..", "..", "app", "globals.css"),
    "utf8",
  );
  const podio = readFileSync(
    join(import.meta.dir, "..", "..", "components", "krea", "podium.tsx"),
    "utf8",
  );

  test("el destello va detrás del número, no encima", () => {
    const i = css.indexOf("@utility brillo-podio");
    const bloque = css.slice(i, css.indexOf("@utility animate-balanceo"));
    expect(bloque).toContain("isolation: isolate");
    expect(bloque).toContain("z-index: -1");
  });

  test("el escalón del 1.º usa la sombra suave, no el destello claro", () => {
    expect(podio).toContain("[--brillo-tinta:var(--brillo-1-tinta)]");
    expect(podio).toContain("[--brillo-mezcla:var(--brillo-1-mezcla)]");
  });
});
