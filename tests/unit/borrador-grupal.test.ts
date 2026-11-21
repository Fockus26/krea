// Lógica pura del borrador compartido (D544–D548): qué se guarda, qué ve el integrante (convive
// con el reparto, D463) y con qué arranca el capitán en otro teléfono.
import { describe, expect, test } from "bun:test";
import {
  avisoBorradorTexto,
  borradorDeValor,
  borradorVista,
  huellaConBorrador,
  inicialDesdeBorrador,
  limpiarBorrador,
  mismoBorrador,
  rutasBorrador,
} from "@/lib/borrador-grupal";
import { rutaVersionPartes } from "@/lib/partes";

const UUID = "0b5c3a52-7d0e-4f53-9d0b-0f1e2d3c4b5a";
const UUID_2 = "1c6d4b63-8e1f-4a64-8e1c-1f2e3d4c5b6a";
const ruta = (uuid: string, carpeta = "c1") =>
  `entregas/t1/${carpeta}/${uuid}.jpg`;
const img = (uuid: string, carpeta = "c1") => ({
  imagenPath: ruta(uuid, carpeta),
  nombre: "foto.jpg",
  peso: 10,
});

const PREGUNTAS = [
  { id: "p1", formato: "texto" as const },
  { id: "p2", formato: "url" as const },
  { id: "p3", formato: "imagen" as const },
  { id: "p4", formato: "imagen" as const, maxImagenes: 3 },
];

describe("limpiarBorrador", () => {
  test("cada valor del formato de su pregunta; imágenes solo de esta entrega y sin repetir", () => {
    expect(
      limpiarBorrador(
        PREGUNTAS,
        {
          p1: "  texto  ",
          p2: "ejemplo.com",
          p3: [img(UUID), img(UUID_2)],
          p4: [img(UUID), img(UUID, "c1"), img(UUID_2, "otra")],
          p9: "sobra",
        },
        "t1",
        "c1",
      ),
    ).toEqual({
      p1: "  texto  ",
      p2: "ejemplo.com",
      p3: img(UUID),
      p4: [img(UUID)],
    });
    // Una imagen en una pregunta de texto, o texto en una de imagen, no se guarda
    expect(
      limpiarBorrador(PREGUNTAS, { p1: img(UUID), p3: "hola" }, "t1", "c1"),
    ).toEqual({});
  });

  test("lo que vuelve de la base y no valida se descarta; mismo borrador sin importar el orden", () => {
    expect(borradorDeValor({ p1: 3 })).toEqual({});
    expect(
      mismoBorrador({ a: "1", b: img(UUID) }, { b: img(UUID), a: "1" }),
    ).toBe(true);
    expect(mismoBorrador({ a: "1" }, { a: "2" })).toBe(false);
    expect(rutasBorrador({ a: "x", b: img(UUID), c: [img(UUID_2)] })).toEqual([
      ruta(UUID),
      ruta(UUID_2),
    ]);
  });
});

describe("borradorVista (integrante)", () => {
  const base = {
    preguntas: PREGUNTAS,
    miembros: ["cap", "ana"],
    capitanId: "cap",
    companeros: [
      { cedula: "cap", nombres: "Luis Alberto" },
      { cedula: "ana", nombres: "Ana" },
    ],
    urls: new Map([[ruta(UUID), "https://firmada/1"]]),
  };

  test("solo las preguntas del capitán; nombre sin cédula; imágenes firmadas", () => {
    const v = borradorVista({
      ...base,
      borrador: {
        respuestas: {
          p1: "Idea del capitán",
          p2: "ejemplo.com",
          p3: img(UUID),
          p4: [img(UUID_2)],
        },
        actualizadoEn: 5,
        actualizadoPor: "cap",
        version: 2,
      },
      // p4 es de Ana (vigente): lo que cuenta es lo que ella entregue (D463)
      partes: [{ preguntaId: "p4", asignado: "ana", estado: "asignada" }],
    });
    expect(v?.nombre).toBe("Luis");
    expect(JSON.stringify(v)).not.toContain('"cap"');
    expect(v?.respuestas).toEqual({
      p1: { tipo: "texto", texto: "Idea del capitán" },
      p2: { tipo: "url", url: "https://ejemplo.com/" },
      p3: {
        tipo: "imagen",
        src: "https://firmada/1",
        alt: "Respuesta de Luis a la pregunta 3",
      },
    });
  });

  test("una tomada por el capitán sí se ve; sin borrador, null; texto vacío no", () => {
    const v = borradorVista({
      ...base,
      borrador: {
        respuestas: { p1: "  ", p4: [img(UUID_2)] },
        actualizadoEn: 5,
        actualizadoPor: "ya-no-esta",
        version: 1,
      },
      partes: [{ preguntaId: "p4", asignado: "ana", estado: "tomada" }],
    });
    expect(v?.nombre).toBe("el capitán");
    expect(Object.keys(v?.respuestas ?? {})).toEqual(["p4"]);
    expect(borradorVista({ ...base, borrador: null, partes: [] })).toBeNull();
  });
});

describe("capitán en otro teléfono y sondeo", () => {
  test("inicialDesdeBorrador: textos tal cual e imágenes listas con su ruta", () => {
    const urls = new Map([[ruta(UUID), "https://firmada/1"]]);
    expect(
      inicialDesdeBorrador(
        PREGUNTAS,
        { p1: "Hola", p3: img(UUID), p4: [img(UUID_2)] },
        urls,
      ),
    ).toEqual({
      p1: "Hola",
      p3: {
        status: "lista",
        file: { name: "foto.jpg", size: 10, src: "https://firmada/1" },
        path: ruta(UUID),
      },
      p4: [
        {
          status: "lista",
          file: { name: "foto.jpg", size: 10, src: "" },
          path: ruta(UUID_2),
        },
      ],
    });
  });

  test("huella con la versión del borrador y la ruta del integrante", () => {
    expect(huellaConBorrador("2.5.0", null)).toBe("2.5.0.b0");
    expect(huellaConBorrador("2.5.0", 4)).toBe("2.5.0.b4");
    expect(rutaVersionPartes("t1", "x", true)).toBe(
      "/api/partes/version?tarea=t1&desde=x&borrador=1",
    );
    expect(avisoBorradorTexto("Luis", 0, 3 * 60_000)).toBe(
      "Borrador de Luis · guardado hace 3 min",
    );
  });
});
