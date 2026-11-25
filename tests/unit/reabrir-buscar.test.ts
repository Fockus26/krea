// Buscador de «Reabrir tarea › Para algunos» (D582): filtra por nombre sin tildes ni mayúsculas y
// dice cuántos se ven.
import { describe, expect, test } from "bun:test";
import {
  BUSCAR_TITULAR,
  filtrarTitulares,
  resultadosBusquedaTexto,
} from "@/lib/reabrir-tarea";

const titulares = [
  { id: "1", nombre: "María José Pérez" },
  { id: "2", nombre: "José Gregorio Hernández" },
  { id: "3", nombre: "Ana Lucía Gómez" },
];

describe("filtrarTitulares", () => {
  test("sin consulta (o solo espacios), todos", () => {
    expect(filtrarTitulares(titulares, "")).toHaveLength(3);
    expect(filtrarTitulares(titulares, "   ")).toHaveLength(3);
  });
  test("sin importar tildes, mayúsculas ni espacios de más", () => {
    expect(filtrarTitulares(titulares, "JOSE").map((t) => t.id)).toEqual([
      "1",
      "2",
    ]);
    expect(
      filtrarTitulares(titulares, "  lucia  gomez ").map((t) => t.id),
    ).toEqual(["3"]);
    expect(filtrarTitulares(titulares, "pérez").map((t) => t.id)).toEqual([
      "1",
    ]);
  });
  test("sin coincidencias, vacío", () => {
    expect(filtrarTitulares(titulares, "zzz")).toEqual([]);
  });
});

describe("resultadosBusquedaTexto", () => {
  test("vacío sin consulta; si no, cuántos o que nadie coincide", () => {
    expect(resultadosBusquedaTexto(3, 3, " ")).toBe("");
    expect(resultadosBusquedaTexto(2, 28, "jose")).toBe("Mostrando 2 de 28");
    expect(resultadosBusquedaTexto(0, 28, " zzz ")).toBe(
      "Nadie coincide con «zzz»",
    );
  });
  test("el campo nombra lo que busca", () => {
    expect(BUSCAR_TITULAR("individual")).toBe("Buscar alumno");
    expect(BUSCAR_TITULAR("grupal")).toBe("Buscar equipo");
  });
});
