// Grupal por partes (D416–D424): la lógica pura del reparto, el `sinParte` del envío, el modelo y
// el premarcado de Evaluar.
import { describe, expect, test } from "bun:test";
import { mapasEvaluar, vistaEvaluar } from "@/lib/evaluar-datos";
import { type Entrega, type Parte, type Tarea, zEntrega } from "@/lib/modelo";
import {
  aceptadas,
  aplicarParte,
  avisoSinParteTexto,
  partesDeIntegrante,
  permisoParte,
  repartoCapitan,
  sinParteDe,
} from "@/lib/partes";
import {
  type EntregaVista,
  repartoVista,
  rutasReparto,
} from "@/lib/vistas-estudiante";

const CAP = "30000001";
const ADELA = "30000002";
const LUIS = "30000003";
const MIEMBROS = [CAP, ADELA, LUIS];
const CLAVE = {
  entregaId: "t1__eq",
  preguntaId: "p1",
  tareaId: "t1",
  equipoId: "eq",
};

const parte = (o: Partial<Parte> = {}): Parte => ({
  ...CLAVE,
  asignado: ADELA,
  estado: "asignada",
  respuesta: null,
  entregadaEn: null,
  actualizadoEn: 1,
  ...o,
});

const aplicar = (
  actual: Parte | null,
  accion: Parameters<typeof aplicarParte>[0]["accion"],
  quien = { cedula: CAP, capitan: true },
) =>
  aplicarParte({
    actual,
    accion,
    quien,
    miembros: MIEMBROS,
    capitanId: CAP,
    clave: CLAVE,
    ahora: 9,
  });

describe("permisoParte", () => {
  const tarea: Pick<Tarea, "tipo" | "estado" | "secciones" | "fechaEntrega"> = {
    tipo: "grupal",
    estado: "abierta",
    secciones: ["5A"],
    fechaEntrega: "2026-11-20",
  };
  // Antes de vencer: abierta (D451); vencida, cerrada como cerrada a mano
  const AHORA = Date.UTC(2026, 10, 19, 15);
  const equipo = { id: "eq", seccion: "5A", capitanId: CAP } as const;
  const u = (cedula: string) => ({
    cedula,
    rol: "estudiante" as const,
    seccion: "5A",
    equipoId: "eq",
  });

  test("capitán e integrante pasan; individual y otro equipo, no", () => {
    expect(permisoParte(u(CAP), tarea, "t1", equipo, AHORA)).toMatchObject({
      ok: true,
      permiso: { entregaId: "t1__eq", equipoId: "eq", capitan: true },
    });
    expect(permisoParte(u(ADELA), tarea, "t1", equipo, AHORA)).toMatchObject({
      ok: true,
      permiso: { entregaId: "t1__eq", capitan: false },
    });
    expect(
      permisoParte(
        u(ADELA),
        { ...tarea, tipo: "individual" },
        "t1",
        equipo,
        AHORA,
      ),
    ).toEqual({ ok: false, error: "no-existe" });
    expect(
      permisoParte(
        { ...u(ADELA), equipoId: "otro" },
        tarea,
        "t1",
        equipo,
        AHORA,
      ),
    ).toEqual({ ok: false, error: "sin-equipo" });
    expect(
      permisoParte(
        u(ADELA),
        { ...tarea, estado: "evaluada" },
        "t1",
        equipo,
        AHORA,
      ),
    ).toEqual({ ok: false, error: "cerrada" });
  });

  test("vencida, cerrada para el reparto; con prórroga del equipo, abierta (D451, D452)", () => {
    const despues = Date.UTC(2026, 10, 21, 15);
    expect(permisoParte(u(ADELA), tarea, "t1", equipo, despues)).toEqual({
      ok: false,
      error: "cerrada",
    });
    const conProrroga = {
      ...tarea,
      prorrogas: { eq: { fecha: "2026-11-23", hora: null } },
    };
    expect(
      permisoParte(u(ADELA), conProrroga, "t1", equipo, despues),
    ).toMatchObject({ ok: true, permiso: { capitan: false } });
  });
});

