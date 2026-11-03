import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { anchoDe, containerClass, mainClass } from "@/lib/layout";

const css = readFileSync(
  join(import.meta.dir, "..", "..", "app", "globals.css"),
  "utf8",
);

describe("containerClass", () => {
  test("estudiante y profesor usan su contenedor", () => {
    expect(containerClass("estudiante")).toBe("container-student");
    expect(containerClass("profesor")).toBe("container-teacher");
  });

  test("lectura es igual para los dos roles", () => {
    expect(containerClass("estudiante", "lectura")).toBe(
      "container-reading-start",
    );
    expect(containerClass("profesor", "lectura")).toBe(
      "container-reading-start",
    );
  });

  test("cada clase existe como utilidad en globals.css", () => {
    for (const c of [
      containerClass("estudiante"),
      containerClass("profesor"),
      containerClass("estudiante", "lectura"),
    ])
      expect(css).toContain(`@utility ${c} {`);
  });
});

describe("anchoDe (D129)", () => {
  test("lectura en Mis notas, Detalle, Tareas, Tarea y Perfil del estudiante", () => {
    for (const r of [
      "/notas",
      "/notas/identidad-de-marca",
      "/tareas",
      "/tareas/x",
      "/perfil",
      "/notas/?f=1",
    ])
      expect(anchoDe("estudiante", r)).toBe("lectura");
  });

  test("por defecto en Inicio, Equipo y Ranking; sin falsos prefijos", () => {
    for (const r of ["/", "/equipo", "/ranking", "/notasx", null])
      expect(anchoDe("estudiante", r)).toBe("default");
  });

  test("profesor: lectura solo en su Perfil", () => {
    expect(anchoDe("profesor", "/profe/perfil")).toBe("lectura");
    for (const r of ["/profe", "/profe/evaluar/a", "/profe/tareas/nueva"])
      expect(anchoDe("profesor", r)).toBe("default");
  });

  test("mainClass = contenedor + padding y ritmo de página", () => {
    expect(mainClass("profesor")).toBe(
      "container-teacher page-pad page-stack flex-1",
    );
    expect(mainClass("estudiante", "lectura")).toBe(
      "container-reading-start page-pad page-stack flex-1",
    );
  });
});

describe("layout en globals.css", () => {
  test("el smooth scroll solo existe dentro de prefers-reduced-motion: no-preference", () => {
    const i = css.indexOf("scroll-behavior: smooth");
    expect(i).toBeGreaterThan(-1);
    const before = css.slice(0, i);
    expect(
      before.lastIndexOf("@media (prefers-reduced-motion: no-preference)"),
    ).toBeGreaterThan(before.lastIndexOf("}\n\n"));
    expect(css.match(/scroll-behavior: smooth/g)?.length).toBe(1);
  });
});
