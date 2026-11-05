import { describe, expect, test } from "bun:test";
import { ganadoresPremio } from "@/lib/equipo";
import {
  type Entrega,
  type Tarea,
  type TareaDoc,
  zTarea,
  zTareaDoc,
} from "@/lib/modelo";
import {
  borradorReducer,
  crearBorrador,
  mensajeErrorTarea,
  tareaAGuardar,
  validarBorrador,
  validarTarea,
} from "@/lib/tareas-profe";
import {
  armarTarea,
  datosBorradorDe,
  type EntradaTarea,
  estadoPremioSeccion,
  modoConstructor,
  puedeCerrar,
  resumenEntregas,
  seccionesDe,
  seccionTareaDe,
  tareaProfeDe,
  tarjetasPremios,
  zGuardarTarea,
} from "@/lib/tareas-profe-datos";

const HOY = "2026-11-05";
const AHORA = Date.UTC(2026, 10, 5, 15);
const PROFE = "30262232";

const entrada = (o: Partial<EntradaTarea> = {}): EntradaTarea => ({
  titulo: "Plan de redes",
  tipo: "grupal",
  fecha: "2026-11-14",
  seccion: "5A y 5C",
  premio: "Salida al cine",
  preguntas: [
    { id: "q1", enunciado: "Uno", formato: "texto", valor: 12 },
    { id: "q2", enunciado: "Dos", formato: "imagen", valor: 8 },
  ],
  ...o,
});

const publicada = (o: Partial<Tarea> = {}): Tarea =>
  zTarea.parse({
    titulo: "Identidad de marca",
    tipo: "grupal",
    secciones: ["5A"],
    estado: "abierta",
    fechaEntrega: "2026-11-01",
    premio: "Almuerzo",
    preguntas: [
      { id: "p1", enunciado: "Uno", formato: "texto", valor: 10 },
      { id: "p2", enunciado: "Dos", formato: "texto", valor: 10 },
    ],
    importada: false,
    autorId: PROFE,
    actualizadoEn: 1,
    ...o,
  });

const armar = (
  o: Partial<Parameters<typeof armarTarea>[0]> = {},
): ReturnType<typeof armarTarea> =>
  armarTarea({
    entrada: entrada(),
    accion: "publicar",
    previa: null,
    conEntregas: false,
    autorId: PROFE,
    hoy: HOY,
    ahora: AHORA,
    ...o,
  });

describe("armarTarea: nueva o borrador", () => {
  test("publicar una completa: abierta, secciones y autor de la sesión", () => {
    const r = armar();
    if (!r.ok) throw new Error(r.error);
    expect(r.tarea).toMatchObject({
      estado: "abierta",
      secciones: ["5A", "5C"],
      autorId: PROFE,
      premio: "Salida al cine",
      actualizadoEn: AHORA,
    });
    expect(zTarea.safeParse(r.tarea).success).toBe(true);
  });

  test("publicar exige suma 20, enunciados y valores (D004)", () => {
    const suma = entrada({
      preguntas: [{ id: "q1", enunciado: "Uno", formato: "texto", valor: 14 }],
    });
    expect(armar({ entrada: suma })).toEqual({ ok: false, error: "invalida" });
    const sinValor = entrada({
      preguntas: [
        { id: "q1", enunciado: "Uno", formato: "texto", valor: 20 },
        { id: "q2", enunciado: "Dos", formato: "texto", valor: null },
      ],
    });
    expect(armar({ entrada: sinValor }).ok).toBe(false);
    const sinEnunciado = entrada({
      preguntas: [{ id: "q1", enunciado: "", formato: "texto", valor: 20 }],
    });
    expect(armar({ entrada: sinEnunciado }).ok).toBe(false);
    expect(armar({ entrada: entrada({ titulo: "" }) }).ok).toBe(false);
  });

  test("publicar con fecha pasada o sin fecha", () => {
    expect(armar({ entrada: entrada({ fecha: "2026-11-04" }) })).toEqual({
      ok: false,
      error: "fecha-pasada",
    });
    expect(armar({ entrada: entrada({ fecha: HOY }) }).ok).toBe(true);
    expect(armar({ entrada: entrada({ fecha: null }) }).ok).toBe(false);
  });

  test("un borrador a medias se guarda (D199) pero necesita título", () => {
    const medias = entrada({
      fecha: null,
      preguntas: [
        { id: "q1", enunciado: "Uno", formato: "texto", valor: 4 },
        { id: "q2", enunciado: "", formato: "imagen", valor: null },
      ],
    });
    const r = armar({ accion: "borrador", entrada: medias });
    if (!r.ok) throw new Error(r.error);
    expect(r.tarea.estado).toBe("borrador");
    expect(zTarea.safeParse(r.tarea).success).toBe(false);
    expect(zTareaDoc.safeParse(r.tarea).success).toBe(true);
    expect(
      armar({ accion: "borrador", entrada: entrada({ titulo: "" }) }).ok,
    ).toBe(false);
  });

  test("individual: el premio no se guarda", () => {
    const r = armar({ entrada: entrada({ tipo: "individual" }) });
    if (!r.ok) throw new Error(r.error);
    expect(r.tarea.premio).toBeNull();
  });

  test("ids de pregunta repetidos o «guardar» sin publicar: inválida", () => {
    const rep = entrada({
      preguntas: [
        { id: "q1", enunciado: "Uno", formato: "texto", valor: 10 },
        { id: "q1", enunciado: "Dos", formato: "texto", valor: 10 },
      ],
    });
    expect(armar({ entrada: rep }).ok).toBe(false);
    expect(armar({ accion: "guardar" }).ok).toBe(false);
  });

  test("publicar un borrador guardado conserva su autor", () => {
    const previa: TareaDoc = {
      ...publicada(),
      estado: "borrador",
      autorId: "11111111",
    };
    const r = armar({ previa });
    if (!r.ok) throw new Error(r.error);
    expect(r.tarea.autorId).toBe("11111111");
  });
});

