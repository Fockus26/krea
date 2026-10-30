import { describe, expect, test } from "bun:test";
import { cn } from "@/lib/utils";

describe("cn con las utilidades propias (D025)", () => {
  test("rol tipográfico y color de texto conviven", () => {
    expect(cn("text-display", "text-text-2")).toBe("text-display text-text-2");
    expect(cn("text-text-2", "text-button")).toBe("text-text-2 text-button");
  });

  test("un rol tipográfico reemplaza a otro", () => {
    expect(cn("text-body", "text-small")).toBe("text-small");
    expect(cn("text-button", "text-button-sm")).toBe("text-button-sm");
  });

  test("el rol gana a tamaño/peso sueltos anteriores", () => {
    expect(cn("text-sm font-medium", "text-label")).toBe("text-label");
  });

  test("dos colores de texto siguen fusionándose", () => {
    expect(cn("text-text", "text-accent-ink")).toBe("text-accent-ink");
  });

  test("sombras propias", () => {
    expect(cn("shadow-1", "shadow-3")).toBe("shadow-3");
    expect(cn("shadow-1", "shadow-none")).toBe("shadow-none");
  });

  test("z-index con nombre", () => {
    expect(cn("z-popover", "z-toast")).toBe("z-toast");
    expect(cn("z-10", "z-overlay")).toBe("z-overlay");
  });

  test("duraciones y curvas", () => {
    expect(cn("duration-fast", "duration-normal")).toBe("duration-normal");
    expect(cn("ease-krea", "ease-bounce")).toBe("ease-bounce");
  });

  test("radios propios", () => {
    expect(cn("rounded-md", "rounded-nav")).toBe("rounded-nav");
    expect(cn("rounded-pill", "rounded-lg")).toBe("rounded-lg");
  });

  test("nums, alturas y anchos de layout", () => {
    expect(cn("proportional-nums", "nums")).toBe("nums");
    expect(cn("h-10", "h-topbar")).toBe("h-topbar");
    expect(cn("w-full", "w-side")).toBe("w-side");
  });

  test("valores falsos se ignoran", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });
});
