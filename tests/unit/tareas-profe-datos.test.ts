import { describe, expect, test } from "bun:test";
import { ganadoresPremio } from "@/lib/equipo";
import {
  type Entrega,
  type Tarea,
  type TareaDoc,
  zDia,
  zTarea,
  zTareaDoc,
} from "@/lib/modelo";
import {
  avanceTexto,
  borradorReducer,
  crearBorrador,
  eliminarTareaDescripcion,
  mensajeErrorTarea,
  SIN_PERDIDA,
  tareaAGuardar,
  validarBorrador,
  validarTarea,
} from "@/lib/tareas-profe";
import {
  armarTarea,
  type Conteos,
  conteosDe,
  datosBorradorDe,
  type EntradaTarea,
  estadoPremioSeccion,
  MAX_ESCRITURAS_TX,
  modoConstructor,
  perdidaAlEliminar,
  perdidasPorTarea,
  planEliminar,
  puedeCerrar,
  type ResumenEntregas,
  resumenEntregas,
  tareaProfeDe,
  tarjetasPremios,
  totalTitulares,
  zGuardarTarea,
} from "@/lib/tareas-profe-datos";

const HOY = "2026-11-05";
const AHORA = Date.UTC(2026, 10, 5, 15);
const PROFE = "30262232";

