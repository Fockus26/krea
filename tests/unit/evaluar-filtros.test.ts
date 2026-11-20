import { describe, expect, test } from "bun:test";
import {
  colaEvaluadas,
  colaFiltradaCon,
  colaPorEvaluar,
  estadoDe,
  eyebrowCola,
  filtrarCola,
  filtrosDeParams,
  hayFiltros,
  listaSegunEstado,
  mapasEvaluar,
  opcionesFiltros,
  pideLaPrimera,
  queryFiltros,
  RUTA_EVALUAR,
  resumenFiltros,
  rutaCola,
  rutaEntrega,
  rutaPrimera,
  vistaEvaluar,
} from "@/lib/evaluar-datos";
import type { Entrega, Tarea, Usuario } from "@/lib/modelo";

const tarea = (id: string, titulo: string): { id: string } & Tarea => ({
  id,
  titulo,
  tipo: "individual",
  secciones: ["5A"],
  estado: "abierta",
  fechaEntrega: "2026-11-14",
  premio: null,
  preguntas: [{ id: "p1", enunciado: "Uno", formato: "texto", valor: 20 }],
  importada: false,
  autorId: null,
  actualizadoEn: 1,
});

const ent = (
  o: Partial<Entrega> & { id: string },
): { id: string } & Entrega => ({
  tareaId: "t1",
  tipo: "individual",
  titularId: "30000001",
  seccion: "5A",
  integrantes: ["30000001"],
  estado: "entregada",
  respuestas: { p1: { texto: "Hola" } },
  enviadaPor: "30000001",
  enviadaEn: 100,
  evaluacion: null,
  ...o,
});

const usuario = (cedula: string, nombres: string): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres,
  apellidos: "Duarte Pérez",
  seccion: "5A",
  equipoId: null,
  base: 20,
  avatar: { estilo: "fun-emoji", semilla: `s-${cedula}` },
  actualizadoEn: 1,
});

// Cola: i1 (5A, t1, ind., Yeilin) · g1 (5A, t2, grupal con Yeilin y Marta) · i2 (5C, t1, Marta)
const cola = colaPorEvaluar([
  ent({ id: "i1", enviadaEn: 10 }),
  ent({
    id: "g1",
    tipo: "grupal",
    tareaId: "t2",
    titularId: "eq1",
    integrantes: ["30000001", "30000002"],
    enviadaEn: 20,
  }),
  ent({
    id: "i2",
    seccion: "5C",
    titularId: "30000002",
    integrantes: ["30000002"],
    enviadaEn: 30,
  }),
]);
const ids = (c: ReadonlyArray<{ id: string }>) => c.map((e) => e.id);

describe("filtrosDeParams", () => {
  test("lee los cuatro parámetros", () => {
    expect(
      filtrosDeParams({
        tipo: "grupal",
        seccion: "5A",
        tarea: "t1",
        alumno: "30000001",
      }),
    ).toEqual({
      tipo: "grupal",
      seccion: "5A",
      tarea: "t1",
      alumno: "30000001",
    });
  });

  test("valores inválidos o ausentes se ignoran; repetidos, el primero", () => {
    expect(
      filtrosDeParams({
        tipo: "todas",
        seccion: "5A/../x",
        tarea: "no valido!",
        alumno: "abc",
      }),
    ).toEqual({});
    expect(filtrosDeParams({ tipo: ["individual", "grupal"] })).toEqual({
      tipo: "individual",
    });
    expect(filtrosDeParams({ ver: "" })).toEqual({});
  });
});

describe("filtrarCola", () => {
  test("sin filtros devuelve toda la cola", () => {
    expect(ids(filtrarCola(cola, {}))).toEqual(["i1", "g1", "i2"]);
  });

  test("cada filtro por separado", () => {
    expect(ids(filtrarCola(cola, { tipo: "grupal" }))).toEqual(["g1"]);
    expect(ids(filtrarCola(cola, { tipo: "individual" }))).toEqual([
      "i1",
      "i2",
    ]);
    expect(ids(filtrarCola(cola, { seccion: "5C" }))).toEqual(["i2"]);
    expect(ids(filtrarCola(cola, { tarea: "t2" }))).toEqual(["g1"]);
  });

  test("un alumno trae sus individuales y las grupales de su equipo", () => {
    expect(ids(filtrarCola(cola, { alumno: "30000001" }))).toEqual([
      "i1",
      "g1",
    ]);
    expect(ids(filtrarCola(cola, { alumno: "30000002" }))).toEqual([
      "g1",
      "i2",
    ]);
  });

  test("combinados: todos tienen que cumplirse", () => {
    expect(
      ids(filtrarCola(cola, { alumno: "30000002", seccion: "5C" })),
    ).toEqual(["i2"]);
    expect(ids(filtrarCola(cola, { tipo: "grupal", seccion: "5C" }))).toEqual(
      [],
    );
  });
});

describe("colaFiltradaCon", () => {
  test("la entrega abierta fuera del filtro se queda en su sitio", () => {
    expect(ids(colaFiltradaCon(cola, { tipo: "grupal" }, "i1"))).toEqual([
      "i1",
      "g1",
    ]);
    expect(ids(colaFiltradaCon(cola, { tipo: "grupal" }, "g1"))).toEqual([
      "g1",
    ]);
  });
});

