// W11 (D263–D266): premio en tareas individuales, decisión «darAlumno», «Crear premio» y foto.
import { describe, expect, test } from "bun:test";
import {
  claveFotoPremio,
  FOTO_PREMIO_MAX_BYTES,
  validarFotoPremio,
} from "@/lib/almacen/imagen";
import { ganadoresPremio, notasPremioIndividual } from "@/lib/equipo";
import {
  type Entrega,
  idDeDecision,
  type Tarea,
  zDecisionPremio,
  zTarea,
  zTareaDoc,
} from "@/lib/modelo";
import {
  avancePremioTexto,
  decisionDar,
  mensajeErrorPremio,
  premioParaTexto,
  resolverEmpate,
} from "@/lib/premios";
import {
  type AlumnoPremio,
  armarPremio,
  armarTarea,
  decisionEncaja,
  estadoPremioSeccion,
  tareasParaPremio,
  tarjetasPremios,
} from "@/lib/tareas-profe-datos";

const PROFE = "30262232";
const ANA = "31000001";
const LUIS = "31000002";
const EVA = "31000003";
const CARLOS = "31000004"; // de 5C
const FOTO = "premios/t1/0b7e3c1a-9a41-4d1f-8f7a-2f0a3d1c9e55.jpg";

const tarea = (o: Partial<Tarea> = {}): Tarea =>
  zTarea.parse({
    titulo: "Ensayo",
    tipo: "individual",
    secciones: ["5A", "5C"],
    estado: "evaluada",
    fechaEntrega: "2026-11-01",
    premio: "Libro de diseño",
    preguntas: [{ id: "p1", enunciado: "Uno", formato: "texto", valor: 20 }],
    importada: false,
    autorId: PROFE,
    actualizadoEn: 1,
    ...o,
  });

const alumno = (
  cedula: string,
  base = 20,
  seccion: "5A" | "5C" = "5A",
): AlumnoPremio => ({ cedula, rol: "estudiante", seccion, base });

const ALUMNOS = [
  alumno(ANA),
  alumno(LUIS),
  alumno(EVA, 15),
  alumno(CARLOS, 20, "5C"),
];

