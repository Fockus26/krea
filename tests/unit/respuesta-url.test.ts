import { describe, expect, test } from "bun:test";
import { inicialEdicion, respuestasValidas } from "@/lib/entregas";
import { zPregunta, zRespuesta } from "@/lib/modelo";
import { respuestaParte } from "@/lib/partes";
import {
  hrefSeguro,
  mensajeErrorUrl,
  normalizarUrl,
  URL_MAX_LENGTH,
} from "@/lib/url-respuesta";

// Respuesta de enlace (D468–D470)

describe("normalizarUrl (D469)", () => {
  test("http y https valen tal cual (normalizados por URL)", () => {
    expect(normalizarUrl("https://drive.google.com/file/d/abc/view")).toEqual({
      ok: true,
      url: "https://drive.google.com/file/d/abc/view",
      conEsquema: false,
    });
    expect(normalizarUrl("http://www.canva.com/design/X")).toEqual({
      ok: true,
      url: "http://www.canva.com/design/X",
      conEsquema: false,
    });
    // Esquema y dominio en minúsculas; la ruta se respeta
    expect(normalizarUrl("HTTPS://Figma.COM/file/AbC")).toMatchObject({
      ok: true,
      url: "https://figma.com/file/AbC",
    });
  });

  test("sin esquema se le pone https:// y lo dice", () => {
    expect(normalizarUrl("drive.google.com/drive/folders/1a")).toEqual({
      ok: true,
      url: "https://drive.google.com/drive/folders/1a",
      conEsquema: true,
    });
    expect(normalizarUrl("//www.figma.com/x")).toMatchObject({
      ok: true,
      url: "https://www.figma.com/x",
    });
    // Un dominio con puerto no se confunde con un esquema
    expect(normalizarUrl("drive.google.com:443/x")).toMatchObject({
      ok: true,
      conEsquema: true,
    });
  });

  test("espacios en los extremos se recortan; dentro, no vale", () => {
    expect(normalizarUrl("   https://canva.com/a  \n")).toMatchObject({
      ok: true,
      url: "https://canva.com/a",
    });
    expect(normalizarUrl("https://canva.com/mi diseño")).toEqual({
      ok: false,
      error: "invalida",
    });
  });

  test("vacía o solo espacios", () => {
    expect(normalizarUrl("")).toEqual({ ok: false, error: "vacia" });
    expect(normalizarUrl("   ")).toEqual({ ok: false, error: "vacia" });
    expect(mensajeErrorUrl("vacia")).toBeNull();
  });

  test("otros protocolos: javascript:, data:, mailto:, ftp:", () => {
    for (const u of [
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "mailto:profe@liceo.edu.ve",
      "ftp://archivos.liceo.edu.ve/x",
      "vbscript:msgbox",
    ])
      expect(normalizarUrl(u)).toEqual({ ok: false, error: "protocolo" });
    expect(mensajeErrorUrl("protocolo")).toBe(
      "Pega un enlace que empiece por https://",
    );
  });

  test("con credenciales (usuario:clave@) no vale", () => {
    expect(normalizarUrl("https://ana:secreta@drive.google.com/x")).toEqual({
      ok: false,
      error: "credenciales",
    });
    expect(normalizarUrl("https://ana@drive.google.com/x")).toEqual({
      ok: false,
      error: "credenciales",
    });
  });

  test("sin dominio de verdad: texto suelto, sin punto", () => {
    expect(normalizarUrl("hola")).toEqual({ ok: false, error: "invalida" });
    expect(normalizarUrl("https://localhost/x")).toEqual({
      ok: false,
      error: "invalida",
    });
    expect(normalizarUrl("https://")).toEqual({ ok: false, error: "invalida" });
  });

  test(`hasta ${URL_MAX_LENGTH} caracteres; ${URL_MAX_LENGTH + 1}, no`, () => {
    const base = "https://drive.google.com/";
    const justa = base + "a".repeat(URL_MAX_LENGTH - base.length);
    expect(justa.length).toBe(URL_MAX_LENGTH);
    expect(normalizarUrl(justa)).toMatchObject({ ok: true });
    expect(normalizarUrl(`${justa}a`)).toEqual({ ok: false, error: "larga" });
  });

  test("hrefSeguro: la URL o null (nunca un javascript:)", () => {
    expect(hrefSeguro("https://canva.com/a")).toBe("https://canva.com/a");
    expect(hrefSeguro("javascript:alert(1)")).toBeNull();
    expect(hrefSeguro("https://a:b@canva.com")).toBeNull();
  });
});

describe("modelo con formato url (D468)", () => {
  test("zPregunta acepta «url» y zRespuesta `{ url }`", () => {
    expect(
      zPregunta.safeParse({
        id: "p1",
        enunciado: "Pega el enlace de tu diseño en Canva",
        formato: "url",
        valor: 4,
      }).success,
    ).toBe(true);
    expect(zRespuesta.parse({ url: "https://canva.com/a" })).toEqual({
      url: "https://canva.com/a",
    });
    expect(zRespuesta.safeParse({ url: "" }).success).toBe(false);
    expect(
      zRespuesta.safeParse({ url: "a".repeat(URL_MAX_LENGTH + 1) }).success,
    ).toBe(false);
  });
});

describe("respuestasValidas con enlace (D469)", () => {
  const preguntas = [
    { id: "p1", formato: "url" as const },
    { id: "p2", formato: "texto" as const },
  ];
  const validar = (r: Parameters<typeof respuestasValidas>[1]) =>
    respuestasValidas(preguntas, r, "t1", "c".repeat(32));

  test("se guarda normalizada (con https:// si faltaba)", () => {
    expect(
      validar({ p1: { url: "  drive.google.com/x " }, p2: { texto: "Hola" } }),
    ).toEqual({
      p1: { url: "https://drive.google.com/x" },
      p2: { texto: "Hola" },
    });
  });

  test("javascript:, credenciales o de otro formato → null (incompleta)", () => {
    expect(
      validar({ p1: { url: "javascript:alert(1)" }, p2: { texto: "a" } }),
    ).toBeNull();
    expect(
      validar({ p1: { url: "https://a:b@canva.com" }, p2: { texto: "a" } }),
    ).toBeNull();
    // Texto en una de enlace, enlace en una de texto o en una de imagen
    expect(
      validar({ p1: { texto: "https://canva.com" }, p2: { texto: "a" } }),
    ).toBeNull();
    expect(
      validar({
        p1: { url: "https://canva.com" },
        p2: { url: "https://canva.com" },
      }),
    ).toBeNull();
    expect(
      respuestasValidas(
        [{ id: "p1", formato: "imagen" }],
        { p1: { url: "https://canva.com" } },
        "t1",
        "c".repeat(32),
      ),
    ).toBeNull();
  });
});

describe("lectores con enlace", () => {
  test("inicialEdicion: el enlace tal cual en su pregunta; en otro formato, vacía", () => {
    expect(
      inicialEdicion(
        [
          { id: "p1", formato: "url" },
          { id: "p2", formato: "texto" },
        ],
        [
          { tipo: "url", url: "https://canva.com/a" },
          { tipo: "url", url: "https://canva.com/b" },
        ],
        new Map(),
      ),
    ).toEqual({ p1: "https://canva.com/a" });
  });

  test("respuestaParte: `{ url }` → tipo url (ya no se lee como imagen)", () => {
    expect(respuestaParte({ url: "https://canva.com/a" })).toEqual({
      tipo: "url",
      url: "https://canva.com/a",
    });
    expect(respuestaParte({ texto: "Hola" })).toEqual({
      tipo: "texto",
      texto: "Hola",
    });
  });
});
