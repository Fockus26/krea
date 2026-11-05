import { describe, expect, test } from "bun:test";
import {
  armarEvaluacion,
  BASE_GRUPAL_CHIP,
  colaPorEvaluar,
  deshacerEvaluacion,
  EYEBROW_REEVALUAR,
  entregaEvaluada,
  IMAGEN_NO_DISPONIBLE,
  mapasEvaluar,
  RUTA_EVALUAR,
  SIN_RESPUESTA,
  vistaEvaluar,
  zGuardarEvaluacion,
} from "@/lib/evaluar-datos";
import { hora24DeInstante, isoLocalDeInstante } from "@/lib/fecha";
import type { Entrega, Equipo, Tarea, Usuario } from "@/lib/modelo";

const tarea: { id: string } & Tarea = {
  id: "t1",
  titulo: "Identidad de marca",
  tipo: "individual",
  secciones: ["5A"],
  estado: "abierta",
  fechaEntrega: "2026-11-14",
  premio: null,
  preguntas: [
    { id: "p1", enunciado: "Uno", formato: "texto", valor: 12 },
    { id: "p2", enunciado: "Dos", formato: "imagen", valor: 8 },
  ],
  importada: false,
  autorId: null,
  actualizadoEn: 1,
};

const ent = (
  o: Partial<Entrega> & { id: string },
): { id: string } & Entrega => ({
  tareaId: "t1",
  tipo: "individual",
  titularId: "30000001",
  seccion: "5A",
  integrantes: ["30000001"],
  estado: "entregada",
  respuestas: {
    p1: { texto: "  Hola " },
    p2: { imagenPath: "entregas/x.jpg" },
  },
  enviadaPor: "30000001",
  enviadaEn: Date.UTC(2026, 9, 25, 20, 12),
  evaluacion: null,
  ...o,
});

const usuario = (cedula: string, base = 15): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres: "Yeilin Andrea",
  apellidos: "Duarte Pérez",
  seccion: "5A",
  equipoId: null,
  base,
  avatar: { estilo: "fun-emoji", semilla: `s-${cedula}` },
  actualizadoEn: 1,
});

const envio = (puntos: Record<string, number>, comentarios = {}) =>
  zGuardarEvaluacion.parse({ entregaId: "e1", puntos, comentarios });

describe("armarEvaluacion", () => {
  const armar = (puntos: Record<string, number>, e = ent({ id: "e1" })) =>
    armarEvaluacion({
      entrega: e,
      tarea,
      envio: envio(puntos, { p1: "  Bien ", p2: " ", x: "fuera" }),
      autorId: "30262232",
      ahora: 5,
    });

  test("suma en medios y guarda solo comentarios con texto de la tarea", () => {
    expect(armar({ p1: 11.5, p2: 7 })).toEqual({
      ok: true,
      evaluacion: {
        puntos: { p1: 11.5, p2: 7 },
        comentarios: { p1: "Bien" },
        puntaje: 18.5,
        evaluadaPor: "30262232",
        evaluadaEn: 5,
      },
    });
  });

  test("cada pregunta, dentro de su máximo; ni de más ni de menos (D004)", () => {
    expect(armar({ p1: 12.5, p2: 0 })).toEqual({
      ok: false,
      error: "incompleta",
    });
    expect(armar({ p1: 12 })).toEqual({ ok: false, error: "incompleta" });
    expect(armar({ p1: 1, p2: 1, p3: 1 })).toEqual({
      ok: false,
      error: "invalida",
    });
    expect(
      armar({ p1: 1, p2: 1 }, ent({ id: "e1", estado: "borrador" })),
    ).toEqual({
      ok: false,
      error: "no-entregada",
    });
  });

  test("zod rechaza pasos que no son de 0,5", () => {
    expect(
      zGuardarEvaluacion.safeParse({
        entregaId: "e1",
        puntos: { p1: 3.2 },
        comentarios: {},
      }).success,
    ).toBe(false);
  });
});

describe("deshacer (D205)", () => {
  const ev = (puntaje: number, en: number) => ({
    puntos: null,
    comentarios: {},
    puntaje,
    evaluadaPor: "30262232",
    evaluadaEn: en,
  });

  test("vuelve a Pendiente o a la anterior, solo la del mismo autor e instante", () => {
    const primera = entregaEvaluada(ent({ id: "e1" }), ev(18, 10));
    expect(deshacerEvaluacion(primera, 10, "30262232")).toMatchObject({
      ok: true,
      entrega: { estado: "entregada", evaluacion: null },
    });
    const segunda = entregaEvaluada(primera, ev(12, 20));
    const r = deshacerEvaluacion(segunda, 20, "30262232");
    expect(r.ok && r.entrega.evaluacion?.puntaje).toBe(18);
    expect(r.ok && "evaluacionAnterior" in r.entrega).toBe(false);
    expect(deshacerEvaluacion(segunda, 10, "30262232")).toEqual({
      ok: false,
      error: "cambio",
    });
    expect(deshacerEvaluacion(segunda, 20, "30000009")).toEqual({
      ok: false,
      error: "cambio",
    });
  });
});