describe("aplicarParte (D417)", () => {
  test("asignar crea la parte; al mismo no cambia nada; reasignar descarta la respuesta", () => {
    expect(aplicar(null, { tipo: "asignar", asignado: ADELA })).toEqual({
      ok: true,
      parte: parte({ actualizadoEn: 9 }),
      sinUso: [],
    });
    const conImagen = parte({
      estado: "entregada",
      respuesta: { imagenPath: "entregas/t1/c/a.jpg" },
    });
    expect(aplicar(conImagen, { tipo: "asignar", asignado: ADELA })).toEqual({
      ok: true,
      parte: conImagen,
      sinUso: [],
    });
    expect(aplicar(conImagen, { tipo: "asignar", asignado: LUIS })).toEqual({
      ok: true,
      parte: parte({ asignado: LUIS, actualizadoEn: 9 }),
      sinUso: ["entregas/t1/c/a.jpg"],
    });
    expect(aplicar(conImagen, { tipo: "asignar", asignado: null })).toEqual({
      ok: true,
      parte: null,
      sinUso: ["entregas/t1/c/a.jpg"],
    });
  });

  test("solo a integrantes que no son el capitán; solo el capitán reparte", () => {
    expect(aplicar(null, { tipo: "asignar", asignado: "39999999" })).toEqual({
      ok: false,
      error: "integrante",
    });
    expect(aplicar(null, { tipo: "asignar", asignado: CAP })).toEqual({
      ok: false,
      error: "integrante",
    });
    expect(
      aplicar(
        null,
        { tipo: "asignar", asignado: LUIS },
        {
          cedula: ADELA,
          capitan: false,
        },
      ),
    ).toEqual({ ok: false, error: "no-capitan" });
  });

  test("entregar: solo el asignado y mientras no esté aceptada; la imagen vieja queda sin uso", () => {
    const adela = { cedula: ADELA, capitan: false };
    const r = aplicar(
      parte({ estado: "devuelta", respuesta: { imagenPath: "vieja.jpg" } }),
      { tipo: "entregar", respuesta: { imagenPath: "nueva.jpg" } },
      adela,
    );
    expect(r).toEqual({
      ok: true,
      parte: parte({
        estado: "entregada",
        respuesta: { imagenPath: "nueva.jpg" },
        entregadaEn: 9,
        actualizadoEn: 9,
      }),
      sinUso: ["vieja.jpg"],
    });
    expect(
      aplicar(
        parte(),
        { tipo: "entregar", respuesta: { texto: "x" } },
        {
          cedula: LUIS,
          capitan: false,
        },
      ),
    ).toEqual({ ok: false, error: "no-asignada" });
    expect(
      aplicar(
        parte({ estado: "aceptada" }),
        { tipo: "entregar", respuesta: { texto: "x" } },
        adela,
      ),
    ).toEqual({ ok: false, error: "estado" });
  });

  test("aceptar solo una entregada; devolver una entregada o aceptada", () => {
    expect(aplicar(parte(), { tipo: "aceptar" })).toEqual({
      ok: false,
      error: "estado",
    });
    const entregada = parte({ estado: "entregada", respuesta: { texto: "a" } });
    expect(aplicar(entregada, { tipo: "aceptar" })).toMatchObject({
      ok: true,
      parte: { estado: "aceptada", respuesta: { texto: "a" } },
    });
    expect(
      aplicar(parte({ estado: "aceptada" }), { tipo: "devolver" }),
    ).toMatchObject({ ok: true, parte: { estado: "devuelta" } });
    expect(aplicar(parte(), { tipo: "devolver" })).toEqual({
      ok: false,
      error: "estado",
    });
  });

  test("una parte de alguien que ya no está en el equipo cuenta como sin asignar (D421)", () => {
    const deOtro = parte({ asignado: "39999999", estado: "entregada" });
    expect(aplicar(deOtro, { tipo: "aceptar" })).toEqual({
      ok: false,
      error: "estado",
    });
    expect(repartoCapitan([{ id: "p1" }], [deOtro], MIEMBROS, CAP)).toEqual([
      { preguntaId: "p1", asignado: null, estado: null, respuesta: null },
    ]);
  });
});

describe("sinParteDe (D420)", () => {
  const p = (asignado: string, estado: Parte["estado"]) => ({
    asignado,
    estado,
  });

  test("tenía pregunta y no entregó ninguna; la entregada sin aceptar cuenta", () => {
    expect(
      sinParteDe(
        [p(ADELA, "entregada"), p(ADELA, "asignada"), p(LUIS, "devuelta")],
        MIEMBROS,
        CAP,
      ),
    ).toEqual([LUIS]);
  });

  test("sin reparto o sin pregunta: nadie; quien envía nunca", () => {
    expect(sinParteDe([], MIEMBROS, CAP)).toEqual([]);
    expect(sinParteDe([p(ADELA, "aceptada")], MIEMBROS, CAP)).toEqual([]);
    expect(sinParteDe([p(CAP, "asignada")], MIEMBROS, CAP)).toEqual([]);
    // Fuera de los integrantes de la entrega, no cuenta
    expect(sinParteDe([p("39999999", "asignada")], MIEMBROS, CAP)).toEqual([]);
  });
});

