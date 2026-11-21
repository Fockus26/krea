// Backlog 2026-11-21 S5 (D525–D528): quién envió si ya no está en el equipo, la grupal que vio
// quien entró después, el premio individual ganado y la evaluada sin puntos por pregunta.
import { describe, expect, test } from "bun:test";
import type { Entrega, Equipo, Tarea, Usuario } from "@/lib/modelo";
import { idEntrega } from "@/lib/modelo";
import { NO_PARTICIPASTE } from "@/lib/notas";
import { SIN_PUNTAJE_PREGUNTA } from "@/lib/question";
import {
  type ConId,
  ENTREGA_ANTES_DE_ENTRAR_PREGUNTA,
  entregaVista,
  premioIndividualGanado,
} from "@/lib/vistas-estudiante";

const AHORA = Date.UTC(2026, 10, 5, 20, 12); // 4:12 p. m. en Caracas

const usuario = (cedula: string, extra: Partial<Usuario> = {}): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres: "Adela Juana",
  apellidos: "Pérez Iglesias",
  seccion: "5A",
  equipoId: "5a-g2",
  base: 20,
  avatar: { estilo: "adventurer-neutral", semilla: cedula },
  actualizadoEn: 1,
  ...extra,
});

const CAPITAN = usuario("45009896", {
  nombres: "Raquel",
  apellidos: "Figueroa",
});
const INTEGRANTE = usuario("45021029", {
  nombres: "Paola",
  apellidos: "Padilla",
});
// Entró al equipo después de la entrega: no figura en `integrantes`
const TARDIO = usuario("33111222", { nombres: "Luis", apellidos: "Mora" });
// Envió la entrega y después se cambió de equipo
const SE_FUE = "33444555";

const EQUIPO: ConId<Equipo> = {
  id: "5a-g2",
  nombre: "5A-G2 Repostería",
  seccion: "5A",
  tema: "Repostería",
  capitanId: CAPITAN.cedula,
  logoPath: null,
};

const tarea = (id: string, extra: Partial<Tarea> = {}): ConId<Tarea> => ({
  id,
  titulo: "Presentación del producto",
  tipo: "grupal",
  secciones: ["5A"],
  estado: "abierta",
  fechaEntrega: "2026-11-07",
  premio: "Salida al cine",
  preguntas: [
    { id: "p1", enunciado: "Sube una foto", formato: "imagen", valor: 12 },
    { id: "p2", enunciado: "¿A qué precio?", formato: "texto", valor: 8 },
  ],
  importada: false,
  autorId: null,
  actualizadoEn: 1,
  ...extra,
});
const GRUPAL = tarea("presentacion");

const entrega = (extra: Partial<ConId<Entrega>> = {}): ConId<Entrega> => ({
  id: idEntrega(GRUPAL.id, EQUIPO.id),
  tareaId: GRUPAL.id,
  tipo: "grupal",
  titularId: EQUIPO.id,
  seccion: "5A",
  integrantes: [CAPITAN.cedula, INTEGRANTE.cedula],
  estado: "entregada",
  respuestas: {
    p1: { imagenPath: "entregas/presentacion/abc/x.jpg" },
    p2: { texto: "A 2 dólares" },
  },
  enviadaPor: CAPITAN.cedula,
  enviadaEn: AHORA,
  evaluacion: null,
  ...extra,
});

const evaluacion = (
  extra: Partial<NonNullable<Entrega["evaluacion"]>> = {},
): NonNullable<Entrega["evaluacion"]> => ({
  puntos: { p1: 10, p2: 6 },
  comentarios: {},
  puntaje: 16,
  evaluadaPor: null,
  evaluadaEn: AHORA,
  ...extra,
});

const datos = (u: Usuario, entregas: ConId<Entrega>[] = [], t = GRUPAL) => ({
  usuario: u,
  equipo: u.equipoId ? EQUIPO : null,
  tareas: [t],
  entregas,
});

