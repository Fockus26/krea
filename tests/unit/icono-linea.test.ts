import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

/**
 * D304: ícono + texto que puede partirse usan `icono-linea` (contenedor `items-start` y el ícono
 * en una caja de al menos 1lh): centrado con una línea y arriba con varias. Esta prueba fija la
 * utilidad y las piezas que la llevan, y que ya no queden los márgenes sueltos que la imitaban.
 */
const leer = (ruta: string) => readFileSync(ruta, "utf8");

describe("icono-linea (D304)", () => {
  const css = leer("app/globals.css");

  test("la utilidad alinea arriba y da al ícono la altura de una línea", () => {
    const bloque = css.slice(css.indexOf("@utility icono-linea {"));
    expect(bloque).toContain("align-items: flex-start");
    expect(bloque).toContain("min-height: 1lh");
  });

  test("la caja para íconos envueltos mide una línea", () => {
    const bloque = css.slice(css.indexOf("@utility icono-linea-caja"));
    expect(bloque).toContain("min-height: 1lh");
    expect(bloque).toContain("align-items: center");
  });

  const PIEZAS = [
    "components/ui/alert.tsx",
    "components/ui/badge.tsx",
    "components/ui/button.tsx",
    "components/ui/field.tsx",
    "components/ui/sonner.tsx",
    "components/ui/dropdown-menu.tsx",
    "components/ui/table.tsx",
    "components/estados/offline-banner.tsx",
    "components/estados/pantallas.tsx",
    "components/krea/question-card-answer.tsx",
    // El comentario del profe (antes dentro de question-card-detail, D445)
    "components/krea/comentario-profe.tsx",
    "components/sections/inicio/pending-tasks.tsx",
    "components/sections/tareas/delivered-tasks.tsx",
    "components/sections/tareas/task-header.tsx",
    "components/sections/notas/grade-summary.tsx",
    "components/sections/profe-panel/panel-metrics.tsx",
    "components/sections/auth/recover-sent.tsx",
    "components/sections/shared/back-link.tsx",
  ];

  for (const ruta of PIEZAS) {
    test(`${ruta} usa icono-linea`, () => {
      expect(leer(ruta)).toContain("icono-linea");
    });
  }

  test("el Alert ya no empuja el ícono con un margen suelto", () => {
    expect(leer("components/ui/alert.tsx")).not.toContain("mt-px");
  });

  test("un chip puede partirse sin que su ícono se descentre", () => {
    const badge = leer("components/ui/badge.tsx");
    expect(badge).toContain("py-[calc((--spacing(7)-1lh)/2)]");
    expect(badge).not.toContain("inline-flex h-7 w-fit shrink-0 items-center");
  });
});
