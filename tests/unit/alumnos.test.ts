import { describe, expect, test } from "bun:test";
import {
  APELLIDOS_VACIO,
  baseCambio,
  cedulaConPuntos,
  contadorTexto,
  editarLabel,
  filtrarAlumnos,
  MOTIVO_BASE_REQUERIDO,
  NOMBRES_VACIO,
  normalizar,
  resumenTexto,
  seccionOpcionTexto,
  subtituloEdicion,
  tablaLabel,
  unirNombre,
  validarEdicion,
} from "@/lib/alumnos";
import { alumnosVista } from "@/lib/demo/alumnos";

const lista = [
  { cedula: "45051954", nombres: "Juana Elena", apellidos: "Montero Córdoba" },
  {
    cedula: "45050717",
    nombres: "Juana de las Mercedes",
    apellidos: "Montero Córdoba",
  },
  {
    cedula: "45087827",
    nombres: "Fernanda Olga",
    apellidos: "Miranda Montero",
  },
  {
    cedula: "45019792",
    nombres: "Hugo Alberto",
    apellidos: "Iglesias Escobar",
  },
];

describe("normalizar", () => {
  test("sin tildes, en minúsculas y con espacios colapsados", () => {
    expect(normalizar("  MÓntero   Córdoba ")).toBe("montero cordoba");
    expect(normalizar("Alejandra")).toBe("alejandra");
  });
});

describe("filtrarAlumnos", () => {
  test("consulta vacía devuelve todo", () => {
    expect(filtrarAlumnos(lista, "")).toHaveLength(4);
    expect(filtrarAlumnos(lista, "   ")).toHaveLength(4);
  });
  test("insensible a tildes y mayúsculas", () => {
    expect(filtrarAlumnos(lista, "juana").map((a) => a.cedula)).toEqual([
      "45051954",
      "45050717",
    ]);
    expect(filtrarAlumnos(lista, "MÓN")).toHaveLength(3);
    expect(filtrarAlumnos(lista, "montero")).toHaveLength(3);
  });
  test("por nombre y por apellido", () => {
    expect(filtrarAlumnos(lista, "hugo").map((a) => a.cedula)).toEqual([
      "45019792",
    ]);
    expect(filtrarAlumnos(lista, "elena").map((a) => a.cedula)).toEqual([
      "45051954",
    ]);
    expect(filtrarAlumnos(lista, "escobar")).toHaveLength(1);
  });
  test("cédula con o sin puntos", () => {
    const conPuntos = filtrarAlumnos(lista, "45.051");
    const sinPuntos = filtrarAlumnos(lista, "45051");
    expect(conPuntos).toEqual(sinPuntos);
    expect(conPuntos.map((a) => a.cedula)).toEqual(["45051954"]);
    expect(filtrarAlumnos(lista, "45.051.954")).toHaveLength(1);
  });
  test("una consulta sin dígitos no mira la cédula", () => {
    expect(filtrarAlumnos(lista, "zzz")).toHaveLength(0);
  });
  test("con el seed: los dos Montero de 5A", () => {
    const filas = alumnosVista().filter((a) => a.seccion === "5A");
    expect(filas).toHaveLength(35);
    expect(filtrarAlumnos(filas, "mé").length).toBeGreaterThan(0);
  });
});

describe("textos", () => {
  test("contador: 0, 1, n y sin consulta", () => {
    expect(contadorTexto(5, "mé")).toBe("5 resultados para «mé»");
    expect(contadorTexto(1, "iglesias")).toBe("1 resultado para «iglesias»");
    expect(contadorTexto(0, "x")).toBe("Sin resultados para «x»");
    expect(contadorTexto(35, "", "5A")).toBe("35 estudiantes en 5A");
    expect(contadorTexto(1, "  ", "5C")).toBe("1 estudiante en 5C");
    expect(contadorTexto(5, "  mé  ")).toBe("5 resultados para «mé»");
  });
  test("segmentado, resumen y región", () => {
    expect(seccionOpcionTexto("5A", 35)).toBe("5A · 35");
    expect(resumenTexto(69, 2)).toBe("69 estudiantes · 2 secciones");
    expect(tablaLabel("5C")).toBe("Tabla de alumnos de 5C");
  });
  test("cédula con puntos, subtítulo y botón", () => {
    expect(cedulaConPuntos("45051954")).toBe("45.051.954");
    const a = {
      cedula: "45087827",
      seccion: "5A" as const,
      nombres: "Fernanda Olga",
      apellidos: "Miranda Montero",
    };
    expect(subtituloEdicion(a)).toBe(
      "Fernanda Olga Miranda Montero · C.I. 45.087.827 · 5A",
    );
    expect(editarLabel(a)).toBe("Editar a Fernanda Olga Miranda Montero");
  });
  test("unirNombre", () => {
    expect(unirNombre("Fernanda", " Olga ")).toBe("Fernanda Olga");
    expect(unirNombre("Fernanda", "")).toBe("Fernanda");
  });
});