describe("quién envió si ya no está en el equipo (D525)", () => {
  const companeros = [CAPITAN, INTEGRANTE];
  const deOtro = entrega({ enviadaPor: SE_FUE });

  test("sin su nombre: «alguien que ya no está», no el texto del Excel", () => {
    const v = entregaVista(datos(INTEGRANTE, [deOtro]), GRUPAL.id, companeros);
    expect(v).toMatchObject({
      estado: "entregada",
      quien: null,
      enviadaPorFuera: true,
      autor: "tu equipo",
      fecha: "05/11/2026",
    });
  });

  test("con su nombre (lo busca el servidor): el nombre corto", () => {
    const v = entregaVista(
      datos(INTEGRANTE, [deOtro]),
      GRUPAL.id,
      companeros,
      undefined,
      {
        autores: new Map([
          [SE_FUE, { nombres: "Ana María", apellidos: "Rojas Díaz" }],
        ]),
      },
    );
    expect(v).toMatchObject({
      quien: "Ana Rojas",
      enviadaPorFuera: false,
      autor: "Ana",
    });
  });

  test("del Excel (sin registro) sigue igual; un compañero, con su nombre completo", () => {
    const excel = entregaVista(
      datos(INTEGRANTE, [entrega({ enviadaPor: null, enviadaEn: null })]),
      GRUPAL.id,
      companeros,
    );
    expect(excel).toMatchObject({ quien: null, enviadaPorFuera: false });
    const normal = entregaVista(
      datos(INTEGRANTE, [entrega()]),
      GRUPAL.id,
      companeros,
    );
    expect(normal).toMatchObject({
      quien: "Raquel Figueroa",
      enviadaPorFuera: false,
      antesDeEntrar: false,
    });
  });
});

describe("grupal enviada antes de que entrara (D526)", () => {
  const companeros = [CAPITAN, INTEGRANTE, TARDIO];

  test("abierta: la ve en solo lectura, no como lector", () => {
    const v = entregaVista(datos(TARDIO), GRUPAL.id, companeros, undefined, {
      delEquipo: entrega(),
    });
    expect(v).toMatchObject({
      estado: "entregada",
      antesDeEntrar: true,
      quien: "Raquel Figueroa",
      notaHref: null,
      sinPuntaje: ENTREGA_ANTES_DE_ENTRAR_PREGUNTA,
      respuestas: [
        { tipo: "imagen", imagenPaths: ["entregas/presentacion/abc/x.jpg"] },
        { tipo: "texto", texto: "A 2 dólares" },
      ],
    });
  });

  test("evaluada y cerrada: sin enlace a una nota que no es suya", () => {
    const cerrada = { ...GRUPAL, estado: "evaluada" as const };
    const v = entregaVista(
      datos(TARDIO, [], cerrada),
      cerrada.id,
      companeros,
      undefined,
      { delEquipo: entrega({ estado: "evaluada", evaluacion: evaluacion() }) },
    );
    expect(v).toMatchObject({
      estado: "entregada",
      evaluada: true,
      antesDeEntrar: true,
      notaHref: null,
    });
  });

  test("la de otro equipo o un borrador no cuentan; la suya manda", () => {
    const otro = entregaVista(datos(TARDIO), GRUPAL.id, companeros, undefined, {
      delEquipo: entrega({ titularId: "5a-g3" }),
    });
    expect(otro.estado).toBe("lector");
    const borrador = entregaVista(
      datos(TARDIO),
      GRUPAL.id,
      companeros,
      undefined,
      { delEquipo: entrega({ estado: "borrador" }) },
    );
    expect(borrador.estado).toBe("lector");
    const suya = entregaVista(
      datos(INTEGRANTE, [entrega()]),
      GRUPAL.id,
      companeros,
      undefined,
      { delEquipo: entrega() },
    );
    expect(suya).toMatchObject({ antesDeEntrar: false, sinPuntaje: null });
  });
});

describe("evaluada sin puntos por pregunta ≠ Pendiente (D528)", () => {
  const companeros = [CAPITAN, INTEGRANTE];

  test("puntaje final sin desglose: «Sin puntaje por pregunta»", () => {
    const v = entregaVista(
      datos(INTEGRANTE, [
        entrega({
          estado: "evaluada",
          evaluacion: evaluacion({ puntos: null }),
        }),
      ]),
      GRUPAL.id,
      companeros,
    );
    expect(v).toMatchObject({
      evaluada: true,
      sinPuntaje: SIN_PUNTAJE_PREGUNTA,
    });
  });

  test("marcado «No participó» sin desglose: su línea", () => {
    const v = entregaVista(
      datos(INTEGRANTE, [
        entrega({
          estado: "evaluada",
          evaluacion: evaluacion({
            puntos: null,
            noParticiparon: [INTEGRANTE.cedula],
          }),
        }),
      ]),
      GRUPAL.id,
      companeros,
    );
    expect(v).toMatchObject({ sinPuntaje: NO_PARTICIPASTE });
  });

  test("con puntos o sin evaluar: nada (los puntos, o «Pendiente»)", () => {
    const conPuntos = entregaVista(
      datos(INTEGRANTE, [
        entrega({ estado: "evaluada", evaluacion: evaluacion() }),
      ]),
      GRUPAL.id,
      companeros,
    );
    expect(conPuntos).toMatchObject({ sinPuntaje: null });
    const sinEvaluar = entregaVista(
      datos(INTEGRANTE, [entrega()]),
      GRUPAL.id,
      companeros,
    );
    expect(sinEvaluar).toMatchObject({ evaluada: false, sinPuntaje: null });
  });
});