describe("armarTarea: publicada (D200)", () => {
  test("sin entregas: se cambia todo y sigue abierta", () => {
    const r = armar({ accion: "guardar", previa: publicada() });
    if (!r.ok) throw new Error(r.error);
    expect(r.tarea.estado).toBe("abierta");
    expect(r.tarea.preguntas.map((p) => p.id)).toEqual(["q1", "q2"]);
  });

  test("no vuelve a borrador ni se publica dos veces", () => {
    expect(armar({ accion: "borrador", previa: publicada() }).ok).toBe(false);
    expect(armar({ accion: "publicar", previa: publicada() }).ok).toBe(false);
  });

  test("con entregas: solo título, fecha y premio; preguntas y secciones quedan", () => {
    const previa = publicada();
    const r = armar({
      accion: "guardar",
      previa,
      conEntregas: true,
      entrada: entrada({
        titulo: "Identidad de marca (v2)",
        fecha: "2026-11-20",
        premio: "Cuenta Canva Pro",
        tipo: "individual",
        seccion: "5C",
        preguntas: [
          { id: "x", enunciado: "Otra", formato: "imagen", valor: 20 },
        ],
      }),
    });
    if (!r.ok) throw new Error(r.error);
    expect(r.tarea).toMatchObject({
      titulo: "Identidad de marca (v2)",
      fechaEntrega: "2026-11-20",
      premio: "Cuenta Canva Pro",
      tipo: "grupal",
      secciones: ["5A"],
      preguntas: previa.preguntas,
    });
  });

  test("con entregas: la fecha vencida se puede conservar, no poner otra pasada", () => {
    const previa = publicada({ fechaEntrega: "2026-11-01" });
    const base = { accion: "guardar" as const, previa, conEntregas: true };
    expect(
      armar({ ...base, entrada: entrada({ fecha: "2026-11-01" }) }).ok,
    ).toBe(true);
    expect(
      armar({ ...base, entrada: entrada({ fecha: "2026-11-02" }) }),
    ).toEqual({
      ok: false,
      error: "fecha-pasada",
    });
  });

  test("cerrada o importada: no se cambia", () => {
    expect(
      armar({ accion: "guardar", previa: publicada({ estado: "evaluada" }) }),
    ).toEqual({ ok: false, error: "cerrada" });
    expect(
      armar({
        accion: "guardar",
        previa: publicada({ importada: true, preguntas: [] }),
      }),
    ).toEqual({ ok: false, error: "cerrada" });
  });

  test("cerrar solo una abierta", () => {
    expect(puedeCerrar(publicada())).toBe(true);
    expect(puedeCerrar(publicada({ estado: "evaluada" }))).toBe(false);
  });
});

describe("entrada de la acción", () => {
  test("lo que manda el constructor valida con zGuardarTarea", () => {
    const t = crearBorrador({
      titulo: " Plan ",
      tipo: "grupal",
      fecha: "14/11/2026",
      premio: "Cine",
      preguntas: [
        { id: "p1", enunciado: "Uno", formato: "texto", valor: 10 },
        { enunciado: "Dos", formato: "imagen", valor: null },
      ],
    });
    const envio = zGuardarTarea.safeParse({
      id: null,
      accion: "borrador",
      tarea: tareaAGuardar(t),
    });
    expect(envio.success).toBe(true);
    expect(envio.data?.tarea.preguntas.map((p) => p.id)).toEqual(["p1", "q2"]);
  });

  test("valor que no va en medios o id raro: rechazado", () => {
    const mal = (o: Partial<EntradaTarea>) =>
      zGuardarTarea.safeParse({
        id: "t1",
        accion: "publicar",
        tarea: entrada(o),
      }).success;
    expect(
      mal({
        preguntas: [{ id: "q1", enunciado: "a", formato: "texto", valor: 0.3 }],
      }),
    ).toBe(false);
    expect(
      mal({
        preguntas: [{ id: "q/1", enunciado: "a", formato: "texto", valor: 20 }],
      }),
    ).toBe(false);
    expect(
      zGuardarTarea.safeParse({
        id: "../x",
        accion: "borrador",
        tarea: entrada(),
      }).success,
    ).toBe(false);
  });
});