describe("validarEdicion", () => {
  const ok = {
    baseAnterior: 20,
    baseNueva: 20,
    motivo: "",
    nombres: "Fernanda Olga",
    apellidos: "Miranda Montero",
  };
  test("base igual: sin motivo es válido", () => {
    expect(validarEdicion(ok)).toEqual({});
    expect(baseCambio(20, 20)).toBe(false);
  });
  test("base distinta: el motivo es obligatorio", () => {
    expect(validarEdicion({ ...ok, baseNueva: 15 })).toEqual({
      motivo: MOTIVO_BASE_REQUERIDO,
    });
    expect(validarEdicion({ ...ok, baseNueva: 15, motivo: "   " }).motivo).toBe(
      MOTIVO_BASE_REQUERIDO,
    );
    expect(validarEdicion({ ...ok, baseNueva: 15, motivo: "Acuerdo" })).toEqual(
      {},
    );
  });
  test("volver a la base original quita el motivo", () => {
    expect(
      validarEdicion({ ...ok, baseAnterior: 15, baseNueva: 15, motivo: "" }),
    ).toEqual({});
  });
  test("nombres y apellidos no vacíos", () => {
    const e = validarEdicion({ ...ok, nombres: "  ", apellidos: "" });
    expect(e.nombres).toBeDefined();
    expect(e.apellidos).toBeDefined();
  });
  test("base fuera de rango o del paso", () => {
    expect(validarEdicion({ ...ok, baseNueva: 9.5 }).base).toBeDefined();
    expect(validarEdicion({ ...ok, baseNueva: 20.5 }).base).toBeDefined();
    expect(validarEdicion({ ...ok, baseNueva: 15.25 }).base).toBeDefined();
    expect(validarEdicion({ ...ok, baseNueva: Number.NaN }).base).toBeDefined();
    expect(
      validarEdicion({ ...ok, baseNueva: 17.5, motivo: "x" }).base,
    ).toBeUndefined();
  });
  test("base inválida no pide además el motivo", () => {
    expect(validarEdicion({ ...ok, baseNueva: 25 }).motivo).toBeUndefined();
  });
  test("primer nombre o primer apellido en blanco con segundo lleno → error (F-M2)", () => {
    const e = validarEdicion({
      ...ok,
      nombres: "Gloria",
      apellidos: "Pérez",
      primerNombre: "   ",
      primerApellido: "",
    });
    expect(e.nombres).toBe(NOMBRES_VACIO);
    expect(e.apellidos).toBe(APELLIDOS_VACIO);
    expect(
      validarEdicion({
        ...ok,
        primerNombre: "Elisa",
        primerApellido: "Pérez",
      }),
    ).toEqual({});
  });
});

describe("busquedaVacia (D170, D323)", () => {
  test("sugiere la otra sección si allí hay coincidencias", async () => {
    const { busquedaVacia } = await import("@/lib/alumnos");
    expect(busquedaVacia("  Valentin   Guzman ", "5A", { "5C": 1 })).toEqual({
      titulo: "Nadie con «Valentin Guzman» en 5A",
      descripcion: "Revisa las tildes o busca por cédula. ¿Quizás está en 5C?",
      otra: "5C",
    });
  });
  test("sin coincidencias en la otra, no la sugiere", async () => {
    const { busquedaVacia } = await import("@/lib/alumnos");
    const v = busquedaVacia("zz", "5C", { "5A": 0 });
    expect(v.otra).toBeNull();
    expect(v.descripcion).toBe("Revisa las tildes o busca por cédula.");
  });
  test("con varias secciones, la que tiene más coincidencias", async () => {
    const { busquedaVacia } = await import("@/lib/alumnos");
    const v = busquedaVacia("adela", "5A", { "4B": 1, "5C": 3, "6A": 2 });
    expect(v.otra).toBe("5C");
  });
  test("empate: la primera por año y letra; la actual nunca", async () => {
    const { seccionSugerida } = await import("@/lib/alumnos");
    expect(seccionSugerida("5A", { "5C": 2, "4B": 2 })).toBe("4B");
    expect(seccionSugerida("5A", { "5A": 9, "5C": 1 })).toBe("5C");
    expect(seccionSugerida("5A", {})).toBeNull();
  });
});
