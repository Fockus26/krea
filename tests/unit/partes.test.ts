// Grupal por partes (D416–D424): la lógica pura del reparto, el `sinParte` del envío, el modelo y
// el premarcado de Evaluar.
import { describe, expect, test } from "bun:test";
import { accesoPartes } from "@/lib/acceso";
import { mapasEvaluar, vistaEvaluar } from "@/lib/evaluar-datos";
import { crearIdPublico } from "@/lib/id-publico";
import { type Entrega, type Parte, type Tarea, zEntrega } from "@/lib/modelo";
import {
  aceptadasParaReenviar,
  aplicarParte,
  avisoSinParteTexto,
  bloqueoTexto,
  faltaAceptarTexto,
  huellaDePartes,
  huellaPartes,
  partesDeIntegrante,
  permisoParte,
  repartoCapitan,
  repartoParaEnviar,
  rutaVersionPartes,
  sinParteAlEnviar,
  sinParteDe,
} from "@/lib/partes";
import {
  bloqueosEdicion,
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

  test("tomar (D461): solo el capitán y solo una asignada o devuelta; conserva lo entregado", () => {
    expect(aplicar(parte(), { tipo: "tomar" })).toEqual({
      ok: true,
      parte: parte({ estado: "tomada", actualizadoEn: 9 }),
      sinUso: [],
    });
    const devuelta = parte({ estado: "devuelta", respuesta: { texto: "a" } });
    expect(aplicar(devuelta, { tipo: "tomar" })).toMatchObject({
      ok: true,
      parte: { estado: "tomada", asignado: ADELA, respuesta: { texto: "a" } },
    });
    for (const estado of ["entregada", "aceptada", "tomada"] as const)
      expect(aplicar(parte({ estado }), { tipo: "tomar" })).toEqual({
        ok: false,
        error: "estado",
      });
    expect(aplicar(null, { tipo: "tomar" })).toEqual({
      ok: false,
      error: "estado",
    });
    expect(
      aplicar(parte(), { tipo: "tomar" }, { cedula: ADELA, capitan: false }),
    ).toEqual({ ok: false, error: "no-capitan" });
  });

  test("tomada: el integrante ya no entrega; asignarla al mismo se la devuelve; a otro, como siempre", () => {
    const adela = { cedula: ADELA, capitan: false };
    const tomada = parte({ estado: "tomada", respuesta: { texto: "a" } });
    expect(
      aplicar(tomada, { tipo: "entregar", respuesta: { texto: "x" } }, adela),
    ).toEqual({ ok: false, error: "no-asignada" });
    expect(aplicar(tomada, { tipo: "asignar", asignado: ADELA })).toEqual({
      ok: true,
      parte: { ...tomada, estado: "devuelta", actualizadoEn: 9 },
      sinUso: [],
    });
    expect(
      aplicar(parte({ estado: "tomada" }), {
        tipo: "asignar",
        asignado: ADELA,
      }),
    ).toMatchObject({ ok: true, parte: { estado: "asignada" } });
    expect(aplicar(tomada, { tipo: "asignar", asignado: LUIS })).toEqual({
      ok: true,
      parte: parte({ asignado: LUIS, actualizadoEn: 9 }),
      sinUso: [],
    });
    expect(aplicar(tomada, { tipo: "asignar", asignado: null })).toEqual({
      ok: true,
      parte: null,
      sinUso: [],
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

  test("tomada (D461): no cuenta como entregada; si entregó otra, no queda marcado", () => {
    expect(sinParteDe([p(ADELA, "tomada")], MIEMBROS, CAP)).toEqual([ADELA]);
    expect(
      sinParteDe([p(ADELA, "tomada"), p(ADELA, "aceptada")], MIEMBROS, CAP),
    ).toEqual([]);
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

describe("sinParteAlEnviar: solo el reparto vigente (D534)", () => {
  const p = (asignado: string, estado: Parte["estado"]) => ({
    asignado,
    estado,
  });
  const envio = (integrantes: readonly string[], miembros = MIEMBROS) => ({
    integrantes,
    miembros,
    capitanId: CAP,
    enviadaPor: CAP,
  });

  test("en los casos de hoy (integrantes = equipo actual) da lo mismo que `sinParteDe`", () => {
    const casos = [
      [],
      [p(ADELA, "tomada")],
      [p(ADELA, "tomada"), p(ADELA, "aceptada")],
      [p(ADELA, "entregada"), p(ADELA, "asignada"), p(LUIS, "devuelta")],
      [p(ADELA, "aceptada")],
      [p(CAP, "asignada")],
      [p("39999999", "asignada")],
    ];
    for (const partes of casos) {
      expect(sinParteAlEnviar(partes, envio(MIEMBROS))).toEqual(
        sinParteDe(partes, MIEMBROS, CAP),
      );
      // Luis ya está en otra entrega: no recibe esta nota (D221)
      expect(sinParteAlEnviar(partes, envio([CAP, ADELA]))).toEqual(
        sinParteDe(partes, [CAP, ADELA], CAP),
      );
    }
  });

  test("la parte de alguien que ya no es del equipo no lo marca, aunque siga en `integrantes`", () => {
    const partes = [p(LUIS, "asignada"), p(ADELA, "asignada")];
    // Luis se fue del equipo: su parte ya no es vigente (D421)
    const sinLuis = [CAP, ADELA];
    expect(sinParteDe(partes, MIEMBROS, CAP)).toEqual([ADELA, LUIS]);
    expect(sinParteAlEnviar(partes, envio(MIEMBROS, sinLuis))).toEqual([ADELA]);
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

  test("tomada (D461): deja de ser del integrante, con aviso; la de otro también la responde el capitán", () => {
    const conTomadas = [
      parte({ estado: "tomada", respuesta: { texto: "Vieja" } }),
      parte({ preguntaId: "p2", asignado: LUIS, estado: "tomada" }),
    ];
    // Todas las suyas tomadas: sigue viendo el reparto (como lector, con el aviso)
    expect(
      partesDeIntegrante(preguntas, conTomadas, MIEMBROS, CAP, ADELA),
    ).toEqual([
      { mia: false, asignado: null, tomada: true },
      { mia: false, asignado: null },
      { mia: false, asignado: null },
    ]);
  });

  test("al enviar (D463): lo aceptado entra desde el reparto; lo pendiente frena; tomada y sin asignar no", () => {
    const qs = [{ id: "p1" }, { id: "p2" }, { id: "p3" }];
    const aceptada = parte({
      estado: "aceptada",
      respuesta: { texto: "De Adela" },
    });
    const tomada = parte({
      preguntaId: "p2",
      asignado: LUIS,
      estado: "tomada",
    });
    expect(repartoParaEnviar(qs, [aceptada, tomada], MIEMBROS, CAP)).toEqual({
      ok: true,
      respuestas: { p1: { texto: "De Adela" } },
    });
    for (const estado of ["asignada", "entregada", "devuelta"] as const)
      expect(
        repartoParaEnviar(
          qs,
          [aceptada, parte({ preguntaId: "p3", asignado: LUIS, estado })],
          MIEMBROS,
          CAP,
        ),
      ).toEqual({ ok: false });
    // Aceptada sin respuesta (no debería pasar): pendiente
    expect(
      repartoParaEnviar(qs, [parte({ estado: "aceptada" })], MIEMBROS, CAP),
    ).toEqual({ ok: false });
    // De alguien que ya no está (D421) o de una pregunta que ya no existe: no cuenta
    expect(
      repartoParaEnviar(
        qs,
        [
          parte({ asignado: "39999999" }),
          parte({ preguntaId: "borrada", estado: "asignada" }),
        ],
        MIEMBROS,
        CAP,
      ),
    ).toEqual({ ok: true, respuestas: {} });
  });

  test("huella del reparto (D465): cantidad, último cambio y envío", () => {
    expect(huellaDePartes([])).toBe("0.0.0");
    expect(huellaDePartes(partes)).toBe("2.5.0");
    expect(huellaPartes({ filas: 2, maxActualizado: 5, enviadaEn: null })).toBe(
      huellaDePartes(partes),
    );
    expect(huellaPartes({ filas: 2, maxActualizado: 5, enviadaEn: 7 })).toBe(
      "2.5.7",
    );
    expect(rutaVersionPartes("t1", null)).toBe("/api/partes/version?tarea=t1");
    expect(rutaVersionPartes("t1", "2.5.0")).toBe(
      "/api/partes/version?tarea=t1&desde=2.5.0",
    );
  });

  test("la ruta en vivo (D465): solo un alumno con equipo y sin contraseña temporal", () => {
    const alumno = {
      uid: ADELA,
      rol: "estudiante" as const,
      seccion: "5A" as const,
      equipoId: "eq",
    };
    expect(accesoPartes(alumno)).toBe("ok");
    expect(accesoPartes(null)).toBe("sin-sesion");
    expect(accesoPartes({ ...alumno, debeCambiarPassword: true })).toBe(
      "sin-sesion",
    );
    expect(accesoPartes({ ...alumno, equipoId: null })).toBe("prohibido");
    expect(accesoPartes({ ...alumno, rol: "profesor" })).toBe("prohibido");
  });

  test("copy del capitán (D462): candado por estado y lo que falta aceptar", () => {
    expect(bloqueoTexto("asignada", "Adela")).toBe(
      "Asignada a Adela: aún no te la entrega.",
    );
    expect(bloqueoTexto("aceptada", "Adela")).toBe(
      "Aceptada: es la respuesta de Adela.",
    );
    expect(faltaAceptarTexto([])).toBeNull();
    expect(faltaAceptarTexto([{ numero: 2, nombre: "Adela" }])).toBe(
      "Falta aceptar la pregunta 2 (Adela)",
    );
    expect(
      faltaAceptarTexto([
        { numero: 1, nombre: "Adela" },
        { numero: 2, nombre: "Luis" },
        { numero: 4, nombre: "Eva" },
      ]),
    ).toBe("Falta aceptar las preguntas 1 (Adela), 2 (Luis) y 4 (Eva)");
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
  const ID = crearIdPublico("secreto-de-prueba-reparto");
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
    idDe: ID,
  });
  const urls = new Map([["entregas/t1/c/l.jpg", "https://firmada/l"]]);

  test("capitán: panel y lo de otros en solo lectura, con su candado por estado (D462)", () => {
    const e = entrada(
      { ...cabecera, estado: "responder", autor: "Carla" },
      CAP,
    );
    expect(rutasReparto(e)).toEqual(["entregas/t1/c/l.jpg"]);
    const r = repartoVista({ ...e, urls });
    expect(r?.modo).toBe("capitan");
    if (r?.modo !== "capitan") return;
    // Cada integrante va por su id público, nunca por su cédula (D495)
    expect(r.integrantes.map((m) => m.id)).toEqual([ID(ADELA), ID(LUIS)]);
    expect(r.filas.map((f) => [f.asignado, f.nombre, f.estado])).toEqual([
      [ID(ADELA), "Adela Pérez", "aceptada"],
      [ID(LUIS), "Luis Pérez", "entregada"],
    ]);
    const json = JSON.stringify(r);
    for (const c of [ADELA, LUIS]) expect(json).not.toContain(c);
    expect(r.filas[1]?.respuesta).toMatchObject({
      tipo: "imagen",
      src: "https://firmada/l",
    });
    // Lo aceptado ya no precarga un campo: va en solo lectura y entra desde el servidor (D463)
    expect(r.inicial).toEqual({});
    expect(r.bloqueos.p1).toEqual({
      texto: "Aceptada: es la respuesta de Adela Pérez.",
      respuesta: { tipo: "texto", texto: "Hecha" },
      aceptada: true,
      nombre: "Adela Pérez",
      tomable: false,
    });
    expect(r.bloqueos.p2).toMatchObject({
      texto: "Luis Pérez te la entregó: acéptala o devuélvela en Reparto.",
      respuesta: { tipo: "imagen", src: "https://firmada/l" },
      aceptada: false,
      tomable: false,
    });
    // Los dos entregaron algo: nadie queda marcado
    expect(r.aviso).toBeNull();
  });

  test("capitán: asignada y devuelta se pueden tomar; la tomada se abre precargada (D461)", () => {
    const e = entrada(
      { ...cabecera, estado: "responder", autor: "Carla" },
      CAP,
    );
    const r = repartoVista({
      ...e,
      partes: [
        parte({ estado: "tomada", respuesta: { texto: "De Adela" } }),
        parte({ preguntaId: "p2", asignado: LUIS, estado: "asignada" }),
      ],
      urls,
    });
    if (r?.modo !== "capitan") throw new Error("capitán");
    expect(Object.keys(r.bloqueos)).toEqual(["p2"]);
    expect(r.bloqueos.p2).toMatchObject({
      respuesta: null,
      aceptada: false,
      tomable: true,
    });
    expect(r.inicial).toEqual({ p1: "De Adela" });
    expect(r.aviso).toBe(
      "Adela Pérez y Luis Pérez quedarán como “No participó”: tenían preguntas y no entregaron ninguna.",
    );
  });

  test("integrante: la tomada lleva el aviso del capitán (D461)", () => {
    const e = entrada({ ...cabecera, estado: "lector", capitan: null }, ADELA);
    const r = repartoVista({
      ...e,
      partes: [parte({ estado: "tomada" })],
      urls,
    });
    expect(r).toEqual({
      modo: "integrante",
      capitan: "Carla",
      partes: [
        {
          mia: false,
          bloqueadaPor: "Carla",
          aviso: "Carla decidió responder esta pregunta.",
        },
        { mia: false, bloqueadaPor: "Carla" },
      ],
    });
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

describe("editar una grupal ya enviada (D508)", () => {
  const qs = [{ id: "p1" }, { id: "p2" }, { id: "p3" }];
  const persona = (cedula: string, nombres: string) => ({
    cedula,
    nombres,
    apellidos: "Pérez",
    avatar: { estilo: "fun-emoji", semilla: cedula },
  });
  const companeros = [persona(CAP, "Carla"), persona(ADELA, "Adela")];
  const partes = [
    parte({ estado: "aceptada", respuesta: { texto: "De Adela" } }),
    parte({
      preguntaId: "p2",
      asignado: LUIS,
      estado: "aceptada",
      respuesta: { imagenPath: "entregas/t1/c/l.jpg" },
    }),
    parte({ preguntaId: "p3", asignado: LUIS, estado: "tomada" }),
  ];

  test("lo aceptado vuelve desde el reparto; tomada, pendiente o de quien no está en la entrega, no", () => {
    expect(aceptadasParaReenviar(qs, partes, MIEMBROS, CAP)).toEqual({
      p1: { texto: "De Adela" },
      p2: { imagenPath: "entregas/t1/c/l.jpg" },
    });
    // Sin aceptar no frena (ya salió): solo no se impone
    expect(
      aceptadasParaReenviar(
        qs,
        [parte({ estado: "devuelta", respuesta: { texto: "Vieja" } })],
        MIEMBROS,
        CAP,
      ),
    ).toEqual({});
    // Luis no está entre los integrantes de la entrega (D396); Adela pasó a capitana
    expect(aceptadasParaReenviar(qs, partes, [CAP, ADELA], ADELA)).toEqual({});
  });

  test("el formulario de edición deja en solo lectura lo aceptado, con lo que entregó", () => {
    const b = bloqueosEdicion({
      preguntas: qs,
      partes,
      integrantes: MIEMBROS,
      capitanId: CAP,
      companeros,
      urls: new Map([["entregas/t1/c/l.jpg", "https://firmada/l"]]),
    });
    expect(Object.keys(b)).toEqual(["p1", "p2"]);
    expect(b.p1).toEqual({
      texto: "Aceptada: es la respuesta de Adela Pérez.",
      respuesta: { tipo: "texto", texto: "De Adela" },
      aceptada: true,
      nombre: "Adela Pérez",
      tomable: false,
    });
    // Luis ya no está en el equipo, pero sí en la entrega: su parte sigue suya, sin nombre
    expect(b.p2).toMatchObject({
      texto: "Aceptada: es la respuesta de Alguien del equipo.",
      respuesta: { tipo: "imagen", src: "https://firmada/l" },
      tomable: false,
    });
  });
});