describe("vistas del reparto", () => {
  const preguntas = [{ id: "p1" }, { id: "p2" }, { id: "p3" }];
  const partes = [
    parte({
      estado: "aceptada",
      respuesta: { texto: "Hecha" },
      actualizadoEn: 5,
    }),
    parte({
      preguntaId: "p2",
      asignado: LUIS,
      estado: "entregada",
      respuesta: { texto: "De Luis" },
    }),
  ];

  test("el integrante ve solo su respuesta; sin preguntas, null", () => {
    expect(partesDeIntegrante(preguntas, partes, MIEMBROS, CAP, ADELA)).toEqual(
      [
        {
          mia: true,
          estado: "aceptada",
          respuesta: { tipo: "texto", texto: "Hecha" },
        },
        { mia: false, asignado: LUIS },
        { mia: false, asignado: null },
      ],
    );
    expect(partesDeIntegrante(preguntas, [], MIEMBROS, CAP, ADELA)).toBeNull();
  });

  test("lo aceptado precarga al capitán, con la versión para remontar el formulario", () => {
    expect(aceptadas(partes, MIEMBROS, CAP)).toEqual({
      respuestas: { p1: { tipo: "texto", texto: "Hecha" } },
      version: 5,
    });
  });

  test("aviso al entregar: singular, plural y nadie", () => {
    expect(avisoSinParteTexto([])).toBeNull();
    expect(avisoSinParteTexto(["Adela"])).toBe(
      "Adela quedará como “No participó”: tenía preguntas y no entregó ninguna.",
    );
    expect(avisoSinParteTexto(["Adela", "Luis", "Eva"])).toBe(
      "Adela, Luis y Eva quedarán como “No participó”: tenían preguntas y no entregaron ninguna.",
    );
  });
});

describe("zEntrega.sinParte", () => {
  const grupal: Entrega = {
    tareaId: "t1",
    tipo: "grupal",
    titularId: "eq",
    seccion: "5A",
    integrantes: [CAP, ADELA],
    estado: "entregada",
    respuestas: {},
    enviadaPor: CAP,
    enviadaEn: 1,
    evaluacion: null,
  };

  test("opcional; solo en grupales y entre sus integrantes", () => {
    expect(zEntrega.safeParse(grupal).success).toBe(true);
    expect(zEntrega.safeParse({ ...grupal, sinParte: [ADELA] }).success).toBe(
      true,
    );
    expect(zEntrega.safeParse({ ...grupal, sinParte: [LUIS] }).success).toBe(
      false,
    );
    expect(
      zEntrega.safeParse({
        ...grupal,
        tipo: "individual",
        titularId: CAP,
        integrantes: [CAP],
        sinParte: [CAP],
      }).success,
    ).toBe(false);
  });
});

describe("vistaEvaluar con reparto (D420)", () => {
  const tarea: { id: string } & Tarea = {
    id: "t1",
    titulo: "Identidad de marca",
    tipo: "grupal",
    secciones: ["5A"],
    estado: "abierta",
    fechaEntrega: "2026-11-14",
    premio: null,
    preguntas: [{ id: "p1", enunciado: "Uno", formato: "texto", valor: 20 }],
    importada: false,
    autorId: null,
    actualizadoEn: 1,
  };
  const mapas = mapasEvaluar({ usuarios: [], equipos: [], tareas: [tarea] });
  const entrega = (o: Partial<Entrega> = {}): { id: string } & Entrega => ({
    id: "t1__eq",
    tareaId: "t1",
    tipo: "grupal",
    titularId: "eq",
    seccion: "5A",
    integrantes: [CAP, ADELA, LUIS],
    estado: "entregada",
    respuestas: { p1: { texto: "Hola" } },
    enviadaPor: CAP,
    enviadaEn: 1,
    evaluacion: null,
    sinParte: [LUIS],
    ...o,
  });

  test("sin evaluación: premarcado y el motivo por integrante", () => {
    const v = vistaEvaluar({ entrega: entrega(), tarea, cola: [], mapas });
    expect(v.inicial.noParticiparon).toEqual([LUIS]);
    expect(v.integrantes.map((m) => m.sinParte ?? false)).toEqual([
      false,
      false,
      true,
    ]);
  });

  test("evaluada: manda la evaluación (el profe lo desmarcó)", () => {
    const v = vistaEvaluar({
      entrega: entrega({
        estado: "evaluada",
        evaluacion: {
          puntos: { p1: 18 },
          comentarios: {},
          puntaje: 18,
          evaluadaPor: null,
          evaluadaEn: 2,
        },
      }),
      tarea,
      cola: [],
      mapas,
    });
    expect(v.inicial.noParticiparon).toEqual([]);
    expect(v.integrantes[2]?.sinParte).toBe(true);
  });

  test("sin reparto: nadie premarcado ni con motivo", () => {
    const v = vistaEvaluar({
      entrega: entrega({ sinParte: undefined }),
      tarea,
      cola: [],
      mapas,
    });
    expect(v.inicial.noParticiparon).toEqual([]);
    expect(v.integrantes.every((m) => !("sinParte" in m))).toBe(true);
  });
});