describe("rutas", () => {
  test("sin filtros no añaden query", () => {
    expect(rutaCola()).toBe(RUTA_EVALUAR);
    expect(rutaEntrega("e1")).toBe(`${RUTA_EVALUAR}/e1`);
    expect(hayFiltros({})).toBe(false);
  });

  test("con filtros los conservan, en orden fijo", () => {
    const f = { alumno: "30000001", tipo: "grupal", seccion: "5A" } as const;
    expect(queryFiltros(f)).toBe("?tipo=grupal&seccion=5A&alumno=30000001");
    expect(rutaCola(f)).toBe(
      `${RUTA_EVALUAR}?tipo=grupal&seccion=5A&alumno=30000001`,
    );
    expect(rutaEntrega("e1", { tarea: "t1" })).toBe(
      `${RUTA_EVALUAR}/e1?tarea=t1`,
    );
    expect(hayFiltros(f)).toBe(true);
  });

  test("lo que sale de la URL vuelve igual", () => {
    const f = filtrosDeParams({ tipo: "grupal", seccion: "5A" });
    expect(
      filtrosDeParams(
        Object.fromEntries(new URLSearchParams(queryFiltros(f)).entries()),
      ),
    ).toEqual(f);
  });
});

describe("vistaEvaluar con la cola filtrada", () => {
  const mapas = mapasEvaluar({
    usuarios: [usuario("30000001", "Yeilin"), usuario("30000002", "Marta")],
    equipos: [],
    tareas: [tarea("t1", "Identidad"), tarea("t2", "Logo")],
  });
  const filtros = { alumno: "30000002" };
  const filtrada = filtrarCola(cola, filtros); // g1, i2

  test("posición y vecinos salen de la cola filtrada y los enlaces llevan la query", () => {
    const v = vistaEvaluar({
      entrega: filtrada[0] as (typeof filtrada)[number],
      tarea: tarea("t2", "Logo"),
      cola: filtrada,
      mapas,
      filtros,
    });
    expect(v.eyebrow).toBe("Por evaluar · entrega 1 de 2");
    expect(v.anteriorHref).toBeNull();
    expect(v.saltarHref).toBe(`${RUTA_EVALUAR}/i2?alumno=30000002`);
    expect(v.guardarHref).toBe(`${RUTA_EVALUAR}/i2?alumno=30000002`);
    expect(v.colaHref).toBe(`${RUTA_EVALUAR}?alumno=30000002`);
    expect(v.filtroTexto).toBe("Marta Duarte");
  });

  test("la última de la cola filtrada guarda hacia la cola con los filtros", () => {
    const v = vistaEvaluar({
      entrega: filtrada[1] as (typeof filtrada)[number],
      tarea: tarea("t1", "Identidad"),
      cola: filtrada,
      mapas,
      filtros,
    });
    expect(v.eyebrow).toBe("Por evaluar · entrega 2 de 2");
    expect(v.anteriorHref).toBe(`${RUTA_EVALUAR}/g1?alumno=30000002`);
    expect(v.saltarHref).toBeNull();
    expect(v.guardarHref).toBe(`${RUTA_EVALUAR}?alumno=30000002`);
  });

  test("sin filtros todo queda como antes", () => {
    const v = vistaEvaluar({
      entrega: cola[1] as (typeof cola)[number],
      tarea: tarea("t2", "Logo"),
      cola,
      mapas,
    });
    expect(v.anteriorHref).toBe(`${RUTA_EVALUAR}/i1`);
    expect(v.saltarHref).toBe(`${RUTA_EVALUAR}/i2`);
    expect(v.filtroTexto).toBeNull();
    expect(v.colaHref).toBe(RUTA_EVALUAR);
  });
});

describe("resumen y opciones", () => {
  const mapas = mapasEvaluar({
    usuarios: [usuario("30000001", "Yeilin"), usuario("30000002", "Marta")],
    equipos: [],
    tareas: [tarea("t1", "Identidad"), tarea("t2", "Logo")],
  });

  test("resumen del filtro activo", () => {
    expect(resumenFiltros({}, mapas)).toBeNull();
    expect(
      resumenFiltros({ tipo: "grupal", seccion: "5A", tarea: "t2" }, mapas),
    ).toBe("Grupales · 5A · Logo");
  });

  test("opciones: las de la cola entera, ordenadas, más la elegida sin entregas", () => {
    const o = opcionesFiltros(cola, { tarea: "t9" }, mapas);
    expect(o.tareas.map((t) => t.valor)).toEqual(["t1", "t2", "t9"]);
    expect(o.alumnos.map((a) => a.valor)).toEqual(["30000002", "30000001"]);
  });
});

