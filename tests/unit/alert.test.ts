import { describe, expect, test } from "bun:test";
import { ALERT_VARIANTS, alertRole } from "@/lib/alert";

describe("alertRole (HANDOFF §2.14)", () => {
  test("err es alert (asertivo)", () => {
    expect(alertRole("err")).toBe("alert");
  });

  test("info, ok y warn son status", () => {
    for (const v of ["info", "ok", "warn"] as const) {
      expect(alertRole(v)).toBe("status");
    }
  });

  test("cubre las cuatro variantes", () => {
    expect([...ALERT_VARIANTS]).toEqual(["info", "ok", "warn", "err"]);
  });
});
