import { describe, expect, test } from "bun:test";
import {
  controlClasses,
  controlState,
  isInvalid,
} from "@/components/ui/control";

const classes = (...a: Parameters<typeof controlClasses>) =>
  controlClasses(...a).split(/\s+/);

describe("controlState", () => {
  test("bloqueado gana sobre error y éxito", () => {
    expect(controlState({ invalid: true, success: true, locked: true })).toBe(
      "locked",
    );
  });
  test("error gana sobre éxito", () => {
    expect(controlState({ invalid: true, success: true })).toBe("error");
  });
  test("sin banderas es reposo", () => {
    expect(controlState({})).toBe("idle");
  });
});

describe("isInvalid", () => {
  test("solo false/'false'/ausente son válidos", () => {
    expect(isInvalid(undefined)).toBe(false);
    expect(isInvalid(false)).toBe(false);
    expect(isInvalid("false")).toBe(false);
    expect(isInvalid(true)).toBe(true);
    expect(isInvalid("true")).toBe(true);
    expect(isInvalid("grammar")).toBe(true);
  });
});

describe("controlClasses (HANDOFF §2.2)", () => {
  test("caja de 48 con radio 10 y borde 1", () => {
    const c = classes("idle", "within");
    expect(c).toContain("h-12");
    expect(c).toContain("rounded-sm");
    expect(c).toContain("border");
    expect(c).toContain("border-input");
  });
  test("error: borde 2 --error y padding 13", () => {
    const c = classes("error", "within");
    expect(c).toContain("border-2");
    expect(c).toContain("border-error");
    expect(c).toContain("px-3.25");
    expect(c).not.toContain("px-3.5");
  });
  test("bloqueado: fondo --surface-2 y borde punteado", () => {
    const c = classes("locked", "within");
    expect(c).toContain("border-dashed");
    expect(c).toContain("bg-surface-2");
    expect(c).not.toContain("bg-surface");
  });
  test("foco: borde --accent-ink + halo del acento, sin outline global", () => {
    const c = classes("idle", "visible");
    expect(c).toContain("focus-visible:border-accent-ink");
    expect(c).toContain("focus-visible:ring-accent/28");
    expect(c).toContain("outline-none");
  });
  test("className del llamador gana", () => {
    expect(classes("idle", "within", "h-auto")).toContain("h-auto");
    expect(classes("idle", "within", "h-auto")).not.toContain("h-12");
  });
});