const entrada = (o: Partial<EntradaTarea> = {}): EntradaTarea => ({
  titulo: "Plan de redes",
  tipo: "grupal",
  fecha: "2026-11-14",
  secciones: ["5A", "5C"],
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

  test("publicar a más de un año o con un día que no existe (F-B2, D228)", () => {
    expect(armar({ entrada: entrada({ fecha: "9999-12-31" }) })).toEqual({
      ok: false,
      error: "fecha-lejana",
    });
    // 366 días desde 2026-11-05: 2027-11-06 entra; 2027-11-07 ya no
    expect(armar({ entrada: entrada({ fecha: "2027-11-06" }) }).ok).toBe(true);
    expect(armar({ entrada: entrada({ fecha: "2027-11-07" }) })).toEqual({
      ok: false,
      error: "fecha-lejana",
    });
    expect(zDia.safeParse("2027-02-31").success).toBe(false);
    expect(zDia.safeParse("2028-02-29").success).toBe(true);
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

  test("individual: el premio también se guarda (D263)", () => {
    const r = armar({ entrada: entrada({ tipo: "individual" }) });
    if (!r.ok) throw new Error(r.error);
    expect(r.tarea.premio).toBe("Salida al cine");
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
        secciones: ["5C"],
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
      secciones: ["5A"],
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
      secciones: ["5A", "5C"],
      premio: "Almuerzo",
    });
    const vuelta = tareaAGuardar(crearBorrador(d));
    expect(vuelta.preguntas).toEqual(t.preguntas);
    expect(vuelta.secciones).toEqual(["5A", "5C"]);
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

  test("secciones del catálogo (D324): las que llegan, ordenadas; ninguna o repetida no valida", () => {
    const r = armar({
      accion: "publicar",
      entrada: entrada({ secciones: ["5C", "4B", "5A"] }),
    });
    if (!r.ok) throw new Error(r.error);
    expect(r.tarea.secciones).toEqual(["4B", "5A", "5C"]);
    const base = { id: null, accion: "borrador" as const };
    expect(
      zGuardarTarea.safeParse({ ...base, tarea: entrada({ secciones: [] }) })
        .success,
    ).toBe(false);
    expect(
      zGuardarTarea.safeParse({
        ...base,
        tarea: entrada({ secciones: ["5A", "5A"] }),
      }).success,
    ).toBe(false);
    expect(
      zGuardarTarea.safeParse({
        ...base,
        tarea: entrada({ secciones: ["5a"] }),
      }).success,
    ).toBe(false);
    expect(
      zGuardarTarea.safeParse({
        ...base,
        tarea: entrada({ secciones: ["4B"] }),
      }).success,
    ).toBe(true);
  });

  test("la lista y Premios muestran las secciones con listaSecciones", () => {
    const t = { id: "a", ...publicada({ secciones: ["5C", "4B", "5A"] }) };
    expect(tareaProfeDe(t, undefined, CONTEOS).secciones).toBe("4B, 5A y 5C");
  });

  test("cada error tiene copy", () => {
    for (const e of [
      "no-existe",
      "cerrada",
      "invalida",
      "fecha-pasada",
      "fecha-lejana",
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

const ids = (s: string, n: number) =>
  Array.from({ length: n }, (_, i) => `${s}${i + 1}`);
const CONTEOS: Conteos = {
  alumnos: { "5A": 35, "5C": 34 },
  equipos: { "5A": ids("g", 6), "5C": ids("h", 6) },
};
const resumen = (
  entregadas: number,
  evaluadas: number,
  titulares: readonly string[],
): ResumenEntregas => ({
  entregadas,
  evaluadas,
  titulares: new Set(titulares),
});

describe("lista del profe", () => {
  test("resumen por tarea: por evaluar, evaluadas y titulares", () => {
    const r = resumenEntregas([
      entrega({ tareaId: "a", titularId: "g1" }),
      entrega({ tareaId: "a", titularId: "g2" }, 18),
      entrega({ tareaId: "b", titularId: "g1" }),
      { ...entrega({ tareaId: "b", titularId: "g3" }), estado: "borrador" },
    ]);
    expect(r.get("a")).toEqual(resumen(1, 1, ["g1", "g2"]));
    // El borrador de g3 no cuenta ni como titular con entrega
    expect(r.get("b")).toEqual(resumen(1, 0, ["g1"]));
  });

  test("avance: entregas, luego evaluadas; borrador sin avance", () => {
    const t = { id: "a", ...publicada({ secciones: ["5A", "5C"] }) };
    expect(
      tareaProfeDe(t, resumen(3, 0, ["g1", "g2", "h1"]), CONTEOS),
    ).toMatchObject({
      avance: { tipo: "entregas", hechas: 3, total: 12 },
      porEvaluar: 3,
      preguntas: 2,
      suma: 20,
      secciones: "5A y 5C",
    });
    expect(
      tareaProfeDe(t, resumen(3, 2, ["g1", "g2", "g3", "h1", "h2"]), CONTEOS)
        .avance,
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

  describe("total con equipos eliminados (D316)", () => {
    const grupal5A = { id: "a", ...publicada({ secciones: ["5A"] }) };
    const vivos2: Conteos = {
      ...CONTEOS,
      equipos: { "5A": ["g1", "g2"], "5C": [] },
    };

    test("1 evaluada de un equipo eliminado + 2 vivos sin entrega → «1 de 3»", () => {
      const r = resumenEntregas([
        entrega({ tareaId: "a", titularId: "borrado" }, 17),
      ]).get("a");
      expect(tareaProfeDe(grupal5A, r, vivos2).avance).toEqual({
        tipo: "evaluadas",
        hechas: 1,
        total: 3,
      });
      expect(
        avanceTexto({ tipo: "evaluadas", hechas: 1, total: 3 }, "grupal"),
      ).toBe("1 de 3 equipos evaluados");
    });

    test("un vivo con entrega no se cuenta dos veces", () => {
      const r = resumen(1, 1, ["g1", "borrado"]);
      expect(totalTitulares(grupal5A, vivos2, r)).toBe(3);
      expect(totalTitulares(grupal5A, vivos2)).toBe(2);
    });

    test("individual: el mayor entre los vivos y los que entregaron", () => {
      const ind = {
        id: "b",
        ...publicada({ tipo: "individual", premio: null, secciones: ["5C"] }),
      };
      expect(totalTitulares(ind, CONTEOS, resumen(2, 3, []))).toBe(34);
      const pocos: Conteos = { ...CONTEOS, alumnos: { "5A": 0, "5C": 2 } };
      expect(totalTitulares(ind, pocos, resumen(2, 1, []))).toBe(3);
    });

    test("invariante: hechas <= total siempre", () => {
      const casos: Array<[number, number, string[], Conteos]> = [
        [0, 4, ["x1", "x2", "x3", "x4"], vivos2],
        [3, 0, ["x1", "x2", "g1"], vivos2],
        [5, 5, ids("x", 10), { ...CONTEOS, equipos: { "5A": [], "5C": [] } }],
        [0, 0, [], vivos2],
      ];
      for (const [entregadas, evaluadas, tit, c] of casos) {
        for (const t of [
          grupal5A,
          { ...grupal5A, estado: "evaluada" as const },
          { id: "i", ...publicada({ tipo: "individual", premio: null }) },
        ]) {
          const av = tareaProfeDe(t, resumen(entregadas, evaluadas, tit), {
            ...c,
            alumnos: { "5A": 1, "5C": 0 },
          }).avance;
          expect(av).not.toBeNull();
          if (av) expect(av.hechas).toBeLessThanOrEqual(av.total);
        }
      }
    });
  });
});

/* ---------- Eliminar (D242, D243) ---------- */

describe("eliminar una tarea", () => {
  test("pierde una nota por integrante de cada evaluada; borradores no cuentan", () => {
    const p = perdidaAlEliminar([
      entrega(
        {
          tareaId: "a",
          titularId: "g1",
          seccion: "5C",
          integrantes: ["39000001", "39000002", "39000003"],
        },
        18,
      ),
      entrega({ tareaId: "a", titularId: "g2", seccion: "5A" }, 9),
      entrega({ tareaId: "a", titularId: "g3", seccion: "5A" }),
      { ...entrega({ tareaId: "a", titularId: "g4" }), estado: "borrador" },
    ]);
    // Una nota < 10 (aporta 0 puntos) también se pierde: es una nota
    expect(p).toEqual({ notas: 4, sinEvaluar: 1, secciones: ["5A", "5C"] });
    expect(perdidaAlEliminar([])).toEqual(SIN_PERDIDA);
  });

  test("perdidas por tarea en una pasada", () => {
    const m = perdidasPorTarea([
      entrega({ tareaId: "a", titularId: "g1" }, 15),
      entrega({ tareaId: "b", titularId: "g1" }),
    ]);
    expect(m.get("a")).toEqual({ notas: 1, sinEvaluar: 0, secciones: ["5A"] });
    expect(m.get("b")).toEqual({ notas: 0, sinEvaluar: 1, secciones: [] });
    expect(m.get("c")).toBeUndefined();
  });

  test("la tarjeta lleva la pérdida (sin entregas: nada)", () => {
    const t = { id: "a", ...publicada() };
    expect(tareaProfeDe(t, undefined, CONTEOS).perdida).toEqual(SIN_PERDIDA);
    const p = { notas: 3, sinEvaluar: 0, secciones: ["5C" as const] };
    expect(tareaProfeDe(t, undefined, CONTEOS, p).perdida).toEqual(p);
  });

  test("plan: secciones de las entregas, imágenes sin repetir, escrituras", () => {
    const plan = planEliminar([
      entrega({
        tareaId: "a",
        titularId: "g1",
        seccion: "5C",
        respuestas: {
          q1: { imagenPath: "respuestas/a/g1/q1.jpg" },
          q2: { texto: "Hola" },
        },
      }),
      entrega({
        tareaId: "a",
        titularId: "g2",
        respuestas: { q1: { imagenPath: "respuestas/a/g1/q1.jpg" } },
      }),
    ]);
    expect(plan).toEqual({
      secciones: ["5A", "5C"],
      imagenes: ["respuestas/a/g1/q1.jpg"],
      escrituras: 1 + 2 + 2,
    });
    expect(planEliminar([])).toEqual({
      secciones: [],
      imagenes: [],
      escrituras: 1,
    });
  });

  test("una tarea individual de las dos secciones cabe en una transacción", () => {
    const todas = Array.from({ length: 69 }, (_, i) =>
      entrega({
        tareaId: "a",
        titularId: `3900${String(i).padStart(4, "0")}`,
        seccion: i < 35 ? "5A" : "5C",
      }),
    );
    expect(planEliminar(todas).escrituras).toBe(72);
    expect(planEliminar(todas).escrituras).toBeLessThan(MAX_ESCRITURAS_TX);
  });

  test("texto de la confirmación", () => {
    expect(
      eliminarTareaDescripcion({
        notas: 23,
        sinEvaluar: 0,
        secciones: ["5A", "5C"],
      }),
    ).toBe(
      "Se borrarán 23 notas de 5A y 5C. Los puntos del ranking se recalculan. Esto no se puede deshacer.",
    );
    expect(
      eliminarTareaDescripcion({ notas: 1, sinEvaluar: 1, secciones: ["5C"] }),
    ).toBe(
      "Se borrarán 1 nota de 5C y 1 entrega sin evaluar. Los puntos del ranking se recalculan. Esto no se puede deshacer.",
    );
    expect(
      eliminarTareaDescripcion({ notas: 1, sinEvaluar: 0, secciones: ["5A"] }),
    ).toMatch(/^Se borrará 1 nota de 5A\./);
    expect(
      eliminarTareaDescripcion({ notas: 0, sinEvaluar: 4, secciones: [] }),
    ).toBe(
      "Se borrarán 4 entregas sin evaluar. Nadie pierde notas ni puntos. Esto no se puede deshacer.",
    );
    expect(eliminarTareaDescripcion(SIN_PERDIDA)).toMatch(
      /^Todavía no tiene entregas/,
    );
    expect(eliminarTareaDescripcion()).toMatch(/^Se borrarán sus entregas/);
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
      titularIds: ["5a-g1", "5a-g2"],
      nota: 18.5,
      fecha: "2026-11-03",
    });
    const dada = {
      ...base,
      decisionesPremio: { "5A": { tipo: "dar" as const, equipoId: "5a-g2" } },
    };
    expect(estadoPremioSeccion(dada, "5A", EQUIPOS, empate)).toMatchObject({
      tipo: "ganado",
      titularId: "5a-g2",
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
      titularId: "5a-g1",
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

/* ---------- Secciones del catálogo (X5b, D323) ---------- */

describe("conteos por catálogo", () => {
  const equipos = [
    { id: "4b-g1", seccion: "4B" },
    { id: "5a-g1", seccion: "5A" },
    { id: "5a-g2", seccion: "5A" },
    // De una sección que no está en el catálogo: no cuenta
    { id: "7z-g1", seccion: "7Z" },
  ];

  test("una entrada por sección, también la nueva y vacía", () => {
    expect(
      conteosDe(["4B", "5A", "5C"], { "4B": 3, "5A": 35 }, equipos),
    ).toEqual({
      alumnos: { "4B": 3, "5A": 35, "5C": 0 },
      equipos: { "4B": ["4b-g1"], "5A": ["5a-g1", "5a-g2"], "5C": [] },
    });
    expect(conteosDe([], {}, equipos)).toEqual({ alumnos: {}, equipos: {} });
  });

  test("totalTitulares con tres secciones", () => {
    const c = conteosDe(
      ["4B", "5A", "5C"],
      { "4B": 3, "5A": 35, "5C": 34 },
      equipos,
    );
    const ind = {
      ...publicada({
        tipo: "individual",
        premio: null,
        secciones: ["4B", "5A", "5C"],
      }),
    };
    expect(totalTitulares(ind, c)).toBe(72);
    const grupal = publicada({ secciones: ["4B", "5A"] });
    expect(totalTitulares(grupal, c)).toBe(3);
    // Una sección que el catálogo ya no tiene cuenta 0, no rompe
    const huerfana = publicada({ secciones: ["5A", "6F"] });
    expect(totalTitulares(huerfana, c)).toBe(2);
  });
});
