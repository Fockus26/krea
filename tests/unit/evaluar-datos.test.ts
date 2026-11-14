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
  nombreGrupal,
  nombreTitular,
  RUTA_EVALUAR,
  SIN_RESPUESTA,
  TITULAR_DESCONOCIDO,
  vistaEvaluar,
  zGuardarEvaluacion,
} from "@/lib/evaluar-datos";
import { hora24DeInstante, isoLocalDeInstante } from "@/lib/fecha";
import {
  type Entrega,
  type Equipo,
  type Tarea,
  type Usuario,
  zEvaluacion,
} from "@/lib/modelo";

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

const envio = (
  puntos: Record<string, number>,
  comentarios = {},
  version: number | null = null,
) =>
  zGuardarEvaluacion.parse({ entregaId: "e1", puntos, comentarios, version });

describe("armarEvaluacion", () => {
  const armar = (puntos: Record<string, number>, e = ent({ id: "e1" })) =>
    armarEvaluacion({
      entrega: e,
      tarea,
      envio: envio(puntos, { p1: "  Bien ", p2: " ", x: "fuera" }),
      basesVigentes: { "30000001": 15 },
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
        bases: { "30000001": 15 },
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
        version: null,
      }).success,
    ).toBe(false);
  });

  test("la versión con la que se abrió debe ser la vigente; si no, `cambio` (F-M1, D224)", () => {
    const evaluada = ent({
      id: "e1",
      estado: "evaluada",
      evaluacion: {
        puntos: { p1: 12, p2: 8 },
        comentarios: {},
        puntaje: 20,
        evaluadaPor: "30262232",
        evaluadaEn: 100,
      },
    });
    const con = (e: typeof evaluada, version: number | null) =>
      armarEvaluacion({
        entrega: e,
        tarea,
        envio: envio({ p1: 4, p2: 4 }, {}, version),
        basesVigentes: {},
        autorId: "30262232",
        ahora: 200,
      });
    // Abierta Pendiente, pero otro ya la evaluó
    expect(con(evaluada, null)).toEqual({ ok: false, error: "cambio" });
    // Abierta con una evaluación que ya no es la vigente
    expect(con(evaluada, 50)).toEqual({ ok: false, error: "cambio" });
    expect(con(evaluada, 100).ok).toBe(true);
    // Pendiente y abierta Pendiente
    expect(con(ent({ id: "e1" }), null).ok).toBe(true);
    // Sin versión no se acepta
    expect(
      zGuardarEvaluacion.safeParse({
        entregaId: "e1",
        puntos: {},
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
        imagenes: [
          {
            ruta: "entregas/x.jpg",
            alt: "Respuesta de Yeilin Duarte a la pregunta 2",
          },
        ],
      },
    ]);
    expect(v.inicial).toEqual({
      enviadaEn: expect.any(Number),
      puntajes: [null, null],
      comentarios: ["", ""],
      noParticiparon: [],
      bases: { "30000001": 15 },
    });
    expect(v.integrantes).toEqual([]);
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
      enviadaEn: expect.any(Number),
      puntajes: [10, 8],
      comentarios: ["", "Buen color"],
      noParticiparon: [],
      bases: { "30000001": 15 },
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
    // Bloque «No participó» (D366): los de la entrega; sin documento, «Sin nombre»
    expect(v.integrantes).toEqual([
      { cedula: "30000001", nombre: "Yeilin Duarte" },
      { cedula: "30000002", nombre: TITULAR_DESCONOCIDO },
    ]);
    expect(v.inicial.noParticiparon).toEqual([]);
    // Sin evaluar: la vigente de cada uno; quien ya no existe, 20 (D403)
    expect(v.inicial.bases).toEqual({ "30000001": 15, "30000002": 20 });
  });

  test("grupal ya evaluada: los marcados «No participó» vienen marcados al reevaluar", () => {
    const v = vistaEvaluar({
      entrega: ent({
        id: "g",
        tipo: "grupal",
        titularId: "eq",
        integrantes: ["30000001", "30000002"],
        estado: "evaluada",
        evaluacion: {
          puntos: { p1: 10, p2: 8 },
          comentarios: {},
          puntaje: 18,
          evaluadaPor: null,
          evaluadaEn: 1,
          noParticiparon: ["30000002"],
        },
      }),
      tarea: { ...tarea, tipo: "grupal" },
      cola: [],
      mapas,
    });
    expect(v.inicial.noParticiparon).toEqual(["30000002"]);
  });
});

