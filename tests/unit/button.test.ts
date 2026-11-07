import { describe, expect, test } from "bun:test";
import { buttonVariants } from "@/components/ui/button";

const classes = (...args: Parameters<typeof buttonVariants>) =>
  buttonVariants(...args).split(/\s+/);

describe("buttonVariants (HANDOFF §2.1)", () => {
  test("por defecto: primary md", () => {
    const c = classes();
    expect(c).toContain("bg-accent");
    expect(c).toContain("text-on-accent");
    expect(c).toContain("shadow-btn-primary");
    expect(c).toContain("h-11");
    expect(c).toContain("px-5");
    expect(c).toContain("rounded-md");
    expect(c).toContain("text-button");
  });

  test("tamaños: 36/44/52 de alto, padding 14/20/24, radio 12/16", () => {
    const sm = classes({ size: "sm" });
    expect(sm).toEqual(
      expect.arrayContaining([
        "h-9",
        "px-3.5",
        "rounded-nav",
        "text-button-sm",
      ]),
    );
    const lg = classes({ size: "lg" });
    expect(lg).toEqual(
      expect.arrayContaining(["h-13", "px-6", "rounded-md", "text-button-lg"]),
    );
  });

  test("foco: outline 2 px de --focus con offset 2", () => {
    const c = classes();
    expect(c).toEqual(
      expect.arrayContaining([
        "focus-visible:outline-2",
        "focus-visible:outline-offset-2",
        "focus-visible:outline-focus",
      ]),
    );
  });

  test("secondary: borde interior y deshabilitado con borde --divider", () => {
    const c = classes({ variant: "secondary" });
    expect(c).toContain("shadow-btn-outline");
    expect(c).toContain("not-aria-busy:disabled:shadow-btn-outline-dis");
    expect(c).toContain("not-aria-busy:disabled:bg-transparent");
    // cn deja un solo fondo deshabilitado: el de secondary
    expect(c).not.toContain("disabled:bg-surface-3");
    expect(c).toContain("active:not-disabled:not-aria-disabled:translate-y-px");
  });

  test("primary activo baja 2 px y pierde la sombra", () => {
    const c = classes({ variant: "primary" });
    expect(c).toContain(
      "active:not-disabled:not-aria-disabled:translate-y-btn",
    );
    expect(c).toContain("active:not-disabled:not-aria-disabled:shadow-none");
  });

  test("danger usa --on-error, no --on-accent", () => {
    const c = classes({ variant: "danger" });
    expect(c).toContain("bg-error");
    expect(c).toContain("text-on-error");
    expect(c).not.toContain("text-on-accent");
    expect(c).toContain("hover:not-disabled:not-aria-disabled:brightness-92");
  });

  test("ghost-danger: texto --error y tintes rojos, nunca el acento (D297)", () => {
    const c = classes({ variant: "ghost-danger" });
    expect(c).toContain("text-error");
    expect(c).toContain("bg-transparent");
    expect(c).toContain("hover:not-disabled:not-aria-disabled:bg-alert-err");
    expect(c).toContain("active:not-disabled:not-aria-disabled:bg-chip-err");
    expect(c.some((x) => x.includes("accent"))).toBe(false);
    expect(c).toContain("not-aria-busy:disabled:bg-transparent");
    expect(c).not.toContain("disabled:bg-surface-3");
    expect(c).toEqual(
      expect.arrayContaining([
        "focus-visible:outline-2",
        "focus-visible:outline-offset-2",
        "focus-visible:outline-focus",
      ]),
    );
    expect(c).toContain("px-3");
    expect(classes({ variant: "ghost-danger", icon: true })).toContain("px-0");
  });

  test("ghost deshabilitado sin fondo", () => {
    const c = classes({ variant: "ghost" });
    expect(c).toContain("not-aria-busy:disabled:bg-transparent");
    expect(c).not.toContain("disabled:bg-surface-3");
  });

  test("ghost: padding 12 solo en md", () => {
    expect(classes({ variant: "ghost" })).toContain("px-3");
    expect(classes({ variant: "ghost" })).not.toContain("px-5");
    expect(classes({ variant: "ghost", size: "sm" })).toContain("px-3.5");
  });

  test("icon: cuadrado 44 / 36 en sm", () => {
    const md = classes({ icon: true });
    expect(md).toEqual(expect.arrayContaining(["w-11", "h-11", "px-0"]));
    expect(md).not.toContain("px-5");
    const sm = classes({ icon: true, size: "sm" });
    expect(sm).toEqual(expect.arrayContaining(["w-9", "h-9", "px-0"]));
  });

  test("sm llega a 44 × 44 por debajo de 1024 (D215)", () => {
    expect(classes({ size: "sm" })).toContain("max-lg:h-11");
    expect(classes({ icon: true, size: "sm" })).toEqual(
      expect.arrayContaining(["max-lg:h-11", "max-lg:w-11"]),
    );
  });

  test("block = ancho 100 %", () => {
    expect(classes({ block: true })).toContain("w-full");
  });

  test("deshabilitado no reacciona a hover", () => {
    const hover = classes().filter((x) => x.startsWith("hover:"));
    expect(hover.length).toBeGreaterThan(0);
    for (const h of hover)
      expect(h).toContain("not-disabled:not-aria-disabled:");
  });
});
