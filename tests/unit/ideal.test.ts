// Entrega ideal (tanda 11-14 Z2, D430–D435): elegible, una sola forma, validación, vigencia,
// quién la ve y la vista del alumno (sin nota ni comentarios del autor).
import { describe, expect, test } from "bun:test";
import {
  alumnoPuedeVer,
  autorDe,
  esElegible,
  estadoIdealProfe,
  estadoIdealTexto,
  type GuardarIdeal,
  type Ideal,
  rutaIdealProfe,
  rutasVista,
  validarIdeal,
  vigencia,
  vistaIdeal,
  zIdeal,
} from "@/lib/ideal";
import type { Entrega, Evaluacion, Pregunta } from "@/lib/modelo";
import { filasEntregasTarea } from "@/lib/tareas-profe-entregas";

const T = "t-ideal";
const PREGUNTAS: Pregunta[] = [
  { id: "p1", enunciado: "Uno", formato: "texto", valor: 12 },
  { id: "p2", enunciado: "Dos", formato: "imagen", valor: 8 },
];
const tarea = (estado: "borrador" | "abierta" | "evaluada" = "abierta") => ({
  estado,
  preguntas: PREGUNTAS,
  secciones: ["5A"],
});

const evaluacion = (puntaje: number): Evaluacion => ({
  puntos: { p1: Math.min(puntaje, 12), p2: Math.max(puntaje - 12, 0) },
  comentarios: { p1: "Comentario privado" },
  puntaje,
  evaluadaPor: "30262232",
  evaluadaEn: 1,
});

const entrega = (
  puntaje: number | null,
  extra: Partial<Entrega & { id: string }> = {},
): Entrega & { id: string } => ({
  id: `${T}__39711001`,
  tareaId: T,
  tipo: "individual",
  titularId: "39711001",
  seccion: "5A",
  integrantes: ["39711001"],
  estado: puntaje === null ? "entregada" : "evaluada",
  respuestas: {
    p1: { texto: "Mi respuesta" },
    p2: { imagenPaths: ["entregas/a.jpg", "entregas/b.jpg"] },
  },
  enviadaPor: "39711001",
  enviadaEn: 1,
  evaluacion: puntaje === null ? null : evaluacion(puntaje),
  ...extra,
});

const deEntrega = (nota = "Porque sí"): GuardarIdeal => ({
  tareaId: T,
  forma: { tipo: "entrega", entregaId: `${T}__39711001` },
  nota,
  notas: { p1: "  Clara  ", p2: "", otra: "no existe" },
});

const delProfe = (respuestas: Record<string, string>): GuardarIdeal => ({
  tareaId: T,
  forma: { tipo: "profe", respuestas },
  nota: "La nuestra",
  notas: {},
});

describe("elegible (D431)", () => {
  test("solo evaluada, de esa tarea y con 20 / 20", () => {
    expect(esElegible(entrega(20), T)).toBe(true);
    expect(esElegible(entrega(19.5), T)).toBe(false);
    expect(esElegible(entrega(null), T)).toBe(false);
    expect(esElegible(entrega(20), "otra")).toBe(false);
  });
});

describe("una sola forma (D430)", () => {
  const base = {
    tareaId: T,
    nota: "x",
    notas: {},
    autorId: "30262232",
    actualizadoEn: 1,
  };
  test("entrega o respuestas, nunca las dos ni ninguna", () => {
    expect(
      zIdeal.safeParse({ ...base, entregaId: "e", respuestas: null }).success,
    ).toBe(true);
    expect(
      zIdeal.safeParse({ ...base, entregaId: null, respuestas: { p1: "a" } })
        .success,
    ).toBe(true);
    expect(
      zIdeal.safeParse({ ...base, entregaId: "e", respuestas: { p1: "a" } })
        .success,
    ).toBe(false);
    expect(
      zIdeal.safeParse({ ...base, entregaId: null, respuestas: null }).success,
    ).toBe(false);
  });
});

