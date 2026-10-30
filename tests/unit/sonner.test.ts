import { describe, expect, test } from "bun:test";
import { TOAST_DURATION, toastClassNames } from "@/components/ui/sonner";

const classes = (s: string) => s.split(/\s+/);

describe("Toaster (HANDOFF §2.14 y §6)", () => {
  test("dura 4 s", () => {
    expect(TOAST_DURATION).toBe(4000);
  });

  test("medidas del toast: mín. 52, padding 12 16, radio 16, máx. 420, --shadow-3", () => {
    expect(classes(toastClassNames.toast)).toEqual(
      expect.arrayContaining([
        "min-h-13",
        "px-4",
        "py-3",
        "rounded-md",
        "max-w-105",
        "shadow-3",
        "bg-toast-bg",
        "text-toast-text",
      ]),
    );
  });

  test("movimiento con los tokens: entra 250 desde 16 px, sale solo con opacidad 150", () => {
    const c = classes(toastClassNames.toast);
    expect(c).toContain("duration-normal!");
    expect(c).toContain("not-data-[mounted=true]:[--y:translateY(1rem)]!");
    expect(c).toContain("data-[removed=true]:duration-fast!");
    expect(c).toContain(
      "data-[removed=true]:data-[front=true]:[--y:translateY(0)]!",
    );
  });

  test("sin valores mágicos en px ni hex", () => {
    for (const value of Object.values(toastClassNames)) {
      expect(value).not.toMatch(/\[[0-9.]+px\]|#[0-9a-fA-F]{3,8}/);
    }
  });
});
