// Comentarios de Evaluar (D445, D446, D448): insertar un emoji sin pasar del máximo, la rejilla
// fija y el texto de «Copiar comentarios».
import { describe, expect, test } from "bun:test";
import {
  comentariosParaCopiar,
  EMOJIS_AULA,
  insertarEnCursor,
} from "@/lib/comentarios";
import { COMMENT_MAX_LENGTH } from "@/lib/question";

describe("insertarEnCursor", () => {
  test("en el cursor, y el cursor queda tras el emoji", () => {
    expect(insertarEnCursor("Bien hecho", "👏", 4, 4, 300)).toEqual({
      texto: "Bien👏 hecho",
      cursor: 6,
    });
    expect(insertarEnCursor("", "🎉", 0, 0, 300)).toEqual({
      texto: "🎉",
      cursor: 2,
    });
  });

  test("reemplaza la selección", () => {
    expect(insertarEnCursor("Muy mal", "👍", 4, 7, 300)).toEqual({
      texto: "Muy 👍",
      cursor: 6,
    });
  });

  test("posiciones fuera de rango se acotan al texto", () => {
    expect(insertarEnCursor("Hola", "⭐", 99, 120, 300)?.texto).toBe("Hola⭐");
    expect(insertarEnCursor("Hola", "⭐", -3, -1, 300)?.texto).toBe("⭐Hola");
  });

  test("si no cabe en el máximo, no inserta (un emoji cuenta 2)", () => {
    const casi = "a".repeat(COMMENT_MAX_LENGTH - 1);
    expect(insertarEnCursor(casi, "👏", 0, 0, COMMENT_MAX_LENGTH)).toBeNull();
    expect(insertarEnCursor(casi, "⭐", 0, 0, COMMENT_MAX_LENGTH)?.texto).toBe(
      `⭐${casi}`,
    );
    // Reemplazando una selección sí cabe
    expect(
      insertarEnCursor(casi, "👏", 0, 1, COMMENT_MAX_LENGTH)?.texto.length,
    ).toBe(COMMENT_MAX_LENGTH);
  });
});

test("la rejilla: 24 emojis distintos, cada uno con nombre en español", () => {
  expect(EMOJIS_AULA).toHaveLength(24);
  expect(new Set(EMOJIS_AULA.map((e) => e.emoji)).size).toBe(24);
  for (const e of EMOJIS_AULA)
    expect(e.nombre.trim().length).toBeGreaterThan(0);
});

test("copiar comentarios: por pregunta con texto y el general al final", () => {
  expect(
    comentariosParaCopiar(["  Bien ", "", undefined, "Ojo"], " Sigue así "),
  ).toBe("Pregunta 1: Bien\nPregunta 4: Ojo\nComentario general: Sigue así");
  expect(comentariosParaCopiar(["", " "])).toBe("");
  expect(comentariosParaCopiar([], "Solo general")).toBe(
    "Comentario general: Solo general",
  );
});
