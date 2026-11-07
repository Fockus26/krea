import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { capitanesTexto, sumarResumenes } from "@/lib/alumnos-alta";
import {
  ALUMNOS,
  alternarTodos,
  alternarUno,
  borrarEnLote,
  eliminarLoteTitulo,
  eliminarPorTrozos,
  estadoTodos,
  fallidosTitulo,
  PROFESORES,
  partirEnLotes,
  podarSeleccion,
  type ResultadoLote,
  separarResultados,
  seleccionadosTexto,
  TOPE_LOTE,
  zCedulasLote,
} from "@/lib/lote";

const cedulas = (n: number) =>
  Array.from({ length: n }, (_, i) => String(10_000_000 + i));

describe("zCedulasLote (D299)", () => {
  test("acepta 1..TOPE_LOTE y quita repetidas", () => {
    expect(zCedulasLote.parse(["12345678", "12345678", "7654321"])).toEqual([
      "12345678",
      "7654321",
    ]);
    expect(zCedulasLote.safeParse(cedulas(TOPE_LOTE)).success).toBe(true);
  });
  test("rechaza vacío, más del tope y cédulas inválidas", () => {
    expect(zCedulasLote.safeParse([]).success).toBe(false);
    expect(zCedulasLote.safeParse(cedulas(TOPE_LOTE + 1)).success).toBe(false);
    expect(zCedulasLote.safeParse(["abc"]).success).toBe(false);
    expect(zCedulasLote.safeParse("12345678").success).toBe(false);
  });
});

describe("borrarEnLote", () => {
  test("uno por uno, en orden, con resultado por cédula", async () => {
    const orden: string[] = [];
    const r = await borrarEnLote(
      ["1", "2", "3"],
      async (c) => {
        orden.push(c);
        return c === "2" ? { ok: false, error: "no-alumno" } : { ok: true };
      },
      "red",
    );
    expect(orden).toEqual(["1", "2", "3"]);
    expect(r).toEqual([
      { cedula: "1", ok: true },
      { cedula: "2", ok: false, error: "no-alumno" },
      { cedula: "3", ok: true },
    ]);
  });
  test("si uno lanza, ese queda en `red` y el lote sigue", async () => {
    const r = await borrarEnLote(
      ["1", "2"],
      async (c) => {
        if (c === "1") throw new Error("x");
        return { ok: true };
      },
      "red",
    );
    expect(r).toEqual([
      { cedula: "1", ok: false, error: "red" },
      { cedula: "2", ok: true },
    ]);
  });
});

describe("troceo del cliente", () => {
  test("partirEnLotes respeta el orden y el tamaño", () => {
    const t = partirEnLotes(cedulas(TOPE_LOTE * 2 + 3));
    expect(t.map((x) => x.length)).toEqual([TOPE_LOTE, TOPE_LOTE, 3]);
    expect(partirEnLotes([])).toEqual([]);
  });
  test("eliminarPorTrozos junta resultados y marca en red un trozo caído", async () => {
    const todas = cedulas(TOPE_LOTE + 2);
    let llamada = 0;
    const r = await eliminarPorTrozos<"red">(
      todas,
      async (trozo): Promise<ResultadoLote<"red">> => {
        llamada++;
        if (llamada === 2) throw new Error("sin red");
        return {
          ok: true,
          resultados: trozo.map((cedula) => ({ cedula, ok: true })),
        };
      },
      "red",
    );
    expect(r).toHaveLength(todas.length);
    const { ok, fallidos } = separarResultados(r);
    expect(ok).toHaveLength(TOPE_LOTE);
    expect(fallidos.map((f) => f.cedula)).toEqual(todas.slice(TOPE_LOTE));
    expect(fallidos.every((f) => f.error === "red")).toBe(true);
  });
});

describe("selección", () => {
  const vis = ["a", "b", "c"];
  test("estadoTodos: vacía, a medias, todas", () => {
    expect(estadoTodos(vis, new Set())).toBe(false);
    expect(estadoTodos(vis, new Set(["a"]))).toBe("indeterminate");
    expect(estadoTodos(vis, new Set(vis))).toBe(true);
    expect(estadoTodos([], new Set(["a"]))).toBe(false);
    // Solo cuenta lo visible
    expect(estadoTodos(["a"], new Set(["a", "z"]))).toBe(true);
  });
  test("alternarTodos marca los visibles o los quita", () => {
    expect([...alternarTodos(vis, new Set(["a"]))]).toEqual(vis);
    expect(alternarTodos(vis, new Set(vis)).size).toBe(0);
  });
  test("alternarUno no muta y podarSeleccion quita las que ya no están", () => {
    const s = new Set(["a"]);
    expect([...alternarUno(s, "b", true)]).toEqual(["a", "b"]);
    expect([...alternarUno(s, "a", false)]).toEqual([]);
    expect([...s]).toEqual(["a"]);
    expect([...podarSeleccion(new Set(["a", "b"]), ["b", "c"])]).toEqual(["b"]);
  });
});

describe("textos (fila 159)", () => {
  test("singular y plural", () => {
    expect(seleccionadosTexto(0, ALUMNOS)).toBe("Ningún alumno seleccionado");
    expect(seleccionadosTexto(1, PROFESORES)).toBe("1 profesor seleccionado");
    expect(seleccionadosTexto(3, ALUMNOS)).toBe("3 alumnos seleccionados");
    expect(eliminarLoteTitulo(1, ALUMNOS)).toBe("¿Eliminar a 1 alumno?");
    expect(fallidosTitulo(2, 1, ALUMNOS)).toBe(
      "Se eliminaron 2. No se pudo eliminar a 1 alumno:",
    );
    expect(fallidosTitulo(0, 2, PROFESORES)).toBe(
      "No se eliminó a nadie. No se pudo eliminar a 2 profesores:",
    );
  });
});

describe("resumen del lote de alumnos (D300)", () => {
  test("suma notas, entregas sin nota, ajustes y capitanes", () => {
    const r = sumarResumenes([
      { notas: 2, sinNota: 1, ajustes: 0, capitania: null },
      {
        notas: 3,
        sinNota: 0,
        ajustes: 2,
        capitania: { equipo: "Los Rayos", sucesor: "Ana Pérez" },
      },
    ]);
    expect(r).toEqual({ notas: 5, sinNota: 1, ajustes: 2, capitanes: 1 });
    expect(capitanesTexto(0)).toBeNull();
    expect(capitanesTexto(2)).toContain("2 capitanes");
  });
});

describe("servidor (D298)", () => {
  const leer = (f: string) => readFileSync(f, "utf8");
  test("cada acción en lote exige sesión y reutiliza el borrado de uno", () => {
    const alumnos = leer("lib/acciones/alumnos.ts");
    const lote = alumnos.slice(
      alumnos.indexOf("export async function eliminarAlumnos"),
    );
    expect(lote).toMatch(/await exigirSesion\("profesor"\)/);
    expect(lote).toContain("zCedulasLote.safeParse");
    expect(lote).toContain("borrarUnAlumno(admin, cedula)");
    const profes = leer("lib/acciones/profesores.ts");
    const loteP = profes.slice(
      profes.indexOf("export async function eliminarProfesores"),
    );
    expect(loteP).toContain("await exigirAdmin()");
    expect(loteP).toContain("borrarUnProfesor(admin, sesion.uid, cedula)");
  });
});