describe("constructor con ids guardados", () => {
  test("conserva los ids y el siguiente no choca", () => {
    const t = crearBorrador({
      preguntas: [
        { id: "q7", enunciado: "a", formato: "texto", valor: 1 },
        { id: "p1", enunciado: "b", formato: "texto", valor: 1 },
      ],
    });
    expect(t.preguntas.map((p) => p.id)).toEqual(["q7", "p1"]);
    const mas = borradorReducer(t, { tipo: "agregar" });
    expect(mas.preguntas.at(-1)?.id).toBe("q8");
  });

  test("validarBorrador pide solo el título; la fecha guardada vencida vale", () => {
    const t = crearBorrador({ titulo: "", fecha: "01/11/2026" });
    expect(validarBorrador(t).titulo).toBeDefined();
    expect(validarBorrador({ ...t, titulo: "X" }).titulo).toBeUndefined();
    expect(validarTarea(t, HOY).fecha).toBeDefined();
    expect(validarTarea(t, HOY, "2026-11-01").fecha).toBeUndefined();
  });

  test("datosBorradorDe vuelve a la misma tarea", () => {
    const t = publicada({ secciones: ["5A", "5C"] });
    const d = datosBorradorDe(t);
    expect(d).toMatchObject({
      fecha: "01/11/2026",
      seccion: "5A y 5C",
      premio: "Almuerzo",
    });
    expect(tareaAGuardar(crearBorrador(d)).preguntas).toEqual(t.preguntas);
  });

  test("modoConstructor", () => {
    expect(modoConstructor({ ...publicada(), estado: "borrador" }, true)).toBe(
      "borrador",
    );
    expect(modoConstructor(publicada(), false)).toBe("publicada");
    expect(modoConstructor(publicada(), true)).toBe("con-entregas");
    expect(modoConstructor(publicada({ estado: "evaluada" }), false)).toBe(
      "cerrada",
    );
  });

  test("secciones", () => {
    expect(seccionesDe("5A y 5C")).toEqual(["5A", "5C"]);
    expect(seccionesDe("5C")).toEqual(["5C"]);
    expect(seccionTareaDe(["5A"])).toBe("5A");
    expect(seccionTareaDe(["5A", "5C"])).toBe("5A y 5C");
  });

  test("cada error tiene copy", () => {
    for (const e of [
      "no-existe",
      "cerrada",
      "invalida",
      "fecha-pasada",
      "sin-empate",
      "red",
    ] as const) {
      expect(mensajeErrorTarea(e).length).toBeGreaterThan(0);
    }
  });
});

/* ---------- Lista ---------- */

const entrega = (
  o: Partial<Entrega> & Pick<Entrega, "tareaId" | "titularId">,
  puntaje: number | null = null,
): Entrega => ({
  tipo: "grupal",
  seccion: "5A",
  integrantes: ["39000001"],
  estado: puntaje === null ? "entregada" : "evaluada",
  respuestas: {},
  enviadaPor: "39000001",
  enviadaEn: 1,
  evaluacion:
    puntaje === null
      ? null
      : {
          puntos: null,
          comentarios: {},
          puntaje,
          evaluadaPor: PROFE,
          evaluadaEn: Date.UTC(2026, 10, 3, 18),
        },
  ...o,
});

const CONTEOS = {
  alumnos: { "5A": 35, "5C": 34 },
  equipos: { "5A": 6, "5C": 6 },
} as const;

