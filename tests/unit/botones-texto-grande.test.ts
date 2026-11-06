import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

/**
 * D-A1b (QA versión 1; D227): con el texto al 200 %, «Cambiar contraseña» (/perfil) y «Guardar
 * borrador» (topbar del constructor) se salían porque `Button` no parte el texto. Solo esos dos
 * botones lo parten (opción elegida por César); el medidor y el selector numérico ceden igual.
 * `Button` sigue con `whitespace-nowrap` para todos los demás.
 */
const leer = (r: string) => readFileSync(r, "utf8");
const ENVUELVE =
  /h-auto min-h-\d+ max-w-full shrink py-\d+ text-center whitespace-normal/;

describe("botones y controles con texto grande (D227)", () => {
  test("«Cambiar contraseña» y «Guardar borrador» parten su rótulo", () => {
    expect(leer("components/sections/perfil/security-settings.tsx")).toMatch(
      ENVUELVE,
    );
    expect(leer("components/sections/tareas-profe/task-builder.tsx")).toMatch(
      ENVUELVE,
    );
  });
  test("Button conserva whitespace-nowrap para el resto", () => {
    expect(leer("components/ui/button.tsx")).toContain("whitespace-nowrap");
  });
  test("el medidor y el selector numérico ceden en vez de salirse", () => {
    expect(leer("components/krea/sum-meter.tsx")).not.toMatch(
      /"text-small-b whitespace-nowrap"/,
    );
    const stepper = leer("components/krea/number-stepper.tsx");
    expect(stepper).toContain("max-w-full flex-wrap");
    expect(stepper).toContain('"w-24 min-w-0 shrink"');
  });
});
