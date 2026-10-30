import { describe, expect, test } from "bun:test";
import { comparaFecha, diasEntre, formatFecha } from "@/lib/fecha";

describe("formatFecha", () => {
  test("día ISO → dd/mm/aaaa", () => {
    expect(formatFecha("2026-10-30")).toBe("30/10/2026");
    expect(formatFecha("2026-01-05")).toBe("05/01/2026");
  });
  test("rechaza fechas que no existen o con otro formato", () => {
    expect(() => formatFecha("2026-02-30")).toThrow(RangeError);
    expect(() => formatFecha("30/10/2026")).toThrow(RangeError);
    expect(() => formatFecha("2026-10-30T10:00")).toThrow(RangeError);
  });
});

describe("diasEntre y comparaFecha", () => {
  test("cuenta días civiles, negativo si ya pasó", () => {
    expect(diasEntre("2026-10-30", "2026-11-03")).toBe(4);
    expect(diasEntre("2026-11-03", "2026-10-30")).toBe(-4);
    expect(diasEntre("2026-12-31", "2027-01-01")).toBe(1);
  });
  test("ordena ascendente", () => {
    const dias = ["2026-11-07", "2026-10-10", "2026-11-03"];
    expect([...dias].sort(comparaFecha)).toEqual([
      "2026-10-10",
      "2026-11-03",
      "2026-11-07",
    ]);
  });
});
