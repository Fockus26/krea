import { describe, expect, test } from "bun:test";
import { counterLabel, isActive, navItems, rolLabel } from "@/lib/nav";

const labels = (
  rol: "estudiante" | "profesor",
  s: "lateral" | "inferior" | "menu",
) => navItems(rol, s).map((i) => i.label);

describe("navItems (HANDOFF §2.7)", () => {
  test("lateral del estudiante: 6 ítems en orden", () => {
    expect(labels("estudiante", "lateral")).toEqual([
      "Inicio",
      "Notas",
      "Tareas",
      "Ranking",
      "Equipo",
      "Perfil",
    ]);
  });

  test("lateral del profesor: 8 ítems en orden", () => {
    expect(labels("profesor", "lateral")).toEqual([
      "Panel",
      "Evaluar",
      "Tareas",
      "Alumnos",
      "Equipos",
      "Puntos",
      "Ranking",
      "Premios",
    ]);
  });

  test("inferior: 5 columnas por rol; Tareas del estudiante no está", () => {
    expect(labels("estudiante", "inferior")).toEqual([
      "Inicio",
      "Notas",
      "Ranking",
      "Equipo",
      "Perfil",
    ]);
    expect(labels("profesor", "inferior")).toEqual([
      "Panel",
      "Evaluar",
      "Alumnos",
      "Puntos",
      "Ranking",
    ]);
  });

  test("Menú del profesor: Tareas, Equipos y Premios; el estudiante no tiene Menú", () => {
    expect(labels("profesor", "menu")).toEqual([
      "Tareas",
      "Equipos",
      "Premios",
    ]);
    expect(navItems("estudiante", "menu")).toHaveLength(0);
  });

  test("el profesor alcanza cada ítem del lateral en inferior o Menú", () => {
    const lateral = navItems("profesor", "lateral").map((i) => i.id);
    const alcanzables = [
      ...navItems("profesor", "inferior"),
      ...navItems("profesor", "menu"),
    ].map((i) => i.id);
    expect(alcanzables.sort()).toEqual([...lateral].sort());
  });

  test("href únicos dentro de cada rol", () => {
    for (const rol of ["estudiante", "profesor"] as const) {
      const hrefs = navItems(rol, "lateral").map((i) => i.href);
      expect(new Set(hrefs).size).toBe(hrefs.length);
    }
  });
});

describe("isActive", () => {
  const [inicio, notas] = navItems("estudiante", "lateral");
  const [panel, evaluar] = navItems("profesor", "lateral");

  test("la raíz del estudiante solo es activa en `/`", () => {
    expect(isActive(inicio, "/")).toBe(true);
    expect(isActive(inicio, "/notas")).toBe(false);
  });

  test("Panel es exacto: /profe/evaluar no lo activa", () => {
    expect(isActive(panel, "/profe")).toBe(true);
    expect(isActive(panel, "/profe/evaluar/abc")).toBe(false);
    expect(isActive(evaluar, "/profe/evaluar/abc")).toBe(true);
  });

  test("prefijo: /notas/x activa Notas; /notasx no", () => {
    expect(isActive(notas, "/notas")).toBe(true);
    expect(isActive(notas, "/notas/tarea-1")).toBe(true);
    expect(isActive(notas, "/notasx")).toBe(false);
  });

  test("ignora barra final, query y hash", () => {
    expect(isActive(notas, "/notas/")).toBe(true);
    expect(isActive(notas, "/notas?f=grupales")).toBe(true);
    expect(isActive(notas, "/notas#leyenda")).toBe(true);
  });

  test("sin pathname no hay activo", () => {
    expect(isActive(inicio, null)).toBe(false);
    expect(isActive(inicio, undefined)).toBe(false);
  });
});

describe("counterLabel", () => {
  test("texto accesible del contador", () => {
    expect(counterLabel(3)).toBe("3 por evaluar");
    expect(counterLabel(1)).toBe("1 por evaluar");
  });

  test("0, nulo o negativo no anuncia nada", () => {
    expect(counterLabel(0)).toBeNull();
    expect(counterLabel(null)).toBeNull();
    expect(counterLabel(-2)).toBeNull();
  });
});

describe("rolLabel", () => {
  test("etiqueta de la tarjeta de usuario", () => {
    expect(rolLabel("estudiante")).toBe("Estudiante");
    expect(rolLabel("profesor")).toBe("Profesor");
  });
});