describe("cola y vista", () => {
  const cola = colaPorEvaluar([
    ent({ id: "b", enviadaEn: 30 }),
    ent({ id: "a", enviadaEn: 30 }),
    ent({ id: "c", enviadaEn: 10 }),
    ent({ id: "z", estado: "borrador" }),
  ]);

  test("la cola va de la más antigua a la más reciente, solo entregadas", () => {
    expect(cola.map((e) => e.id)).toEqual(["c", "a", "b"]);
  });

  const mapas = mapasEvaluar({
    usuarios: [usuario("30000001")],
    equipos: [],
    tareas: [tarea],
  });

  test("una entrega de la cola: posición, vecinos, base del alumno y respuestas", () => {
    const v = vistaEvaluar({
      entrega: ent({ id: "a" }),
      tarea,
      cola,
      mapas,
    });
    expect(v.eyebrow).toBe("Por evaluar · entrega 2 de 3");
    expect(v.titulo).toBe("Yeilin Duarte");
    expect(v.anteriorHref).toBe(`${RUTA_EVALUAR}/c`);
    expect(v.saltarHref).toBe(`${RUTA_EVALUAR}/b`);
    expect(v.guardarHref).toBe(`${RUTA_EVALUAR}/b`);
    expect(v.base).toBe(15);
    expect(v.chips.base).toBe("Base 15");
    expect(v.identidad).toEqual({
      tipo: "alumno",
      estilo: "fun-emoji",
      seed: "s-30000001",
      nombre: "Yeilin Duarte",
    });
    expect(v.linea).toBe(
      "Identidad de marca · entregó el 25/10/2026, 4:12 p. m.",
    );
    expect(v.preguntas.map((p) => p.respuesta)).toEqual([
      { tipo: "texto", texto: "Hola" },
      {
        tipo: "imagen",
        ruta: "entregas/x.jpg",
        alt: "Respuesta de Yeilin Duarte a la pregunta 2",
      },
    ]);
    expect(v.inicial).toEqual({
      puntajes: [null, null],
      comentarios: ["", ""],
    });
    expect(IMAGEN_NO_DISPONIBLE).toContain("imagen");
  });

  test("la última de la cola guarda hacia la cola; una evaluada se corrige con lo guardado", () => {
    expect(
      vistaEvaluar({ entrega: ent({ id: "b" }), tarea, cola, mapas })
        .guardarHref,
    ).toBe(RUTA_EVALUAR);
    const evaluada = ent({
      id: "x",
      estado: "evaluada",
      respuestas: {},
      evaluacion: {
        puntos: { p1: 10, p2: 8 },
        comentarios: { p2: "Buen color" },
        puntaje: 18,
        evaluadaPor: null,
        evaluadaEn: 1,
      },
    });
    const v = vistaEvaluar({ entrega: evaluada, tarea, cola, mapas });
    expect(v.posicion).toBeNull();
    expect(v.eyebrow).toBe(EYEBROW_REEVALUAR);
    expect(v.anteriorHref).toBeNull();
    expect(v.saltarHref).toBe(`${RUTA_EVALUAR}/c`);
    expect(v.inicial).toEqual({
      puntajes: [10, 8],
      comentarios: ["", "Buen color"],
    });
    expect(v.preguntas[0]?.respuesta).toEqual({
      tipo: "texto",
      texto: SIN_RESPUESTA,
    });
  });

  test("grupal: nota del equipo (base 20) y la base va por integrante (D177)", () => {
    const eq: { id: string } & Equipo = {
      id: "5a-g2",
      nombre: "5A-G2 Repostería",
      seccion: "5A",
      tema: "Repostería",
      capitanId: "30000001",
      logoPath: null,
    };
    const v = vistaEvaluar({
      entrega: ent({
        id: "g",
        tipo: "grupal",
        titularId: eq.id,
        integrantes: ["30000001", "30000002"],
      }),
      tarea: { ...tarea, tipo: "grupal", premio: "Cine" },
      cola: [],
      mapas: mapasEvaluar({
        usuarios: [usuario("30000001")],
        equipos: [eq],
        tareas: [],
      }),
    });
    expect(v.base).toBe(20);
    expect(v.chips).toMatchObject({
      tipoTexto: "Grupal · 2 integrantes",
      base: BASE_GRUPAL_CHIP,
      premio: "Cine",
    });
    expect(v.linea).toContain("entregó Yeilin Duarte (capitán)");
    expect(v.guardarHref).toBe(RUTA_EVALUAR);
  });
});

describe("fechas de Caracas", () => {
  test("hora 24 h e ISO local sin zona", () => {
    const ms = Date.UTC(2026, 9, 25, 14, 15); // 10:15 en Caracas (UTC−4)
    expect(hora24DeInstante(ms)).toBe("10:15");
    expect(isoLocalDeInstante(ms)).toBe("2026-10-25T10:15");
    expect(hora24DeInstante(Date.UTC(2026, 9, 25, 4, 5))).toBe("00:05");
  });
});
