import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  indicePestana,
  tiposTransicion,
  tipoTransicion,
} from "@/lib/transicion";

// D278: la página nueva entra por el lado de su pestaña en la barra (inferior, lateral o Menú)

describe("indicePestana", () => {
  test("estudiante: orden de la lateral, subrutas incluidas", () => {
    expect(indicePestana("estudiante", "/")).toBe(0);
    expect(indicePestana("estudiante", "/notas")).toBe(1);
    expect(indicePestana("estudiante", "/notas/t1")).toBe(1);
    expect(indicePestana("estudiante", "/tareas/t1")).toBe(2);
    expect(indicePestana("estudiante", "/ranking/equipos")).toBe(3);
    expect(indicePestana("estudiante", "/equipo")).toBe(4);
    expect(indicePestana("estudiante", "/perfil")).toBe(5);
  });

  test("profesor: lateral, admin incluido, y Perfil (solo Menú) al final", () => {
    expect(indicePestana("profesor", "/profe")).toBe(0);
    expect(indicePestana("profesor", "/profe/evaluar/e1")).toBe(1);
    expect(indicePestana("profesor", "/profe/tareas/nueva")).toBe(2);
    expect(indicePestana("profesor", "/profe/alumnos?seccion=5C")).toBe(3);
    expect(indicePestana("profesor", "/profe/equipos/5a")).toBe(4);
    expect(indicePestana("profesor", "/profe/puntos")).toBe(5);
    expect(indicePestana("profesor", "/profe/ranking/5c")).toBe(6);
    expect(indicePestana("profesor", "/profe/premios")).toBe(7);
    expect(indicePestana("profesor", "/profe/profesores")).toBe(8);
    expect(indicePestana("profesor", "/profe/perfil")).toBe(9);
  });

  test("rutas que no son de ninguna pestaña → −1", () => {
    expect(indicePestana("estudiante", "/componentes")).toBe(-1);
    expect(indicePestana("profesor", "/ranking")).toBe(-1);
    expect(indicePestana("profesor", null)).toBe(-1);
  });
});

describe("tipoTransicion", () => {
  test("pestaña a la derecha → entra desde la derecha; a la izquierda → desde la izquierda", () => {
    expect(tipoTransicion("estudiante", "/", "/ranking")).toBe("desliz-der");
    expect(tipoTransicion("estudiante", "/perfil", "/notas")).toBe(
      "desliz-izq",
    );
    expect(tipoTransicion("profesor", "/profe", "/profe/puntos")).toBe(
      "desliz-der",
    );
    expect(tipoTransicion("profesor", "/profe/ranking", "/profe/evaluar")).toBe(
      "desliz-izq",
    );
  });

  test("desde un detalle cuenta la pestaña del detalle", () => {
    expect(tipoTransicion("estudiante", "/notas/t1", "/")).toBe("desliz-izq");
    expect(
      tipoTransicion("profesor", "/profe/tareas/t1", "/profe/alumnos"),
    ).toBe("desliz-der");
  });

  test("hoja Menú y admin: mismo orden que la lateral", () => {
    // Puntos (barra inferior) → Tareas (Menú): a la izquierda
    expect(tipoTransicion("profesor", "/profe/puntos", "/profe/tareas")).toBe(
      "desliz-izq",
    );
    expect(
      tipoTransicion("profesor", "/profe/premios", "/profe/profesores"),
    ).toBe("desliz-der");
    expect(
      tipoTransicion("profesor", "/profe/profesores", "/profe/perfil"),
    ).toBe("desliz-der");
  });

  test("misma pestaña o ruta ajena → sin tipo (fundido o nada)", () => {
    expect(tipoTransicion("estudiante", "/notas/t1", "/notas")).toBeNull();
    expect(tipoTransicion("estudiante", "/notas", "/notas")).toBeNull();
    expect(tipoTransicion("estudiante", "/componentes", "/notas")).toBeNull();
    expect(tipoTransicion("profesor", null, "/profe")).toBeNull();
  });

  test("tiposTransicion: lista para <Link transitionTypes> o undefined", () => {
    expect(tiposTransicion("estudiante", "/", "/perfil")).toEqual([
      "desliz-der",
    ]);
    expect(tiposTransicion("estudiante", "/perfil", "/perfil")).toBeUndefined();
  });
});

describe("CSS y templates (guardián por código)", () => {
  const raiz = join(import.meta.dir, "..", "..");
  const css = readFileSync(join(raiz, "app", "globals.css"), "utf8");
  const bloque = css.slice(css.indexOf("Transición entre páginas (pedido 40"));

  test("cada clase de transición tiene su par viejo/nuevo", () => {
    for (const c of [
      "pagina-desliz-der",
      "pagina-desliz-izq",
      "pagina-fundido",
    ]) {
      expect(bloque).toContain(`::view-transition-new(.${c})`);
      expect(bloque).toContain(`::view-transition-old(.${c})`);
    }
  });

  test("reduced motion apaga toda animación de View Transition", () => {
    expect(bloque).toMatch(
      /prefers-reduced-motion: reduce\)\s*\{\s*::view-transition-group\(\*\),\s*::view-transition-old\(\*\),\s*::view-transition-new\(\*\)\s*\{\s*(\/\*[^*]*\*\/\s*)?animation: none !important;/,
    );
  });

  test("las animaciones de página solo usan opacity y transform", () => {
    const keyframes = bloque.match(/@keyframes k-pagina-[\s\S]*?\n\}/g) ?? [];
    expect(keyframes.length).toBe(2);
    for (const k of keyframes) {
      const props = [...k.matchAll(/^\s+([a-z-]+):/gm)].map((m) => m[1]);
      for (const p of props) expect(["opacity", "transform"]).toContain(p);
    }
  });

  test("los templates de pestañas y detalles usan TransicionPagina", () => {
    const templates: [string, string][] = [
      ["app/(estudiante)/template.tsx", "pestana"],
      ["app/(profesor)/profe/template.tsx", "pestana"],
      ["app/(estudiante)/notas/template.tsx", "detalle"],
      ["app/(estudiante)/tareas/template.tsx", "detalle"],
      ["app/(profesor)/profe/tareas/template.tsx", "detalle"],
      ["app/(profesor)/profe/evaluar/template.tsx", "detalle"],
    ];
    for (const [ruta, nivel] of templates) {
      const src = readFileSync(join(raiz, ruta), "utf8");
      expect(src).toContain(`<TransicionPagina nivel="${nivel}">`);
    }
  });
});