describe("lista del profe", () => {
  test("resumen por tarea: por evaluar y evaluadas", () => {
    const r = resumenEntregas([
      entrega({ tareaId: "a", titularId: "g1" }),
      entrega({ tareaId: "a", titularId: "g2" }, 18),
      entrega({ tareaId: "b", titularId: "g1" }),
    ]);
    expect(r.get("a")).toEqual({ entregadas: 1, evaluadas: 1 });
    expect(r.get("b")).toEqual({ entregadas: 1, evaluadas: 0 });
  });

  test("avance: entregas, luego evaluadas; borrador sin avance", () => {
    const t = { id: "a", ...publicada({ secciones: ["5A", "5C"] }) };
    expect(
      tareaProfeDe(t, { entregadas: 3, evaluadas: 0 }, CONTEOS),
    ).toMatchObject({
      avance: { tipo: "entregas", hechas: 3, total: 12 },
      porEvaluar: 3,
      preguntas: 2,
      suma: 20,
    });
    expect(
      tareaProfeDe(t, { entregadas: 3, evaluadas: 2 }, CONTEOS).avance,
    ).toEqual({ tipo: "evaluadas", hechas: 2, total: 12 });
    const ind = { id: "b", ...publicada({ tipo: "individual", premio: null }) };
    expect(tareaProfeDe(ind, undefined, CONTEOS).avance).toEqual({
      tipo: "entregas",
      hechas: 0,
      total: 35,
    });
    const borr = { id: "c", ...publicada(), estado: "borrador" as const };
    expect(tareaProfeDe(borr, undefined, CONTEOS).avance).toBeNull();
  });
});

/* ---------- Premios ---------- */

const EQUIPOS = [
  { id: "5a-g1", seccion: "5A" as const },
  { id: "5a-g2", seccion: "5A" as const },
  { id: "5c-g1", seccion: "5C" as const },
];

describe("premios", () => {
  test("una tarjeta por sección; borrador y abierta sin premio: por definir", () => {
    const tareas = [
      { id: "a", ...publicada({ secciones: ["5A", "5C"] }) },
      { id: "b", ...publicada(), estado: "borrador" as const },
      { id: "c", ...publicada({ premio: null }) },
      { id: "d", ...publicada({ premio: null, estado: "evaluada" }) },
      { id: "e", ...publicada({ tipo: "individual", premio: null }) },
      { id: "f", ...publicada({ importada: true, preguntas: [] }) },
    ];
    const t = tarjetasPremios(tareas, EQUIPOS, [
      entrega({ tareaId: "a", titularId: "5a-g1" }),
    ]);
    expect(t.map((x) => x.id)).toEqual(["a__5A", "a__5C", "c", "b"]);
    expect(t[0]).toMatchObject({
      seccionId: "5A",
      estado: { tipo: "en-juego", entregaron: 1, total: 2 },
    });
    expect(t[1]?.estado).toMatchObject({ entregaron: 0, total: 1 });
    expect(t[2]?.estado.tipo).toBe("por-definir");
    expect(t[3]).toMatchObject({ borrador: true, seccion: "5A" });
  });

  test("cerrada: ganador, empate y la decisión del profe", () => {
    const base = { id: "a", ...publicada({ estado: "evaluada" }) };
    const empate = [
      entrega({ tareaId: "a", titularId: "5a-g1" }, 18.5),
      entrega({ tareaId: "a", titularId: "5a-g2" }, 18.5),
    ];
    expect(estadoPremioSeccion(base, "5A", EQUIPOS, empate)).toEqual({
      tipo: "empate",
      equipoIds: ["5a-g1", "5a-g2"],
      nota: 18.5,
      fecha: "2026-11-03",
    });
    const dada = {
      ...base,
      decisionesPremio: { "5A": { tipo: "dar" as const, equipoId: "5a-g2" } },
    };
    expect(estadoPremioSeccion(dada, "5A", EQUIPOS, empate)).toMatchObject({
      tipo: "ganado",
      equipoId: "5a-g2",
    });
    const compartida = {
      ...base,
      decisionesPremio: { "5A": { tipo: "compartir" as const } },
    };
    expect(estadoPremioSeccion(compartida, "5A", EQUIPOS, empate).tipo).toBe(
      "compartido",
    );
    // La decisión no cuenta si ya no hay empate
    const unico = [
      entrega({ tareaId: "a", titularId: "5a-g1" }, 19),
      entrega({ tareaId: "a", titularId: "5a-g2" }, 18.5),
    ];
    expect(estadoPremioSeccion(dada, "5A", EQUIPOS, unico)).toMatchObject({
      tipo: "ganado",
      equipoId: "5a-g1",
    });
  });

  test("ganadoresPremio (Mi equipo) respeta la decisión solo con empate", () => {
    const empate = [
      { id: "g1", nota: 18 },
      { id: "g2", nota: 18 },
      { id: "g3", nota: null },
    ];
    expect(ganadoresPremio(empate)).toEqual([]);
    expect(ganadoresPremio(empate, { tipo: "compartir" })).toEqual([
      "g1",
      "g2",
    ]);
    expect(ganadoresPremio(empate, { tipo: "dar", equipoId: "g2" })).toEqual([
      "g2",
    ]);
    expect(ganadoresPremio(empate, { tipo: "dar", equipoId: "g3" })).toEqual(
      [],
    );
    expect(
      ganadoresPremio([{ id: "g1", nota: 19 }, ...empate], {
        tipo: "compartir",
      }),
    ).toEqual(["g1"]);
  });
});
