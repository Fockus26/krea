// Base por alumno en cada tarea (D403–D407): la evaluación guarda la base de cada integrante y
// la nota la lee de ahí; sin ella, la base vigente del alumno.
import { describe, expect, test } from "bun:test";
import { notasPremioIndividual } from "@/lib/equipo";
import {
  baseIntegranteLabel,
  normalizarBase,
  normalizarBases,
} from "@/lib/evaluar";
import {
  armarEvaluacion,
  basesDeEvaluacion,
  basesIntegrantesTexto,
  basesVigentesDe,
  deshacerEvaluacion,
  entregaEvaluada,
  mapasEvaluar,
  vistaEvaluar,
  zGuardarEvaluacion,
} from "@/lib/evaluar-datos";
import type {
  Entrega,
  Evaluacion,
  Tarea,
  Usuario,
} from "@/lib/modelo";
import { zEntrega, zEvaluacion } from "@/lib/modelo";
import {
  baseDeIntegrante,
  calcularRanking,
  notaDeIntegrante,
  puntosDeAlumno,
} from "@/lib/ranking-datos";
import { filasEntregasTarea } from "@/lib/tareas-profe-entregas";
import { detalleNota, notasDelAlumno } from "@/lib/vistas-estudiante";

const A = "30000001";
const B = "30000002";
const C = "30000003";

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
    { id: "p2", enunciado: "Dos", formato: "texto", valor: 8 },
  ],
  importada: false,
  autorId: null,
  actualizadoEn: 1,
};

const ev = (o: Partial<Evaluacion> = {}): Evaluacion => ({
  puntos: { p1: 10, p2: 6 },
  comentarios: {},
  puntaje: 16,
  evaluadaPor: "30262232",
  evaluadaEn: 100,
  ...o,
});

const ent = (o: Partial<Entrega> = {}): { id: string } & Entrega => ({
  id: "e1",
  tareaId: "t1",
  tipo: "individual",
  titularId: A,
  seccion: "5A",
  integrantes: [A],
  estado: "entregada",
  respuestas: { p1: { texto: "Hola" }, p2: { texto: "Chao" } },
  enviadaPor: A,
  enviadaEn: 50,
  evaluacion: null,
  ...o,
});

