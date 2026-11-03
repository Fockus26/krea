import { describe, expect, test } from "bun:test";
import {
  baseCambio,
  cedulaConPuntos,
  contadorTexto,
  editarLabel,
  filtrarAlumnos,
  MOTIVO_BASE_REQUERIDO,
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
  { cedula: "34099118", nombres: "María Gabriela", apellidos: "Méndez Chacón" },
  {
    cedula: "34098906",
    nombres: "María de los Ángeles",
    apellidos: "Méndez Chacón",
  },
  {
    cedula: "37575127",
    nombres: "Jailyn Verónica",
    apellidos: "Martínez Méndez",
  },
  {
    cedula: "33456636",
    nombres: "Gabriel Alejandro",
    apellidos: "Gil Corredor",
  },
];

describe("normalizar", () => {
  test("sin tildes, en minúsculas y con espacios colapsados", () => {
    expect(normalizar("  MÉndez   Chacón ")).toBe("mendez chacon");
    expect(normalizar("Ángeles")).toBe("angeles");
  });
});

describe("filtrarAlumnos", () => {
  test("consulta vacía devuelve todo", () => {
    expect(filtrarAlumnos(lista, "")).toHaveLength(4);
    expect(filtrarAlumnos(lista, "   ")).toHaveLength(4);
  });
  test("insensible a tildes y mayúsculas", () => {
    expect(filtrarAlumnos(lista, "maria").map((a) => a.cedula)).toEqual([
      "34099118",
      "34098906",
    ]);
    expect(filtrarAlumnos(lista, "MÉ")).toHaveLength(3);
    expect(filtrarAlumnos(lista, "mendez")).toHaveLength(3);
  });
  test("por nombre y por apellido", () => {
    expect(filtrarAlumnos(lista, "gabriel").map((a) => a.cedula)).toEqual([
      "34099118",
      "33456636",
    ]);
    expect(filtrarAlumnos(lista, "corredor")).toHaveLength(1);
  });
  test("cédula con o sin puntos", () => {
    const conPuntos = filtrarAlumnos(lista, "34.099");
    const sinPuntos = filtrarAlumnos(lista, "34099");
    expect(conPuntos).toEqual(sinPuntos);
    expect(conPuntos.map((a) => a.cedula)).toEqual(["34099118"]);
    expect(filtrarAlumnos(lista, "34.099.118")).toHaveLength(1);
  });
  test("una consulta sin dígitos no mira la cédula", () => {
    expect(filtrarAlumnos(lista, "zzz")).toHaveLength(0);
  });
  test("con el seed: los dos Méndez de 5A", () => {
    const filas = alumnosVista().filter((a) => a.seccion === "5A");
    expect(filas).toHaveLength(35);
    expect(filtrarAlumnos(filas, "mé").length).toBeGreaterThan(0);
  });
});

describe("textos", () => {
  test("contador: 0, 1, n y sin consulta", () => {
    expect(contadorTexto(5, "mé")).toBe("5 resultados para «mé»");
    expect(contadorTexto(1, "gil")).toBe("1 resultado para «gil»");
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
    expect(cedulaConPuntos("34099118")).toBe("34.099.118");
    const a = {
      cedula: "37575127",
      seccion: "5A" as const,
      nombres: "Jailyn Verónica",
      apellidos: "Martínez Méndez",
    };
    expect(subtituloEdicion(a)).toBe(
      "Jailyn Verónica Martínez Méndez · C.I. 37.575.127 · 5A",
    );
    expect(editarLabel(a)).toBe("Editar a Jailyn Verónica Martínez Méndez");
  });
  test("unirNombre", () => {
    expect(unirNombre("Jailyn", " Verónica ")).toBe("Jailyn Verónica");
    expect(unirNombre("Jailyn", "")).toBe("Jailyn");
  });
});

describe("validarEdicion", () => {
  const ok = {
    baseAnterior: 20,
    baseNueva: 20,
    motivo: "",
    nombres: "Jailyn Verónica",
    apellidos: "Martínez Méndez",
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
});

describe("busquedaVacia (D170)", () => {
  test("sugiere la otra sección si allí hay coincidencias", async () => {
    const { busquedaVacia } = await import("@/lib/alumnos");
    expect(busquedaVacia("  Valentin   Gamez ", "5A", 1)).toEqual({
      titulo: "Nadie con «Valentin Gamez» en 5A",
      descripcion: "Revisa las tildes o busca por cédula. ¿Quizás está en 5C?",
      otra: "5C",
    });
  });
  test("sin coincidencias en la otra, no la sugiere", async () => {
    const { busquedaVacia } = await import("@/lib/alumnos");
    const v = busquedaVacia("zz", "5C", 0);
    expect(v.otra).toBeNull();
    expect(v.descripcion).toBe("Revisa las tildes o busca por cédula.");
  });
});
