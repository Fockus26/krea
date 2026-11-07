import { describe, expect, test } from "bun:test";
import {
  archivoDeEntrada,
  arrastreLlevaArchivos,
  destinoDelPegado,
} from "@/lib/image-entrada";

const archivo = (name: string, type: string) => new File(["x"], name, { type });

describe("archivoDeEntrada", () => {
  test("toma el archivo de files (soltar o explorador)", () => {
    const png = archivo("a.png", "image/png");
    expect(archivoDeEntrada({ files: [png] })).toBe(png);
  });

  test("toma el archivo de items (pegar captura)", () => {
    const png = archivo("captura.png", "image/png");
    const data = {
      files: [],
      items: [
        { kind: "string", type: "text/plain", getAsFile: () => null },
        { kind: "file", type: "image/png", getAsFile: () => png },
      ],
    };
    expect(archivoDeEntrada(data)).toBe(png);
  });

  test("prefiere la primera imagen JPG/PNG sobre otros archivos", () => {
    const pdf = archivo("a.pdf", "application/pdf");
    const jpg = archivo("b.jpg", "image/jpeg");
    expect(archivoDeEntrada({ files: [pdf, jpg] })).toBe(jpg);
  });

  test("si ninguno es imagen devuelve el primero para que validateImage avise", () => {
    const pdf = archivo("a.pdf", "application/pdf");
    expect(archivoDeEntrada({ files: [pdf] })).toBe(pdf);
  });

  test("texto pegado o nada: null", () => {
    expect(archivoDeEntrada(null)).toBeNull();
    expect(archivoDeEntrada({ files: [] })).toBeNull();
    expect(
      archivoDeEntrada({
        items: [{ kind: "string", type: "text/plain", getAsFile: () => null }],
      }),
    ).toBeNull();
  });
});

describe("arrastreLlevaArchivos", () => {
  test("solo con el tipo Files", () => {
    expect(arrastreLlevaArchivos({ types: ["Files"] })).toBe(true);
    expect(arrastreLlevaArchivos({ types: ["text/plain"] })).toBe(false);
    expect(arrastreLlevaArchivos(null)).toBe(false);
  });
});

describe("destinoDelPegado", () => {
  test("una sola zona vacía fuera de un campo de texto", () => {
    expect(destinoDelPegado(1, false)).toBe("unica");
  });
  test("varias zonas o ninguna: solo con foco", () => {
    expect(destinoDelPegado(2, false)).toBe("ninguno");
    expect(destinoDelPegado(0, false)).toBe("ninguno");
  });
  test("en un campo de texto no se roba el pegado", () => {
    expect(destinoDelPegado(1, true)).toBe("ninguno");
  });
});