describe("validarIdeal", () => {
  test("de una entrega de 20: limpia las notas por pregunta", () => {
    const r = validarIdeal(deEntrega(), tarea(), entrega(20), "30262232", 5);
    expect(r).toEqual({
      ok: true,
      ideal: {
        tareaId: T,
        entregaId: `${T}__39711001`,
        respuestas: null,
        nota: "Porque sí",
        notas: { p1: "Clara" },
        autorId: "30262232",
        actualizadoEn: 5,
      },
    });
  });

  test("errores en orden: tarea, borrador, porqué, elegible", () => {
    expect(validarIdeal(deEntrega(), null, entrega(20), "x", 1)).toEqual({
      ok: false,
      error: "no-existe",
    });
    expect(
      validarIdeal(deEntrega(), tarea("borrador"), entrega(20), "x", 1),
    ).toEqual({ ok: false, error: "borrador" });
    expect(
      validarIdeal(deEntrega("   "), tarea(), entrega(20), "x", 1),
    ).toEqual({ ok: false, error: "sin-nota" });
    expect(validarIdeal(deEntrega(), tarea(), entrega(18), "x", 1)).toEqual({
      ok: false,
      error: "no-elegible",
    });
    expect(validarIdeal(deEntrega(), tarea(), null, "x", 1)).toEqual({
      ok: false,
      error: "no-elegible",
    });
  });

  test("del profe: una respuesta por pregunta, también en las de imagen", () => {
    expect(
      validarIdeal(delProfe({ p1: "a", p2: " " }), tarea(), null, "x", 1),
    ).toEqual({ ok: false, error: "incompleta" });
    const r = validarIdeal(
      delProfe({ p1: " a ", p2: "b", sobra: "c" }),
      tarea("evaluada"),
      null,
      "x",
      1,
    );
    expect(r.ok && r.ideal.respuestas).toEqual({ p1: "a", p2: "b" });
    expect(r.ok && r.ideal.entregaId).toBeNull();
  });
});

describe("vigencia (D434)", () => {
  const ideal = { tareaId: T, entregaId: `${T}__39711001` };
  test("la del profe siempre vale", () => {
    expect(vigencia({ tareaId: T, entregaId: null }, null)).toBe("vigente");
  });
  test("eliminada, devuelta o corregida a menos de 20 → ya no", () => {
    expect(vigencia(ideal, entrega(20))).toBe("vigente");
    expect(vigencia(ideal, null)).toBe("sin-entrega");
    expect(vigencia(ideal, entrega(null))).toBe("no-elegible");
    expect(vigencia(ideal, entrega(17))).toBe("no-elegible");
  });
});

describe("quién la ve (D433)", () => {
  test("solo con la tarea cerrada y de su sección", () => {
    expect(alumnoPuedeVer(tarea("evaluada"), "5A")).toBe(true);
    expect(alumnoPuedeVer(tarea("abierta"), "5A")).toBe(false);
    expect(alumnoPuedeVer(tarea("borrador"), "5A")).toBe(false);
    expect(alumnoPuedeVer(tarea("evaluada"), "5C")).toBe(false);
    expect(alumnoPuedeVer(tarea("evaluada"), null)).toBe(false);
    expect(alumnoPuedeVer(null, "5A")).toBe(false);
  });
});

