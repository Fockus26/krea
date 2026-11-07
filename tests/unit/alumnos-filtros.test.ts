import { describe, expect, test } from "bun:test";
import {
  contadorEstadoTexto,
  filtrarPorEstado,
  leerFiltrosAlumnos,
  notaParaFiltro,
  rutaAlumnos,
} from "@/lib/alumnos";
import { notasPorTarea } from "@/lib/alumnos-datos";
import type { Entrega } from "@/lib/modelo";

describe("rutaAlumnos (D252)", () => {
  test("sin filtros es la ruta pelada", () => {
    expect(rutaAlumnos()).toBe("/profe/alumnos");
    expect(rutaAlumnos({})).toBe("/profe/alumnos");
  });
  test("pone solo los filtros dados, en orden estable", () => {
    expect(
      rutaAlumnos({ tarea: "t1", estado: "raspados", seccion: "5C" }),
    ).toBe("/profe/alumnos?seccion=5C&estado=raspados&tarea=t1");
    expect(rutaAlumnos({ alumno: "37575127" })).toBe(
      "/profe/alumnos?alumno=37575127",
    );
  });
  test("codifica el id de la tarea", () => {
    expect(rutaAlumnos({ tarea: "a b&c" })).toBe(
      "/profe/alumnos?tarea=a+b%26c",
    );
  });
});

describe("leerFiltrosAlumnos", () => {
  test("lee filtros válidos de un objeto y de URLSearchParams", () => {
    const f = {
      seccion: "5A",
      estado: "evaluados",
      tarea: "t1",
      alumno: "37575127",
    } as const;
    expect(leerFiltrosAlumnos(f)).toEqual(f);
    expect(
      leerFiltrosAlumnos(new URLSearchParams(rutaAlumnos(f).split("?")[1])),
    ).toEqual(f);
  });
  test("valores inválidos se ignoran sin error", () => {
    expect(
      leerFiltrosAlumnos({
        seccion: "5B",
        estado: "todos",
        tarea: "a/b",
        alumno: "abc",
      }),
    ).toEqual({});
    expect(leerFiltrosAlumnos({ tarea: "", alumno: "123" })).toEqual({});
    expect(leerFiltrosAlumnos({ tarea: "x".repeat(200) })).toEqual({});
    expect(leerFiltrosAlumnos(new URLSearchParams("estado=%E0%A4%A"))).toEqual(
      {},
    );
  });
  test("un valor repetido toma el primero", () => {
    expect(leerFiltrosAlumnos({ seccion: ["5C", "5A"] })).toEqual({
      seccion: "5C",
    });
  });
});

const fila = (cedula: string, nota: number | null, notas = {}) => ({
  cedula,
  nota,
  notas,
});

describe("filtrarPorEstado", () => {
  const lista = [
    fila("1", 15, { t1: 15 }),
    fila("2", 8, { t1: 8 }),
    fila("3", 12, {}),
    fila("4", null),
  ];
  test("sin estado devuelve todo", () => {
    expect(filtrarPorEstado(lista, undefined, "t1")).toHaveLength(4);
  });
  test("sobre una tarea: evaluados, raspados (<10) y pendientes", () => {
    const ids = (e: "evaluados" | "raspados" | "pendientes") =>
      filtrarPorEstado(lista, e, "t1").map((a) => a.cedula);
    expect(ids("evaluados")).toEqual(["1", "2"]);
    expect(ids("raspados")).toEqual(["2"]);
    expect(ids("pendientes")).toEqual(["3", "4"]);
  });
  test("sin tarea usa la nota individual vigente", () => {
    expect(
      filtrarPorEstado(lista, "evaluados", undefined).map((a) => a.cedula),
    ).toEqual(["1", "2", "3"]);
  });
  test("el alumno pedido se queda aunque no cumpla", () => {
    expect(
      filtrarPorEstado(lista, "raspados", "t1", "4").map((a) => a.cedula),
    ).toEqual(["2", "4"]);
  });
  test("10 justo no es raspado", () => {
    expect(
      filtrarPorEstado([fila("9", 10, { t1: 10 })], "raspados", "t1"),
    ).toEqual([]);
  });
});

describe("notaParaFiltro y textos", () => {
  test("con tarea sin nota es Pendiente (null), nunca 0", () => {
    expect(notaParaFiltro(fila("1", 15), "t9")).toBeNull();
    expect(notaParaFiltro(fila("1", 15, { t9: 7.5 }), "t9")).toBe(7.5);
    expect(notaParaFiltro(fila("1", 15), undefined)).toBe(15);
  });
  test("contadorEstadoTexto es una frase completa", () => {
    expect(contadorEstadoTexto(3, "raspados", "5A", "Identidad")).toBe(
      "3 raspados en 5A · Identidad",
    );
    expect(contadorEstadoTexto(1, "evaluados", "5C")).toBe("1 evaluado en 5C");
    expect(contadorEstadoTexto(0, "raspados", "5A", "X")).toBe(
      "Nadie raspado en 5A · X",
    );
  });
});

describe("notasPorTarea", () => {
  const entrega = (
    tareaId: string,
    integrantes: string[],
    puntaje: number | null,
    en = 1,
  ) =>
    ({
      tareaId,
      tipo: integrantes.length > 1 ? "grupal" : "individual",
      titularId: integrantes[0],
      seccion: "5A",
      integrantes,
      estado: puntaje === null ? "enviada" : "evaluada",
      respuestas: {},
      enviadaPor: null,
      enviadaEn: null,
      evaluacion:
        puntaje === null
          ? null
          : { puntaje, evaluadaEn: en, evaluadaPor: "30262232" },
    }) as unknown as Entrega;
  test("cuenta individuales y grupales evaluadas, con la base del alumno", () => {
    const n = notasPorTarea({ cedula: "1", base: 10 }, [
      entrega("t1", ["1"], 20),
      entrega("t2", ["1", "2"], 16),
      entrega("t3", ["1"], null),
      entrega("t4", ["2"], 20),
    ]);
    expect(Object.keys(n).sort()).toEqual(["t1", "t2"]);
    expect(n.t1).toBe(10);
    expect(n.t2).toBe(8);
  });
});