describe("premio individual ganado (D527)", () => {
  const ADELA = "31000001";
  const LUIS = "31000002";
  const EVA = "31000003";
  const DARIO = "31000004"; // de 5C
  const individual = tarea("ensayo", {
    tipo: "individual",
    estado: "evaluada",
    secciones: ["5A", "5C"],
    fechaEntrega: "2026-11-01",
    premio: "Libro de diseño",
    premioFoto: "premios/ensayo/0b7e3c1a-9a41-4d1f-8f7a-2f0a3d1c9e55.jpg",
    preguntas: [{ id: "p1", enunciado: "Uno", formato: "texto", valor: 20 }],
  });
  const alumno = (cedula: string, base = 20, seccion: "5A" | "5C" = "5A") => ({
    cedula,
    rol: "estudiante" as const,
    seccion,
    base,
  });
  const alumnos = [
    alumno(ADELA),
    alumno(LUIS),
    alumno(EVA, 15),
    alumno(DARIO, 20, "5C"),
  ];
  const nota = (
    titularId: string,
    puntaje: number,
    seccion: "5A" | "5C" = "5A",
  ): Entrega => ({
    tareaId: individual.id,
    tipo: "individual",
    titularId,
    seccion,
    integrantes: [titularId],
    estado: "evaluada",
    respuestas: {},
    enviadaPor: titularId,
    enviadaEn: AHORA,
    evaluacion: evaluacion({ puntos: null, puntaje }),
  });

  test("la mejor nota final de su sección gana, con el premio y su foto", () => {
    const comp = {
      alumnos,
      entregas: [nota(ADELA, 18), nota(LUIS, 16), nota(DARIO, 20, "5C")],
    };
    expect(
      premioIndividualGanado(individual, "5A", ADELA, comp, AHORA),
    ).toEqual({
      premio: "Libro de diseño",
      premioFoto: "premios/ensayo/0b7e3c1a-9a41-4d1f-8f7a-2f0a3d1c9e55.jpg",
    });
    expect(
      premioIndividualGanado(individual, "5A", LUIS, comp, AHORA),
    ).toBeNull();
    // La de 5C no compite en 5A, y gana en la suya
    expect(
      premioIndividualGanado(individual, "5C", DARIO, comp, AHORA),
    ).not.toBeNull();
  });

  test("con base: compite la nota final (20 × 15 / 20 = 15 pierde ante 16)", () => {
    const comp = { alumnos, entregas: [nota(EVA, 20), nota(LUIS, 16)] };
    expect(
      premioIndividualGanado(individual, "5A", EVA, comp, AHORA),
    ).toBeNull();
    expect(
      premioIndividualGanado(individual, "5A", LUIS, comp, AHORA),
    ).not.toBeNull();
  });

  test("empate: nadie hasta que el profe decide; su decisión se respeta", () => {
    const comp = { alumnos, entregas: [nota(ADELA, 18), nota(LUIS, 18)] };
    expect(
      premioIndividualGanado(individual, "5A", ADELA, comp, AHORA),
    ).toBeNull();
    const dado = {
      ...individual,
      decisionesPremio: {
        "5A": { tipo: "darAlumno" as const, alumnoId: LUIS },
      },
    };
    expect(
      premioIndividualGanado(dado, "5A", LUIS, comp, AHORA),
    ).not.toBeNull();
    expect(premioIndividualGanado(dado, "5A", ADELA, comp, AHORA)).toBeNull();
    const compartido = {
      ...individual,
      decisionesPremio: { "5A": { tipo: "compartir" as const } },
    };
    expect(
      premioIndividualGanado(compartido, "5A", ADELA, comp, AHORA),
    ).not.toBeNull();
    expect(
      premioIndividualGanado(compartido, "5A", LUIS, comp, AHORA),
    ).not.toBeNull();
  });

  test("sin premio, grupal o abierta todavía: nada", () => {
    const comp = { alumnos, entregas: [nota(ADELA, 18)] };
    expect(
      premioIndividualGanado(
        { ...individual, premio: null, premioFoto: null },
        "5A",
        ADELA,
        comp,
        AHORA,
      ),
    ).toBeNull();
    expect(
      premioIndividualGanado(
        { ...individual, tipo: "grupal" },
        "5A",
        ADELA,
        comp,
        AHORA,
      ),
    ).toBeNull();
    const abierta = {
      ...individual,
      estado: "abierta" as const,
      fechaEntrega: "2026-12-01",
    };
    expect(
      premioIndividualGanado(abierta, "5A", ADELA, comp, AHORA),
    ).toBeNull();
  });
});