describe("autor y estado del profe", () => {
  const usuarios = new Map([
    [
      "39711001",
      {
        nombres: "Ana  María",
        apellidos: "Pérez",
        avatar: { estilo: "adventurer-neutral", semilla: "s" },
      },
    ],
  ]);
  const equipos = new Map([
    ["eq1", { nombre: "Los Pixel", tema: "Pixel", logoPath: null }],
  ]);
  const idealE = { tareaId: T, entregaId: `${T}__39711001` };

  test("alumno, equipo o profes", () => {
    expect(autorDe(idealE, entrega(20), usuarios, equipos)).toEqual({
      tipo: "alumno",
      nombre: "Ana María Pérez",
      avatar: { estilo: "adventurer-neutral", semilla: "s" },
    });
    expect(
      autorDe(
        idealE,
        entrega(20, { tipo: "grupal", titularId: "eq1" }),
        usuarios,
        equipos,
      ),
    ).toMatchObject({ tipo: "equipo", nombre: "Los Pixel", tema: "Pixel" });
    expect(autorDe({ entregaId: null }, null, usuarios, equipos)).toEqual({
      tipo: "profe",
    });
  });

  test("ninguna, vigente y caducada", () => {
    expect(estadoIdealProfe(null, null, usuarios, equipos)).toEqual({
      tipo: "ninguna",
    });
    expect(estadoIdealProfe(idealE, entrega(20), usuarios, equipos)).toEqual({
      tipo: "vigente",
      deQuien: "de Ana María Pérez",
      entregaId: idealE.entregaId,
    });
    const caducada = estadoIdealProfe(idealE, null, usuarios, equipos);
    expect(caducada).toEqual({ tipo: "caducada", deQuien: null });
    expect(estadoIdealTexto(caducada, false)).toContain("se eliminó");
    expect(
      estadoIdealTexto(
        estadoIdealProfe(idealE, entrega(18), usuarios, equipos),
        true,
      ),
    ).toContain("de Ana María Pérez");
  });
});

describe("vista del alumno", () => {
  const ideal: Ideal = {
    tareaId: T,
    entregaId: `${T}__39711001`,
    respuestas: null,
    nota: "General",
    notas: { p2: "Buen encuadre" },
    autorId: "30262232",
    actualizadoEn: 1,
  };

  test("de una entrega: sus respuestas y las notas, sin la evaluación", () => {
    const v = vistaIdeal({
      tarea: { titulo: "Marca", preguntas: PREGUNTAS },
      ideal,
      entrega: entrega(20),
      autor: { tipo: "profe" },
    });
    expect(v.nota).toBe("General");
    expect(v.preguntas.map((p) => p.respuesta)).toEqual([
      { tipo: "texto", texto: "Mi respuesta" },
      { tipo: "imagen", rutas: ["entregas/a.jpg", "entregas/b.jpg"] },
    ]);
    expect(v.preguntas.map((p) => p.nota)).toEqual([null, "Buen encuadre"]);
    expect(rutasVista(v)).toEqual(["entregas/a.jpg", "entregas/b.jpg"]);
    const json = JSON.stringify(v);
    expect(json).not.toContain("Comentario privado");
    expect(json).not.toContain("puntaje");
  });

  test("del profe: sus textos, sin imágenes que firmar", () => {
    const v = vistaIdeal({
      tarea: { titulo: "Marca", preguntas: PREGUNTAS },
      ideal: { ...ideal, entregaId: null, respuestas: { p1: "a", p2: "b" } },
      entrega: null,
      autor: { tipo: "profe" },
    });
    expect(v.preguntas.map((p) => p.respuesta)).toEqual([
      { tipo: "texto", texto: "a" },
      { tipo: "texto", texto: "b" },
    ]);
    expect(rutasVista(v)).toEqual([]);
  });
});

describe("«Marcar como entrega ideal» en la lista de entregas", () => {
  test("solo las filas evaluadas con 20 / 20", () => {
    const filas = filasEntregasTarea({
      tarea: {
        id: T,
        tipo: "individual",
        secciones: ["5A"],
        estado: "abierta",
      },
      entregas: [
        entrega(20),
        entrega(18, { id: `${T}__2`, titularId: "2", integrantes: ["2"] }),
        entrega(null, { id: `${T}__3`, titularId: "3", integrantes: ["3"] }),
      ],
      usuarios: [],
      equipos: [],
    });
    expect(filas.map((f) => f.idealHref)).toEqual([
      rutaIdealProfe(T, { entrega: `${T}__39711001` }),
      null,
      null,
    ]);
  });
});

describe("rutas", () => {
  test("del profe con la entrega elegida o su propia forma", () => {
    expect(rutaIdealProfe("t1")).toBe("/profe/tareas/t1/ideal");
    expect(rutaIdealProfe("t1", { entrega: "t1__a" })).toBe(
      "/profe/tareas/t1/ideal?entrega=t1__a",
    );
    expect(rutaIdealProfe("t1", { forma: "profe" })).toBe(
      "/profe/tareas/t1/ideal?forma=profe",
    );
  });
});
