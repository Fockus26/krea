// Entrega ideal sobre Postgres en memoria (tanda 11-14 Z2, D430–D435): guardar, reemplazar y
// quitar; la lectura del alumno solo con la tarea cerrada, de su sección y con la ideal vigente.
import { beforeAll, describe, expect, test } from "bun:test";
import {
  guardarIdealEnTransaccion,
  idealDelAlumno,
  leerIdeal,
  quitarIdeal,
} from "@/lib/data/ideales";
import type { Db } from "@/lib/db";
import type { GuardarIdeal } from "@/lib/ideal";
import {
  type Entrega,
  type Equipo,
  type Evaluacion,
  idEntrega,
  type Tarea,
  type Usuario,
} from "@/lib/modelo";
import { baseNueva } from "./base";
import {
  ponerEntrega,
  ponerEquipo,
  ponerTarea,
  ponerUsuario,
} from "./docs";

let base: Db;
const db = () => base;

const PROFE = "30262232";
const A1 = "39712001";
const A2 = "39712002";
const EQ = "z2-g1";
const T = "z2-ind";
const TG = "z2-gru";

const alumno = (cedula: string): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres: `Alumno ${cedula}`,
  apellidos: "Prueba Z2",
  seccion: "5A",
  equipoId: EQ,
  base: 18,
  avatar: { estilo: "adventurer-neutral", semilla: cedula },
  actualizadoEn: 1,
});

const equipo: Equipo = {
  nombre: "5A-G9 Prueba Z2",
  seccion: "5A",
  tema: "Pixel",
  capitanId: A1,
  logoPath: null,
};

const tarea = (tipo: Tarea["tipo"], estado: Tarea["estado"]): Tarea => ({
  titulo: `Prueba Z2 ${tipo}`,
  tipo,
  secciones: ["5A"],
  estado,
  fechaEntrega: "2026-11-20",
  premio: null,
  preguntas: [
    { id: "p1", enunciado: "Uno", formato: "texto", valor: 12 },
    { id: "p2", enunciado: "Dos", formato: "imagen", valor: 8 },
  ],
  importada: false,
  autorId: PROFE,
  actualizadoEn: 1,
});

const evaluacion = (p1: number, p2: number): Evaluacion => ({
  puntos: { p1, p2 },
  comentarios: { p1: "Comentario del profe" },
  puntaje: p1 + p2,
  evaluadaPor: PROFE,
  evaluadaEn: 10,
});

const evaluada = (
  tareaId: string,
  tipo: Entrega["tipo"],
  titularId: string,
  integrantes: string[],
  ev: Evaluacion | null,
): Entrega => ({
  tareaId,
  tipo,
  titularId,
  seccion: "5A",
  integrantes,
  estado: ev ? "evaluada" : "entregada",
  respuestas: {
    p1: { texto: `Respuesta de ${titularId}` },
    p2: { imagenPath: `entregas/${tareaId}/${titularId}/uno.jpg` },
  },
  enviadaPor: integrantes[0] ?? null,
  enviadaEn: 5,
  evaluacion: ev,
});

const E1 = idEntrega(T, A1); // 20 / 20
const E2 = idEntrega(T, A2); // 18 / 20
const EG = idEntrega(TG, EQ); // 20 / 20

const deEntrega = (tareaId: string, entregaId: string): GuardarIdeal => ({
  tareaId,
  forma: { tipo: "entrega", entregaId },
  nota: "Responde todo con ejemplos",
  notas: { p1: "Clara y breve" },
});

beforeAll(async () => {
  base = await baseNueva();
  await ponerUsuario(db(), alumno(A1));
  await ponerUsuario(db(), alumno(A2));
  await ponerEquipo(db(), EQ, equipo);
  await ponerTarea(db(), T, tarea("individual", "abierta"));
  await ponerTarea(db(), TG, tarea("grupal", "evaluada"));
  await ponerEntrega(
    db(),
    E1,
    evaluada(T, "individual", A1, [A1], evaluacion(12, 8)),
  );
  await ponerEntrega(
    db(),
    E2,
    evaluada(T, "individual", A2, [A2], evaluacion(12, 6)),
  );
  await ponerEntrega(
    db(),
    EG,
    evaluada(TG, "grupal", EQ, [A1, A2], evaluacion(12, 8)),
  );
});

