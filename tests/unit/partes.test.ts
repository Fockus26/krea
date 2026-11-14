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

const CAP = "30000001";
const ANA = "30000002";
const LUIS = "30000003";
const MIEMBROS = [CAP, ANA, LUIS];
const CLAVE = {
  entregaId: "t1__eq",
  preguntaId: "p1",
  tareaId: "t1",
  equipoId: "eq",
};

const parte = (o: Partial<Parte> = {}): Parte => ({
  ...CLAVE,
  asignado: ANA,
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
  const tarea = {
    tipo: "grupal",
    estado: "abierta",
    secciones: ["5A"],
  } as const;
  const equipo = { id: "eq", seccion: "5A", capitanId: CAP } as const;
  const u = (cedula: string) => ({
    cedula,
    rol: "estudiante" as const,
    seccion: "5A",
    equipoId: "eq",
  });

  test("capitán e integrante pasan; individual y otro equipo, no", () => {
    expect(permisoParte(u(CAP), tarea, "t1", equipo)).toMatchObject({
      ok: true,
      permiso: { entregaId: "t1__eq", equipoId: "eq", capitan: true },
    });
    expect(permisoParte(u(ANA), tarea, "t1", equipo)).toMatchObject({
      ok: true,
      permiso: { entregaId: "t1__eq", capitan: false },
    });
    expect(
      permisoParte(u(ANA), { ...tarea, tipo: "individual" }, "t1", equipo),
    ).toEqual({ ok: false, error: "no-existe" });
    expect(
      permisoParte({ ...u(ANA), equipoId: "otro" }, tarea, "t1", equipo),
    ).toEqual({ ok: false, error: "sin-equipo" });
    expect(
      permisoParte(u(ANA), { ...tarea, estado: "evaluada" }, "t1", equipo),
    ).toEqual({ ok: false, error: "cerrada" });
  });
});

describe("aplicarParte (D417)", () => {
  test("asignar crea la parte; al mismo no cambia nada; reasignar descarta la respuesta", () => {
    expect(aplicar(null, { tipo: "asignar", asignado: ANA })).toEqual({
      ok: true,
      parte: parte({ actualizadoEn: 9 }),
      sinUso: [],
    });
    const conImagen = parte({
      estado: "entregada",
      respuesta: { imagenPath: "entregas/t1/c/a.jpg" },
    });
    expect(aplicar(conImagen, { tipo: "asignar", asignado: ANA })).toEqual({
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
          cedula: ANA,
          capitan: false,
        },
      ),
    ).toEqual({ ok: false, error: "no-capitan" });
  });

  test("entregar: solo el asignado y mientras no esté aceptada; la imagen vieja queda sin uso", () => {
    const ana = { cedula: ANA, capitan: false };
    const r = aplicar(
      parte({ estado: "devuelta", respuesta: { imagenPath: "vieja.jpg" } }),
      { tipo: "entregar", respuesta: { imagenPath: "nueva.jpg" } },
      ana,
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
        ana,
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
        [p(ANA, "entregada"), p(ANA, "asignada"), p(LUIS, "devuelta")],
        MIEMBROS,
        CAP,
      ),
    ).toEqual([LUIS]);
  });

  test("sin reparto o sin pregunta: nadie; quien envía nunca", () => {
    expect(sinParteDe([], MIEMBROS, CAP)).toEqual([]);
    expect(sinParteDe([p(ANA, "aceptada")], MIEMBROS, CAP)).toEqual([]);
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
    expect(partesDeIntegrante(preguntas, partes, MIEMBROS, CAP, ANA)).toEqual([
      {
        mia: true,
        estado: "aceptada",
        respuesta: { tipo: "texto", texto: "Hecha" },
      },
      { mia: false, asignado: LUIS },
      { mia: false, asignado: null },
    ]);
    expect(partesDeIntegrante(preguntas, [], MIEMBROS, CAP, ANA)).toBeNull();
  });

  test("lo aceptado precarga al capitán, con la versión para remontar el formulario", () => {
    expect(aceptadas(partes, MIEMBROS, CAP)).toEqual({
      respuestas: { p1: { tipo: "texto", texto: "Hecha" } },
      version: 5,
    });
  });

  test("aviso al entregar: singular, plural y nadie", () => {
    expect(avisoSinParteTexto([])).toBeNull();
    expect(avisoSinParteTexto(["Ana"])).toBe(
      "Ana quedará como “No participó”: tenía preguntas y no entregó ninguna.",
    );
    expect(avisoSinParteTexto(["Ana", "Luis", "Eva"])).toBe(
      "Ana, Luis y Eva quedarán como “No participó”: tenían preguntas y no entregaron ninguna.",
    );
  });
});

describe("zEntrega.sinParte", () => {
  const grupal: Entrega = {
    tareaId: "t1",
    tipo: "grupal",
    titularId: "eq",
    seccion: "5A",
    integrantes: [CAP, ANA],
    estado: "entregada",
    respuestas: {},
    enviadaPor: CAP,
    enviadaEn: 1,
    evaluacion: null,
  };

  test("opcional; solo en grupales y entre sus integrantes", () => {
    expect(zEntrega.safeParse(grupal).success).toBe(true);
    expect(zEntrega.safeParse({ ...grupal, sinParte: [ANA] }).success).toBe(
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
    integrantes: [CAP, ANA, LUIS],
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
