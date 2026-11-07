import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { cn, TEXT_ROLES } from "@/lib/utils";

// Todo `@utility text-<x>` de globals.css que fija tamaño de letra es un rol tipográfico:
// si falta en TEXT_ROLES, `cn` lo toma por color y borra el color de texto de al lado (D306).
const css = readFileSync("app/globals.css", "utf8");
const rolesEnCss = [
  ...css.matchAll(/^@utility text-([a-z0-9-]+) \{([\s\S]*?)^\}/gm),
]
  .filter(([, , cuerpo]) => /font-size:/.test(cuerpo))
  .map(([, nombre]) => nombre);

describe("roles tipográficos de globals.css en cn (D306)", () => {
  test("hay roles que comprobar", () => {
    expect(rolesEnCss.length).toBeGreaterThan(10);
  });

  test.each(rolesEnCss)("text-%s está en TEXT_ROLES", (rol) => {
    expect(TEXT_ROLES as readonly string[]).toContain(rol);
  });

  test("el número del podio conserva su color", () => {
    expect(
      cn("brillo-podio", "bg-accent text-on-accent text-pod-step-1"),
    ).toContain("text-on-accent");
    expect(cn("bg-accent-soft-2 text-accent-ink text-pod-step")).toContain(
      "text-accent-ink",
    );
  });
});
