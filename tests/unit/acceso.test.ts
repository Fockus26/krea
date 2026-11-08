// Quién lee qué por las rutas de sondeo (D327): lo que probaban las reglas de Firestore para las
// lecturas del navegador de `ranking/{seccion}` y `presencia/`.
import { describe, expect, test } from "bun:test";
import { accesoPresencia, accesoRanking, ESTADO_HTTP } from "@/lib/acceso";
import type { Sesion } from "@/lib/sesion";

const alumno5A: Sesion = {
  uid: "33272397",
  rol: "estudiante",
  seccion: "5A",
  equipoId: null,
};
const profe: Sesion = {
  uid: "10000000",
  rol: "profesor",
  seccion: null,
  equipoId: null,
};

describe("accesoRanking", () => {
  test("el alumno ve solo el ranking de su sección", () => {
    expect(accesoRanking(alumno5A, "5A")).toBe("ok");
    expect(accesoRanking(alumno5A, "5C")).toBe("prohibido");
  });
  test("el profe ve cualquier sección", () => {
    expect(accesoRanking(profe, "5A")).toBe("ok");
    expect(accesoRanking(profe, "3B")).toBe("ok");
  });
  test("sin sesión o con contraseña temporal: sin-sesion", () => {
    expect(accesoRanking(null, "5A")).toBe("sin-sesion");
    expect(
      accesoRanking({ ...alumno5A, debeCambiarPassword: true }, "5A"),
    ).toBe("sin-sesion");
  });
  test("un código que no es sección: prohibido, también para el profe", () => {
    expect(accesoRanking(profe, "../config")).toBe("prohibido");
    expect(accesoRanking(profe, "5a")).toBe("prohibido");
  });
});

describe("accesoPresencia (D275)", () => {
  test("solo el profe", () => {
    expect(accesoPresencia(profe)).toBe("ok");
    expect(accesoPresencia(alumno5A)).toBe("prohibido");
    expect(accesoPresencia(null)).toBe("sin-sesion");
    expect(accesoPresencia({ ...profe, debeCambiarPassword: true })).toBe(
      "sin-sesion",
    );
  });
  test("prohibido responde 404, sin sesión 401", () => {
    expect(ESTADO_HTTP.prohibido).toBe(404);
    expect(ESTADO_HTTP["sin-sesion"]).toBe(401);
  });
});