const entrega = (
  titularId: string,
  puntaje: number | null,
  o: Partial<Entrega> = {},
): Entrega => ({
  tareaId: "t1",
  tipo: "individual",
  titularId,
  seccion: "5A",
  integrantes: [titularId],
  estado: puntaje === null ? "entregada" : "evaluada",
  respuestas: {},
  enviadaPor: titularId,
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

const t1 = { id: "t1", ...tarea() };

describe("modelo (D263, D265)", () => {
  test("una individual puede llevar premio; sin premio sigue valiendo", () => {
    expect(zTarea.safeParse(tarea()).success).toBe(true);
    expect(zTarea.safeParse(tarea({ premio: null })).success).toBe(true);
  });

  test("premioFoto: clave de premios/ válida, ausente o null; nunca sin premio", () => {
    expect(zTarea.safeParse(tarea({ premioFoto: FOTO })).success).toBe(true);
    expect(zTarea.safeParse(tarea({ premioFoto: null })).success).toBe(true);
    const ok = (premioFoto: string, premio: string | null = "Libro") =>
      zTarea.safeParse({ ...tarea(), premio, premioFoto }).success;
    expect(ok("equipos/x/logo.webp")).toBe(false);
    expect(ok("premios/../secreto.jpg")).toBe(false);
    expect(ok("premios/t1/a b.jpg")).toBe(false);
    expect(ok(FOTO, null)).toBe(false);
  });

  test("los documentos de antes siguen valiendo y conservan la foto al leerlos", () => {
    const viejo = { ...tarea({ tipo: "grupal" }) } as Record<string, unknown>;
    delete viejo.premioFoto;
    expect(zTareaDoc.safeParse(viejo).success).toBe(true);
    const leida = zTareaDoc.parse({ ...tarea(), premioFoto: FOTO });
    expect(leida.premioFoto).toBe(FOTO);
  });

  test("zDecisionPremio: «darAlumno» con cédula; «dar» y «compartir» de antes siguen", () => {
    expect(zDecisionPremio.parse({ tipo: "darAlumno", alumnoId: ANA })).toEqual(
      { tipo: "darAlumno", alumnoId: ANA },
    );
    expect(
      zDecisionPremio.safeParse({ tipo: "darAlumno", alumnoId: "abc" }).success,
    ).toBe(false);
    expect(
      zDecisionPremio.safeParse({ tipo: "dar", equipoId: "5a-g2" }).success,
    ).toBe(true);
    expect(zDecisionPremio.safeParse({ tipo: "compartir" }).success).toBe(true);
    expect(idDeDecision({ tipo: "darAlumno", alumnoId: ANA })).toBe(ANA);
    expect(idDeDecision({ tipo: "dar", equipoId: "g" })).toBe("g");
    expect(idDeDecision({ tipo: "compartir" })).toBeNull();
  });
});

describe("ganador individual (D264)", () => {
  test("compiten los alumnos de la sección con su nota final (con base)", () => {
    const notas = notasPremioIndividual("t1", "5A", ALUMNOS, [
      entrega(ANA, 18),
      entrega(EVA, 20), // base 15 → 15
      entrega(CARLOS, 20, { seccion: "5C" }),
    ]);
    expect(notas).toEqual([
      { id: ANA, nota: 18 },
      { id: LUIS, nota: null },
      { id: EVA, nota: 15 },
    ]);
  });

  test("ganador único", () => {
    expect(
      estadoPremioSeccion(
        t1,
        "5A",
        [],
        [entrega(ANA, 19), entrega(LUIS, 18)],
        ALUMNOS,
      ),
    ).toEqual({
      tipo: "ganado",
      titularId: ANA,
      nota: 19,
      fecha: "2026-11-03",
    });
  });

  test("empate en la mejor nota; con «darAlumno» o «compartir» se resuelve", () => {
    const ents = [entrega(ANA, 18), entrega(LUIS, 18), entrega(EVA, 20)];
    expect(estadoPremioSeccion(t1, "5A", [], ents, ALUMNOS)).toEqual({
      tipo: "empate",
      titularIds: [ANA, LUIS],
      nota: 18,
      fecha: "2026-11-03",
    });
    const dada = {
      ...t1,
      decisionesPremio: {
        "5A": { tipo: "darAlumno" as const, alumnoId: LUIS },
      },
    };
    expect(estadoPremioSeccion(dada, "5A", [], ents, ALUMNOS)).toMatchObject({
      tipo: "ganado",
      titularId: LUIS,
    });
    const compartida = {
      ...t1,
      decisionesPremio: { "5A": { tipo: "compartir" as const } },
    };
    expect(
      estadoPremioSeccion(compartida, "5A", [], ents, ALUMNOS),
    ).toMatchObject({
      tipo: "compartido",
      titularIds: [ANA, LUIS],
    });
    expect(
      ganadoresPremio(
        notasPremioIndividual("t1", "5A", ALUMNOS, ents),
        dada.decisionesPremio["5A"],
      ),
    ).toEqual([LUIS]);
  });

  test("sin evaluadas: en juego, con el avance en alumnos", () => {
    const e = estadoPremioSeccion(
      { ...t1, estado: "abierta" },
      "5A",
      [],
      [entrega(ANA, null)],
      ALUMNOS,
    );
    expect(e).toEqual({
      tipo: "en-juego",
      entregaron: 1,
      total: 3,
      vence: "2026-11-01",
    });
    expect(avancePremioTexto(1, 3, "2026-11-01", "individual")).toBe(
      "1 de 3 alumnos entregaron · vence 01/11/2026",
    );
    expect(estadoPremioSeccion(t1, "5A", [], [], ALUMNOS).tipo).toBe(
      "en-juego",
    );
  });

  test("«darAlumno» a un alumno que ya no existe: la decisión no cuenta (no rompe)", () => {
    const ents = [entrega(ANA, 18), entrega(LUIS, 18), entrega(EVA, 18)];
    const dada = {
      ...t1,
      decisionesPremio: {
        "5A": { tipo: "darAlumno" as const, alumnoId: LUIS },
      },
    };
    // Luis se eliminó (W12): sigue el empate entre los que quedan, por decidir
    const sinLuis = ALUMNOS.filter((a) => a.cedula !== LUIS);
    expect(
      estadoPremioSeccion(dada, "5A", [], ents, [
        ...sinLuis.slice(0, 1),
        alumno(EVA),
        ...sinLuis.slice(2),
      ]),
    ).toMatchObject({ tipo: "empate", titularIds: [ANA, EVA] });
    // Solo queda uno con la mejor nota: lo gana él
    expect(
      estadoPremioSeccion(dada, "5A", [], ents, [alumno(ANA)]),
    ).toMatchObject({ tipo: "ganado", titularId: ANA });
    expect(
      resolverEmpate(
        { tipo: "empate", titularIds: [ANA, EVA], nota: 18, fecha: "x" },
        { tipo: "darAlumno", alumnoId: LUIS },
      ).tipo,
    ).toBe("empate");
  });

  test("decisionEncaja y decisionDar según el tipo de tarea", () => {
    expect(
      decisionEncaja("individual", { tipo: "darAlumno", alumnoId: ANA }),
    ).toBe(true);
    expect(decisionEncaja("individual", { tipo: "dar", equipoId: "g" })).toBe(
      false,
    );
    expect(decisionEncaja("grupal", { tipo: "darAlumno", alumnoId: ANA })).toBe(
      false,
    );
    expect(decisionEncaja("grupal", { tipo: "compartir" })).toBe(true);
    expect(decisionDar("individual", ANA)).toEqual({
      tipo: "darAlumno",
      alumnoId: ANA,
    });
    expect(decisionDar("grupal", "g")).toEqual({ tipo: "dar", equipoId: "g" });
    expect(premioParaTexto("individual")).toBe(
      "Premio para la mejor nota de tu sección",
    );
  });
});

describe("tarjetas y «Crear premio» (D263, D266)", () => {
  test("la individual con premio da una tarjeta por sección; sin premio, ninguna", () => {
    const t = tarjetasPremios(
      [
        { ...t1, premioFoto: FOTO },
        { id: "t2", ...tarea({ premio: null, estado: "abierta" }) },
      ],
      [],
      [entrega(ANA, 19)],
      ALUMNOS,
    );
    expect(t.map((x) => x.id)).toEqual(["t1__5A", "t1__5C"]);
    expect(t[0]).toMatchObject({
      tipoTarea: "individual",
      premioFoto: FOTO,
      editable: false,
      estado: { tipo: "ganado", titularId: ANA },
    });
  });

  test("tareasParaPremio: sin premio, ni cerrada ni importada", () => {
    const lista = tareasParaPremio([
      { id: "a", ...tarea({ premio: null, estado: "abierta" }) },
      { id: "b", ...tarea({ premio: null }) },
      { id: "c", ...tarea({ estado: "abierta" }) },
      { id: "d", ...tarea({ premio: null, importada: true, preguntas: [] }) },
      {
        id: "e",
        ...tarea({ premio: null, estado: "borrador", tipo: "grupal" }),
      },
    ]);
    expect(lista.map((x) => x.id)).toEqual(["a", "e"]);
    expect(lista[1]).toMatchObject({ tipo: "grupal", borrador: true });
  });

  test("armarPremio: mantener, cambiar o quitar la foto; cerrada no", () => {
    const abierta = tarea({ estado: "abierta", premioFoto: FOTO });
    expect(
      armarPremio(abierta, "  Entradas al cine ", { tipo: "mantener" }),
    ).toEqual({
      ok: true,
      campos: { premio: "Entradas al cine", premioFoto: FOTO },
      anterior: null,
    });
    const nueva = "premios/t1/otra.jpg";
    expect(
      armarPremio(abierta, "Cine", { tipo: "nueva", clave: nueva }),
    ).toEqual({
      ok: true,
      campos: { premio: "Cine", premioFoto: nueva },
      anterior: FOTO,
    });
    expect(armarPremio(abierta, "Cine", { tipo: "quitar" })).toMatchObject({
      ok: true,
      campos: { premioFoto: null },
      anterior: FOTO,
    });
    expect(armarPremio(abierta, "   ", { tipo: "mantener" })).toEqual({
      ok: false,
      error: "invalida",
    });
    expect(
      armarPremio(abierta, "Cine", { tipo: "nueva", clave: "equipos/x.jpg" }),
    ).toEqual({ ok: false, error: "invalida" });
    expect(armarPremio(tarea(), "Cine", { tipo: "mantener" })).toEqual({
      ok: false,
      error: "cerrada",
    });
    // Guardar dos veces lo mismo deja lo mismo
    const otraVez = armarPremio(
      tarea({ estado: "abierta", premio: "Cine", premioFoto: nueva }),
      "Cine",
      { tipo: "mantener" },
    );
    expect(otraVez).toEqual({
      ok: true,
      campos: { premio: "Cine", premioFoto: nueva },
      anterior: null,
    });
  });

  test("el constructor conserva la foto; al quitar el premio la suelta para borrarla", () => {
    const previa = tarea({ estado: "abierta", premioFoto: FOTO });
    const entrada = {
      titulo: "Ensayo",
      tipo: "individual" as const,
      fecha: "2026-11-20",
      seccion: "5A y 5C" as const,
      premio: "Libro de diseño",
      preguntas: [
        { id: "p1", enunciado: "Uno", formato: "texto" as const, valor: 20 },
      ],
    };
    const base = {
      accion: "guardar" as const,
      previa,
      autorId: PROFE,
      hoy: "2026-11-05",
      ahora: 2,
    };
    for (const conEntregas of [false, true]) {
      const r = armarTarea({ ...base, conEntregas, entrada });
      if (!r.ok) throw new Error(r.error);
      expect(r.tarea.premioFoto).toBe(FOTO);
      expect(r.fotoSuelta).toBeUndefined();
      const sin = armarTarea({
        ...base,
        conEntregas,
        entrada: { ...entrada, premio: null },
      });
      if (!sin.ok) throw new Error(sin.error);
      expect(sin.tarea.premio).toBeNull();
      expect(sin.tarea.premioFoto).toBeUndefined();
      expect(sin.fotoSuelta).toBe(FOTO);
    }
  });
});

describe("foto del premio (D265)", () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2]);
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const webp = new TextEncoder().encode("RIFF1234WEBPVP8 ");

  test("tipo por la firma de los bytes y tope de peso", () => {
    expect(validarFotoPremio(jpeg)).toEqual({
      ok: true,
      tipo: "image/jpeg",
      extension: "jpg",
    });
    expect(validarFotoPremio(png)).toMatchObject({
      ok: true,
      extension: "png",
    });
    expect(validarFotoPremio(webp)).toMatchObject({
      ok: true,
      extension: "webp",
    });
    expect(validarFotoPremio(new Uint8Array())).toEqual({
      ok: false,
      error: "vacia",
    });
    expect(validarFotoPremio(new TextEncoder().encode("GIF89a…"))).toEqual({
      ok: false,
      error: "tipo",
    });
    const grande = new Uint8Array(FOTO_PREMIO_MAX_BYTES + 1);
    grande.set(jpeg);
    expect(validarFotoPremio(grande)).toEqual({ ok: false, error: "peso" });
  });

  test("clave premios/{tareaId}/{uuid}.{ext} que el modelo acepta", () => {
    const c = claveFotoPremio("t1", "0b7e3c1a", "jpg");
    expect(c).toBe("premios/t1/0b7e3c1a.jpg");
    expect(zTarea.safeParse(tarea({ premioFoto: c })).success).toBe(true);
    expect(mensajeErrorPremio("foto-peso")).toContain("pesa demasiado");
  });
});