describe("estado de la cola (D439)", () => {
  const ev = (evaluadaEn: number) => ({
    puntos: { p1: 18 },
    comentarios: {},
    puntaje: 18,
    evaluadaPor: "30262232",
    evaluadaEn,
  });
  const entregas = [
    ...cola,
    ent({ id: "v1", estado: "evaluada", evaluacion: ev(500) }),
    ent({
      id: "v2",
      estado: "evaluada",
      seccion: "5C",
      evaluacion: ev(900),
    }),
    ent({ id: "b1", estado: "borrador" }),
  ];
  const evaluadas = colaEvaluadas(entregas);
  const mapas = mapasEvaluar({
    usuarios: [usuario("30000001", "Yeilin"), usuario("30000002", "Marta")],
    equipos: [],
    tareas: [tarea("t1", "Identidad"), tarea("t2", "Logo")],
  });

  test("por defecto «Por evaluar»: no va en la URL; los inválidos se ignoran", () => {
    expect(filtrosDeParams({})).toEqual({});
    expect(filtrosDeParams({ estado: "por-evaluar" })).toEqual({});
    expect(filtrosDeParams({ estado: "otra" })).toEqual({});
    expect(filtrosDeParams({ estado: ["todas", "evaluadas"] })).toEqual({
      estado: "todas",
    });
    expect(estadoDe({})).toBe("por-evaluar");
    expect(estadoDe({ estado: "evaluadas" })).toBe("evaluadas");
  });

  test("query, hayFiltros y resumen lo incluyen; va primero", () => {
    const f = { estado: "evaluadas", tipo: "grupal" } as const;
    expect(queryFiltros(f)).toBe("?estado=evaluadas&tipo=grupal");
    expect(hayFiltros({ estado: "todas" })).toBe(true);
    expect(resumenFiltros(f, mapas)).toBe("Evaluadas · Grupales");
    expect(resumenFiltros({ estado: "todas" }, mapas)).toBe(
      "Todas las entregas",
    );
    expect(
      filtrosDeParams(
        Object.fromEntries(new URLSearchParams(queryFiltros(f)).entries()),
      ),
    ).toEqual(f);
  });

  test("evaluadas: la más reciente primero; todas: por evaluar y luego evaluadas", () => {
    expect(ids(evaluadas)).toEqual(["v2", "v1"]);
    expect(ids(listaSegunEstado("por-evaluar", cola, evaluadas))).toEqual([
      "i1",
      "g1",
      "i2",
    ]);
    expect(ids(listaSegunEstado("evaluadas", cola, evaluadas))).toEqual([
      "v2",
      "v1",
    ]);
    expect(ids(listaSegunEstado("todas", cola, evaluadas))).toEqual([
      "i1",
      "g1",
      "i2",
      "v2",
      "v1",
    ]);
    // los filtros sirven igual sobre las evaluadas
    expect(ids(filtrarCola(evaluadas, { seccion: "5C" }))).toEqual(["v2"]);
  });

  test("«Aplicar» de Cambiar: la cola con `ir=primera`", () => {
    expect(rutaPrimera()).toBe(`${RUTA_EVALUAR}?ir=primera`);
    expect(rutaPrimera({ estado: "evaluadas", seccion: "5A" })).toBe(
      `${RUTA_EVALUAR}?estado=evaluadas&seccion=5A&ir=primera`,
    );
    expect(pideLaPrimera({ ir: "primera" })).toBe(true);
    expect(pideLaPrimera({ ir: "otra" })).toBe(false);
    expect(pideLaPrimera({})).toBe(false);
    // `ir` no es un filtro
    expect(filtrosDeParams({ ir: "primera" })).toEqual({});
  });

  test("en la entrega, Anterior/Saltar/Guardar siguen las evaluadas (D440)", () => {
    const filtros = { estado: "evaluadas" } as const;
    const v = vistaEvaluar({
      entrega: evaluadas[0] as (typeof evaluadas)[number],
      tarea: tarea("t1", "Identidad"),
      cola: colaFiltradaCon(evaluadas, filtros, "v2"),
      mapas,
      filtros,
    });
    expect(v.eyebrow).toBe("Evaluadas · entrega 1 de 2");
    expect(v.anteriorHref).toBeNull();
    expect(v.saltarHref).toBe(`${RUTA_EVALUAR}/v1?estado=evaluadas`);
    expect(v.guardarHref).toBe(`${RUTA_EVALUAR}/v1?estado=evaluadas`);
    expect(v.colaHref).toBe(`${RUTA_EVALUAR}?estado=evaluadas`);
    expect(v.filtroTexto).toBe("Evaluadas");
    const ultima = vistaEvaluar({
      entrega: evaluadas[1] as (typeof evaluadas)[number],
      tarea: tarea("t1", "Identidad"),
      cola: evaluadas,
      mapas,
      filtros,
    });
    expect(ultima.anteriorHref).toBe(`${RUTA_EVALUAR}/v2?estado=evaluadas`);
    expect(ultima.guardarHref).toBe(`${RUTA_EVALUAR}?estado=evaluadas`);
  });

  test("eyebrow según el estado", () => {
    expect(eyebrowCola("por-evaluar", 0, 3)).toBe(
      "Por evaluar · entrega 1 de 3",
    );
    expect(eyebrowCola("todas", 2, 16)).toBe("Todas · entrega 3 de 16");
  });
});
