import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GradePill } from "@/components/krea/grade-pill";
import {
  GRADE_PILL_PENDING_CLASSES,
  GRADE_PILL_SIZE_CLASSES,
  gradePillLabel,
  gradePillRaspado,
  gradePillState,
  showsBase,
} from "@/lib/grade-pill";

describe("gradePillState (D003, §2.3)", () => {
  test("null es Pendiente, nunca 0", () => {
    expect(gradePillState(null)).toBe("pendiente");
  });

  test("menor de 10 es Raspado; 10 ya no", () => {
    expect(gradePillState(4)).toBe("raspado");
    expect(gradePillState(9.5)).toBe("raspado");
    expect(gradePillState(10)).toBe("normal");
    expect(gradePillState(20)).toBe("normal");
  });
});

describe("gradePillLabel", () => {
  test("usa coma decimal", () => {
    expect(gradePillLabel(18.5)).toBe("Nota 18,5 de 20");
    expect(gradePillLabel(20)).toBe("Nota 20 de 20");
  });

  test("Pendiente no inventa un número", () => {
    expect(gradePillLabel(null)).toBe("Nota pendiente");
  });
});

describe("showsBase (D006)", () => {
  test("solo cuando la base no es 20", () => {
    expect(showsBase(undefined)).toBe(false);
    expect(showsBase(20)).toBe(false);
    expect(showsBase(15)).toBe(true);
    expect(showsBase(10)).toBe(true);
  });
});

describe("GRADE_PILL_SIZE_CLASSES (krea.css:249-257)", () => {
  test("alto y ancho mínimo por tamaño", () => {
    expect(GRADE_PILL_SIZE_CLASSES.sm).toContain("h-6.5");
    expect(GRADE_PILL_SIZE_CLASSES.sm).toContain("min-w-11");
    expect(GRADE_PILL_SIZE_CLASSES.md).toContain("h-8");
    expect(GRADE_PILL_SIZE_CLASSES.md).toContain("min-w-13");
    expect(GRADE_PILL_SIZE_CLASSES.lg).toContain("h-11");
    expect(GRADE_PILL_SIZE_CLASSES.lg).toContain("min-w-18");
  });

  test("xl: 104 de alto (120 desde 768) y ancho mínimo 148", () => {
    expect(GRADE_PILL_SIZE_CLASSES.xl).toContain("h-26");
    expect(GRADE_PILL_SIZE_CLASSES.xl).toContain("md:h-30");
    expect(GRADE_PILL_SIZE_CLASSES.xl).toContain("min-w-37");
  });

  test("total: 88 × 64 con número de 32 (§3 Evaluar entrega, D102)", () => {
    expect(GRADE_PILL_SIZE_CLASSES.total).toContain("h-16");
    expect(GRADE_PILL_SIZE_CLASSES.total).toContain("min-w-22");
    expect(GRADE_PILL_SIZE_CLASSES.total).toContain("text-grade-total");
    expect(GRADE_PILL_PENDING_CLASSES.total).toContain("h-16");
    expect(GRADE_PILL_PENDING_CLASSES.total).not.toContain("min-w");
  });
});

describe("aviso de Raspado (D040, D102)", () => {
  test("sin `raspado`, `table` decide como antes", () => {
    expect(gradePillRaspado(undefined, false)).toBe("chip");
    expect(gradePillRaspado(undefined, true)).toBe("icono");
  });

  test("`raspado` explícito gana a `table`", () => {
    expect(gradePillRaspado("ninguno", true)).toBe("ninguno");
    expect(gradePillRaspado("chip", true)).toBe("chip");
  });

  const html = (props: Parameters<typeof GradePill>[0]) =>
    renderToStaticMarkup(createElement(GradePill, props));

  test("chip por defecto, ícono en tabla, nada con `ninguno`", () => {
    expect(html({ nota: 9 })).toContain("Raspado");
    expect(html({ nota: 9, table: true })).toContain('aria-label="Raspada"');
    const nada = html({ nota: 9, raspado: "ninguno" });
    expect(nada).not.toContain("Raspad");
    // El número sigue ahí: la píldora nunca va sin número (D004)
    expect(nada).toContain(">9</span>");
  });

  test("`ninguno` no toca Pendiente ni el chip Base", () => {
    expect(html({ nota: null, raspado: "ninguno" })).toContain("Pendiente");
    expect(html({ nota: 8, base: 15, raspado: "ninguno" })).toContain(
      "Base 15",
    );
  });
});
