import { describe, expect, test } from "bun:test";
import {
  GRADE_PILL_SIZE_CLASSES,
  gradePillLabel,
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
});