describe("repartoVista (D422)", () => {
  const cabecera = {
    tipo: "grupal" as const,
    eyebrow: "Grupal · Equipo",
    titulo: "Prueba",
    vence: "Vence 20/11/2026",
    puntos: "20 pts · 2 preguntas",
    premio: null,
    premioFoto: null,
    preguntas: [
      { id: "p1", enunciado: "Uno", formato: "texto" as const, valor: 10 },
      { id: "p2", enunciado: "Dos", formato: "imagen" as const, valor: 10 },
    ],
  };
  const persona = (cedula: string, nombres: string) => ({
    cedula,
    nombres,
    apellidos: "Pérez",
    avatar: { estilo: "fun-emoji", semilla: cedula },
  });
  const companeros = [
    persona(CAP, "Carla"),
    persona(ADELA, "Adela"),
    persona(LUIS, "Luis"),
  ];
  const partes = [
    parte({
      estado: "aceptada",
      respuesta: { texto: "Hecha" },
      actualizadoEn: 7,
    }),
    parte({
      preguntaId: "p2",
      asignado: LUIS,
      estado: "entregada",
      respuesta: { imagenPath: "entregas/t1/c/l.jpg" },
    }),
  ];
  const entrada = (vista: EntregaVista, cedula: string) => ({
    vista,
    usuario: {
      cedula,
      nombres: companeros.find((c) => c.cedula === cedula)?.nombres ?? "",
    },
    equipo: { capitanId: CAP },
    companeros,
    partes,
  });
  const urls = new Map([["entregas/t1/c/l.jpg", "https://firmada/l"]]);

  test("capitán: panel, lo aceptado precargado y la versión", () => {
    const e = entrada(
      { ...cabecera, estado: "responder", autor: "Carla" },
      CAP,
    );
    expect(rutasReparto(e)).toEqual(["entregas/t1/c/l.jpg"]);
    const r = repartoVista({ ...e, urls });
    expect(r?.modo).toBe("capitan");
    if (r?.modo !== "capitan") return;
    expect(r.integrantes.map((m) => m.cedula)).toEqual([ADELA, LUIS]);
    expect(r.filas.map((f) => [f.asignado, f.estado])).toEqual([
      [ADELA, "aceptada"],
      [LUIS, "entregada"],
    ]);
    expect(r.filas[1]?.respuesta).toMatchObject({
      tipo: "imagen",
      src: "https://firmada/l",
    });
    expect(r.inicial).toEqual({ p1: "Hecha" });
    expect(r.prioridad).toEqual(["p1"]);
    expect(r.version).toBe(7);
    // Los dos entregaron algo: nadie queda marcado
    expect(r.aviso).toBeNull();
  });

  test("integrante: solo su parte y su imagen; la otra, bloqueada con el nombre de quien la tiene", () => {
    const e = entrada({ ...cabecera, estado: "lector", capitan: null }, ADELA);
    expect(rutasReparto(e)).toEqual([]);
    const r = repartoVista({ ...e, urls });
    expect(r).toEqual({
      modo: "integrante",
      capitan: "Carla",
      partes: [
        {
          mia: true,
          estado: "aceptada",
          inicial: "Hecha",
          respuesta: { tipo: "texto", texto: "Hecha" },
        },
        { mia: false, bloqueadaPor: "Luis" },
      ],
    });
  });

  test("sin preguntas asignadas o con la tarea entregada: nada", () => {
    const e = entrada({ ...cabecera, estado: "lector", capitan: null }, ADELA);
    expect(repartoVista({ ...e, partes: [], urls })).toBeNull();
    expect(
      repartoVista({
        ...entrada({ ...cabecera, estado: "cerrada" }, CAP),
        urls,
      }),
    ).toBeNull();
  });
});
