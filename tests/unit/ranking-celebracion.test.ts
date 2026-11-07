import { describe, expect, test } from "bun:test";
import {
  CONFETI_COLORES,
  CONFETI_PIEZAS,
  claveConfeti,
  debeCelebrar,
  MARCA_CONFETI,
  piezasConfeti,
} from "@/lib/ranking-celebracion";

describe("confeti una vez por sesión (D258)", () => {
  test("una clave por vista", () => {
    expect(claveConfeti("estudiantes")).not.toBe(claveConfeti("equipos"));
  });

  test("sin marca → celebra; con marca → no", () => {
    expect(debeCelebrar(null)).toBe(true);
    expect(debeCelebrar("")).toBe(true);
    expect(debeCelebrar(MARCA_CONFETI)).toBe(false);
  });
});

describe("piezasConfeti", () => {
  test("son 30, determinísticas y dentro del ancho", () => {
    const a = piezasConfeti();
    expect(a.length).toBe(CONFETI_PIEZAS);
    expect(piezasConfeti()).toEqual(a);
    for (const p of a) {
      expect(p.izq).toBeGreaterThanOrEqual(0);
      expect(p.izq).toBeLessThanOrEqual(100);
      expect(p.retardo).toBeLessThan(600);
    }
  });

  test("solo colores del acento (variables), nunca hex", () => {
    for (const p of piezasConfeti()) {
      expect(CONFETI_COLORES).toContain(p.color);
      expect(p.color.startsWith("var(--")).toBe(true);
    }
  });
});