const grupal = (o: Partial<Entrega> = {}) =>
  ent({
    id: "g1",
    tipo: "grupal",
    titularId: "eq1",
    integrantes: [A, B, C],
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

const envio = (o: Record<string, unknown> = {}) =>
  zGuardarEvaluacion.parse({
    entregaId: "e1",
    puntos: { p1: 10, p2: 6 },
    comentarios: {},
    version: null,
    ...o,
  });

describe("baseDeIntegrante / notaDeIntegrante (D403)", () => {
  test("con `bases`: la de la entrega, aunque la vigente sea otra", () => {
    const e = ent({ estado: "evaluada", evaluacion: ev({ bases: { [A]: 10 } }) });
    expect(baseDeIntegrante(e, A, 15)).toBe(10);
    // 16 × 10 / 20 = 8, no 16 × 15 / 20 = 12
    expect(notaDeIntegrante(e, 15, A)).toBe(8);
  });

  test("sin `bases` (evaluación de antes): la vigente, como hasta ahora", () => {
    const e = ent({ estado: "evaluada", evaluacion: ev() });
    expect(baseDeIntegrante(e, A, 15)).toBe(15);
    expect(notaDeIntegrante(e, 15, A)).toBe(12);
  });

  test("integrante sin clave en `bases`: su vigente; sin evaluar, la vigente y sin nota", () => {
    const g = grupal({
      estado: "evaluada",
      evaluacion: ev({ puntaje: 20, bases: { [A]: 10 } }),
    });
    expect(notaDeIntegrante(g, 18, A)).toBe(10);
    expect(notaDeIntegrante(g, 18, B)).toBe(18);
    expect(baseDeIntegrante(ent(), A, 17.5)).toBe(17.5);
    expect(notaDeIntegrante(ent(), 17.5, A)).toBeNull();
  });

  test("«No participó» sigue en 1, sin base (D365)", () => {
    const g = grupal({
      estado: "evaluada",
      evaluacion: ev({ bases: { [A]: 20, [B]: 20, [C]: 20 }, noParticiparon: [B] }),
    });
    expect(notaDeIntegrante(g, 15, B)).toBe(1);
    expect(notaDeIntegrante(g, 15, A)).toBe(16);
  });

  test("zod: `bases` opcional; una base fuera de 10–20 o de los pasos no valida", () => {
    expect(zEvaluacion.safeParse(ev()).success).toBe(true);
    expect(zEvaluacion.safeParse(ev({ bases: { [A]: 12.5 } })).success).toBe(
      true,
    );
    expect(zEvaluacion.safeParse(ev({ bases: { [A]: 9 } })).success).toBe(
      false,
    );
    expect(zEvaluacion.safeParse(ev({ bases: { [A]: 12.3 } })).success).toBe(
      false,
    );
    expect(zEvaluacion.safeParse(ev({ bases: { abc: 12 } })).success).toBe(
      false,
    );
    // Una fila vieja sin `bases` sigue siendo una entrega válida
    const { id: _, ...vieja } = ent({ estado: "evaluada", evaluacion: ev() });
    expect(zEntrega.safeParse(vieja).success).toBe(true);
  });
});

describe("armarEvaluacion: de dónde sale cada base (D403)", () => {
  const armar = (
    e: Entrega,
    o: Record<string, unknown> = {},
    vigentes: Record<string, number> = { [A]: 15, [B]: 17 },
  ) =>
    armarEvaluacion({
      entrega: e,
      tarea: { ...tarea, tipo: e.tipo },
      envio: envio({ version: e.evaluacion?.evaluadaEn ?? null, ...o }),
      basesVigentes: vigentes,
      autorId: "30262232",
      ahora: 200,
    });

  test("las cuatro fuentes: la enviada → la de la evaluación vigente → la vigente → 20", () => {
    const previa = grupal({
      estado: "evaluada",
      evaluacion: ev({ bases: { [A]: 11, [B]: 12 } }),
    });
    const r = armar(previa, { bases: { [A]: 19.5 } });
    // A: la enviada · B: la que ya tenía · C: no existe y la evaluación no la traía → 20
    expect(r.ok && r.evaluacion.bases).toEqual({ [A]: 19.5, [B]: 12, [C]: 20 });
    const sinPrevia = armar(grupal());
    expect(sinPrevia.ok && sinPrevia.evaluacion.bases).toEqual({
      [A]: 15,
      [B]: 17,
      [C]: 20,
    });
  });

  test("individual: una clave, la del titular", () => {
    const r = armar(ent(), { bases: { [A]: 13 } });
    expect(r.ok && r.evaluacion.bases).toEqual({ [A]: 13 });
    const sinEnvio = armar(ent());
    expect(sinEnvio.ok && sinEnvio.evaluacion.bases).toEqual({ [A]: 15 });
  });

  test("corregir sin mandar bases (formulario viejo) conserva las guardadas", () => {
    const previa = ent({
      estado: "evaluada",
      evaluacion: ev({ bases: { [A]: 10 } }),
    });
    const r = armar(previa);
    expect(r.ok && r.evaluacion.bases).toEqual({ [A]: 10 });
  });

  test("una cédula que no es integrante, o una base inválida, se rechaza", () => {
    expect(armar(ent(), { bases: { [B]: 15 } })).toEqual({
      ok: false,
      error: "invalida",
    });
    // zod ya la rechaza al entrar por la Server Action…
    expect(
      zGuardarEvaluacion.safeParse({
        entregaId: "e1",
        puntos: {},
        comentarios: {},
        version: null,
        bases: { [A]: 21 },
      }).success,
    ).toBe(false);
    // …y `basesDeEvaluacion` no la deja pasar aunque llegue sin validar
    expect(basesDeEvaluacion(ent(), { [A]: 12.3 }, {})).toBeNull();
    expect(basesDeEvaluacion(ent(), { [A]: 9.5 }, {})).toBeNull();
  });

  test("una vigente rara (fuera de rango) no se copia: cae a 20", () => {
    expect(basesDeEvaluacion(ent(), {}, { [A]: 25 })).toEqual({ [A]: 20 });
  });

  test("basesVigentesDe: solo los integrantes que existen", () => {
    const usuarios = new Map([
      [A, { base: 14 }],
      ["39999999", { base: 18 }],
    ]);
    expect(basesVigentesDe(grupal(), usuarios)).toEqual({ [A]: 14 });
  });
});

describe("el ranking usa la base de cada entrega (D403)", () => {
  const evaluada = ent({
    estado: "evaluada",
    evaluacion: ev({ puntaje: 20, bases: { [A]: 12 } }),
  });

  test("cambiar `usuarios.base` no mueve una entrega con `bases`", () => {
    expect(puntosDeAlumno({ cedula: A, base: 15 }, [evaluada], [])).toBe(
      puntosDeAlumno({ cedula: A, base: 20 }, [evaluada], []),
    );
    const r15 = calcularRanking(
      "5A",
      { usuarios: [usuario(A, 15)], equipos: [], entregas: [evaluada], ajustes: [] },
      1,
    );
    const r20 = calcularRanking(
      "5A",
      { usuarios: [usuario(A, 20)], equipos: [], entregas: [evaluada], ajustes: [] },
      1,
    );
    expect(r15.alumnos[A]?.puntos).toBe(r20.alumnos[A]?.puntos);
  });

  test("sin `bases`, sí lo mueve (respaldo hasta aplicar el SQL)", () => {
    const vieja = ent({ estado: "evaluada", evaluacion: ev({ puntaje: 20 }) });
    expect(puntosDeAlumno({ cedula: A, base: 12 }, [vieja], [])).not.toBe(
      puntosDeAlumno({ cedula: A, base: 20 }, [vieja], []),
    );
  });
});

describe("«Deshacer» devuelve las bases anteriores (D205)", () => {
  test("se guarda con una base y, al deshacer, vuelve la de antes", () => {
    const primera = ent({
      estado: "evaluada",
      evaluacion: ev({ bases: { [A]: 11 } }),
    });
    const r = armarEvaluacion({
      entrega: primera,
      tarea,
      envio: envio({ version: 100, bases: { [A]: 18 } }),
      basesVigentes: { [A]: 15 },
      autorId: "30262232",
      ahora: 300,
    });
    if (!r.ok) throw new Error("no armó");
    const segunda = entregaEvaluada(primera, r.evaluacion);
    expect(segunda.evaluacion?.bases).toEqual({ [A]: 18 });
    const d = deshacerEvaluacion(segunda, 300, "30262232");
    expect(d.ok && d.entrega.evaluacion?.bases).toEqual({ [A]: 11 });
  });
});

describe("vistaEvaluar con la base de la entrega (D403)", () => {
  const mapas = mapasEvaluar({
    usuarios: [usuario(A, 15), usuario(B, 18)],
    equipos: [],
    tareas: [tarea],
  });

  test("individual evaluada: el chip, la base y el valor inicial son los guardados", () => {
    const v = vistaEvaluar({
      entrega: ent({ estado: "evaluada", evaluacion: ev({ bases: { [A]: 12 } }) }),
      tarea,
      cola: [],
      mapas,
    });
    expect(v.base).toBe(12);
    expect(v.chips.base).toBe("Base 12");
    expect(v.inicial.bases).toEqual({ [A]: 12 });
  });

  test("grupal: una por integrante; el equipo sigue sobre 20", () => {
    const v = vistaEvaluar({
      entrega: grupal({
        estado: "evaluada",
        evaluacion: ev({ bases: { [A]: 10 } }),
      }),
      tarea: { ...tarea, tipo: "grupal" },
      cola: [],
      mapas,
    });
    expect(v.base).toBe(20);
    expect(v.inicial.bases).toEqual({ [A]: 10, [B]: 18, [C]: 20 });
  });

  test("solo ver: el texto de las bases de una grupal", () => {
    expect(
      basesIntegrantesTexto(
        [
          { cedula: A, nombre: "Ana Pérez" },
          { cedula: B, nombre: "Luis Díaz" },
        ],
        { [A]: 17.5, [B]: 15 },
        [B],
      ),
    ).toBe("Bases en esta tarea: Ana Pérez 17,5 · Luis Díaz no participó");
  });
});

describe("formulario: base normalizada y nombre accesible", () => {
  test("lleva lo que se está escribiendo al paso y al rango (D004, D006)", () => {
    expect(normalizarBase(17.3)).toBe(17.5);
    expect(normalizarBase(25)).toBe(20);
    expect(normalizarBase(3)).toBe(10);
    expect(normalizarBases({ [A]: 12.2, [B]: 15 })).toEqual({
      [A]: 12,
      [B]: 15,
    });
    expect(baseIntegranteLabel("Ana Pérez")).toBe("Base de Ana Pérez");
  });
});

describe("las vistas muestran la base de esa entrega (D403)", () => {
  const evaluada = ent({
    estado: "evaluada",
    evaluacion: ev({ puntaje: 20, bases: { [A]: 12 } }),
  });

  test("Mis notas y el detalle del alumno", () => {
    const d = {
      usuario: usuario(A, 18),
      tareas: [tarea],
      entregas: [evaluada],
    };
    const [n] = notasDelAlumno(d);
    expect(n?.base).toBe(12);
    expect(n?.nota).toBe(12);
    const det = detalleNota(d, "t1");
    expect(det.estado === "ok" && det.base).toBe(12);
  });

  test("la lista de entregas del profe", () => {
    const [f] = filasEntregasTarea({
      tarea: { id: "t1", tipo: "individual", secciones: ["5A"] },
      entregas: [evaluada],
      usuarios: [usuario(A, 18)],
      equipos: [],
    });
    expect(f?.base).toBe(12);
    expect(f?.nota).toBe(12);
  });

  test("la lista de una grupal: la base de cada integrante en ella", () => {
    const g = grupal({
      estado: "evaluada",
      evaluacion: ev({ puntaje: 20, bases: { [A]: 10, [C]: 14 } }),
    });
    const [f] = filasEntregasTarea({
      tarea: { id: "t1", tipo: "grupal", secciones: ["5A"] },
      entregas: [g],
      usuarios: [usuario(A, 18), usuario(B, 16)],
      equipos: [],
    });
    // C ya no existe, pero la evaluación guardó su base
    expect(f?.integrantes.map((i) => [i.base, i.nota])).toEqual([
      [10, 10],
      [16, 16],
      [14, 14],
    ]);
  });

  test("el premio individual compite con la nota de la base de su entrega", () => {
    expect(
      notasPremioIndividual("t1", "5A", [usuario(A, 18)], [evaluada]),
    ).toEqual([{ id: A, nota: 12 }]);
  });
});