describe("guardar, reemplazar y quitar (Postgres)", () => {
  test("una entrega que no tiene 20 / 20 no se puede elegir", async () => {
    expect(
      await guardarIdealEnTransaccion(db(), PROFE, deEntrega(T, E2), 100),
    ).toEqual({ ok: false, error: "no-elegible" });
    expect(await leerIdeal(db(), T)).toBeNull();
  });

  test("guarda la de un alumno y la reemplaza por la del profe (una por tarea)", async () => {
    expect(
      await guardarIdealEnTransaccion(db(), PROFE, deEntrega(T, E1), 100),
    ).toEqual({ ok: true });
    expect(await leerIdeal(db(), T)).toEqual({
      tareaId: T,
      entregaId: E1,
      respuestas: null,
      nota: "Responde todo con ejemplos",
      notas: { p1: "Clara y breve" },
      autorId: PROFE,
      actualizadoEn: 100,
    });

    expect(
      await guardarIdealEnTransaccion(
        db(),
        PROFE,
        {
          tareaId: T,
          forma: { tipo: "profe", respuestas: { p1: "Ideal 1", p2: "Ideal 2" } },
          nota: "La nuestra",
          notas: {},
        },
        200,
      ),
    ).toEqual({ ok: true });
    const i = await leerIdeal(db(), T);
    expect(i?.entregaId).toBeNull();
    expect(i?.respuestas).toEqual({ p1: "Ideal 1", p2: "Ideal 2" });
    expect(i?.actualizadoEn).toBe(200);
  });

  test("el profe tiene que responder todas las preguntas", async () => {
    expect(
      await guardarIdealEnTransaccion(
        db(),
        PROFE,
        {
          tareaId: T,
          forma: { tipo: "profe", respuestas: { p1: "Solo una" } },
          nota: "x",
          notas: {},
        },
        300,
      ),
    ).toEqual({ ok: false, error: "incompleta" });
  });

  test("tarea que no existe", async () => {
    expect(
      await guardarIdealEnTransaccion(db(), PROFE, deEntrega("nada", E1), 1),
    ).toEqual({ ok: false, error: "no-existe" });
  });

  test("quitar la borra; quitar otra vez no falla", async () => {
    await quitarIdeal(db(), T);
    expect(await leerIdeal(db(), T)).toBeNull();
    await quitarIdeal(db(), T);
  });
});

describe("lectura del alumno (D433, D434)", () => {
  test("con la tarea abierta, nada", async () => {
    await guardarIdealEnTransaccion(db(), PROFE, deEntrega(T, E1), 400);
    expect(await idealDelAlumno(db(), "5A", T)).toBeNull();
  });

  test("con la tarea cerrada, la ve con el nombre y avatar del autor", async () => {
    await ponerTarea(db(), T, tarea("individual", "evaluada"));
    const d = await idealDelAlumno(db(), "5A", T);
    expect(d?.ideal.entregaId).toBe(E1);
    expect(d?.autor).toEqual({
      tipo: "alumno",
      nombre: `Alumno ${A1} Prueba Z2`,
      avatar: { estilo: "adventurer-neutral", semilla: A1 },
    });
    expect(d?.entrega?.respuestas.p1).toEqual({ texto: `Respuesta de ${A1}` });
  });

  test("de otra sección (o sin sección), nada", async () => {
    expect(await idealDelAlumno(db(), "5C", T)).toBeNull();
    expect(await idealDelAlumno(db(), null, T)).toBeNull();
  });

  test("si la entrega ya no tiene 20 / 20 o se eliminó, nada", async () => {
    await ponerEntrega(
      db(),
      E1,
      evaluada(T, "individual", A1, [A1], evaluacion(12, 7.5)),
    );
    expect(await idealDelAlumno(db(), "5A", T)).toBeNull();
    // Devuelta (sin nota)
    await ponerEntrega(db(), E1, evaluada(T, "individual", A1, [A1], null));
    expect(await idealDelAlumno(db(), "5A", T)).toBeNull();
    // Eliminada: la fila de la ideal queda, pero no se muestra
    await base.execute(`DELETE FROM entregas WHERE id = '${E1}'`);
    expect(await idealDelAlumno(db(), "5A", T)).toBeNull();
    expect((await leerIdeal(db(), T))?.entregaId).toBe(E1);
  });

  test("en una grupal, el autor es el equipo", async () => {
    expect(
      await guardarIdealEnTransaccion(db(), PROFE, deEntrega(TG, EG), 500),
    ).toEqual({ ok: true });
    const d = await idealDelAlumno(db(), "5A", TG);
    expect(d?.autor).toEqual({
      tipo: "equipo",
      nombre: equipo.nombre,
      equipoId: EQ,
      tema: "Pixel",
      logoPath: null,
    });
  });

  test("la base rechaza una fila con las dos formas", async () => {
    let error: unknown = null;
    try {
      await base.execute(
        `INSERT INTO ideales (tarea_id, entrega_id, respuestas, nota, notas, autor_id, actualizado_en)
         VALUES ('x', 'e', '{"p1":"a"}', 'n', '{}', '${PROFE}', 1)`,
      );
    } catch (e) {
      error = e;
    }
    expect(error).not.toBeNull();
  });
});