describe("«No participó» al guardar (D364)", () => {
  const grupal = ent({
    id: "e1",
    tipo: "grupal",
    titularId: "eq",
    integrantes: ["30000001", "30000002", "30000003"],
  });
  const armarCon = (e: Entrega, noParticiparon?: string[]) =>
    armarEvaluacion({
      entrega: e,
      tarea: { ...tarea, tipo: e.tipo },
      envio: zGuardarEvaluacion.parse({
        entregaId: "e1",
        puntos: { p1: 10, p2: 8 },
        comentarios: {},
        version: null,
        noParticiparon,
      }),
      basesVigentes: {},
      autorId: "30262232",
      ahora: 5,
    });

  test("se guarda en el orden de los integrantes, sin repetir; el puntaje del equipo no cambia", () => {
    const r = armarCon(grupal, ["30000003", "30000001", "30000003"]);
    expect(r.ok && r.evaluacion.noParticiparon).toEqual([
      "30000001",
      "30000003",
    ]);
    expect(r.ok && r.evaluacion.puntaje).toBe(18);
  });

  test("sin marcas (o sin el campo) no se escribe: igual que una evaluación de antes", () => {
    for (const marcas of [undefined, []]) {
      const r = armarCon(grupal, marcas);
      expect(r.ok).toBe(true);
      expect(r.ok && "noParticiparon" in r.evaluacion).toBe(false);
    }
  });

  test("una cédula que no es de la entrega, o una marca en una individual, se rechaza", () => {
    expect(armarCon(grupal, ["30000009"])).toEqual({
      ok: false,
      error: "invalida",
    });
    expect(armarCon(ent({ id: "e1" }), ["30000001"])).toEqual({
      ok: false,
      error: "invalida",
    });
  });

  test("zod: cédulas válidas; la evaluación vieja sin el campo se lee", () => {
    expect(
      zGuardarEvaluacion.safeParse({
        entregaId: "e1",
        puntos: {},
        comentarios: {},
        version: null,
        noParticiparon: ["abc"],
      }).success,
    ).toBe(false);
    expect(
      zEvaluacion.safeParse({
        puntos: null,
        comentarios: {},
        puntaje: 18,
        evaluadaPor: null,
        evaluadaEn: 1,
      }).success,
    ).toBe(true);
    expect(
      zEvaluacion.safeParse({
        puntos: null,
        comentarios: {},
        puntaje: 18,
        evaluadaPor: null,
        evaluadaEn: 1,
        noParticiparon: ["30000001"],
      }).data?.noParticiparon,
    ).toEqual(["30000001"]);
  });

  test("«Deshacer» devuelve también las marcas de la evaluación anterior", () => {
    const r1 = armarCon(grupal, ["30000002"]);
    if (!r1.ok) throw new Error("no armó");
    const primera = entregaEvaluada(grupal, r1.evaluacion);
    const r2 = armarEvaluacion({
      entrega: primera,
      tarea: { ...tarea, tipo: "grupal" },
      envio: zGuardarEvaluacion.parse({
        entregaId: "e1",
        puntos: { p1: 10, p2: 8 },
        comentarios: {},
        version: 5,
      }),
      basesVigentes: {},
      autorId: "30262232",
      ahora: 9,
    });
    if (!r2.ok) throw new Error("no armó");
    const segunda = entregaEvaluada(primera, r2.evaluacion);
    expect(segunda.evaluacion?.noParticiparon).toBeUndefined();
    const d = deshacerEvaluacion(segunda, 9, "30262232");
    expect(d.ok && d.entrega.evaluacion?.noParticiparon).toEqual(["30000002"]);
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

describe("nombre de una grupal (D308)", () => {
  const equipo: { id: string } & Equipo = {
    id: "eq",
    nombre: "Repostería",
    seccion: "5A",
    tema: null,
    capitanId: null,
    logoPath: null,
  };
  const grupal = (o: Partial<Entrega> = {}) =>
    ent({ id: "g", tipo: "grupal", titularId: "eq", ...o });
  const mapas = (equipos: Array<{ id: string } & Equipo>) =>
    mapasEvaluar({ usuarios: [], equipos, tareas: [] });

  test("equipo vivo → su nombre; eliminado → el de entonces; si no, desconocido", () => {
    expect(
      nombreTitular(grupal({ titularNombre: "Viejo" }), mapas([equipo])),
    ).toBe("Repostería");
    expect(nombreGrupal(grupal({ titularNombre: "Viejo" }), new Map())).toBe(
      "Viejo",
    );
    expect(nombreTitular(grupal(), mapas([]))).toBe(TITULAR_DESCONOCIDO);
  });
});
