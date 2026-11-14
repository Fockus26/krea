// Base por alumno en cada tarea (D403–D407) sobre PGlite: Evaluar guarda la base de cada integrante
// en la entrega y el ranking de la sección sale con ella; el puntaje final de la tarea 1 conserva
// la que ya tenía; y el SQL de datos (`scripts/sql/2026-11-14-bases-por-entrega.sql`) congela las
// evaluaciones de antes con la base vigente, sin tocar las que ya la traen, y una segunda pasada
// no cambia nada.
import { beforeAll, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import type { PGlite } from "@electric-sql/pglite";
import { evaluarEnTransaccion } from "@/lib/data/evaluar";
import { ponerPuntajeFinalEnTransaccion } from "@/lib/data/puntaje-final";
import type { Db } from "@/lib/db";
import {
  type Entrega,
  type Equipo,
  type Evaluacion,
  idEntrega,
  type Tarea,
  type Usuario,
} from "@/lib/modelo";
import { baseNueva } from "./base";
import * as docs from "./docs";

const SQL = readFileSync("scripts/sql/2026-11-14-bases-por-entrega.sql", "utf8");

let base: Db;
const db = () => base;
const ejecutarSql = () =>
  (base as unknown as { $client: PGlite }).$client.exec(SQL);

const AHORA = Date.UTC(2026, 10, 14, 15);
const PROFE = "30403001";
const A = "39403001"; // base 15
const B = "39403002"; // base 18
const C = "39403003"; // base 20, sin perfil en la grupal vieja
const EQ = "w1-g1";
const T_IND = "w1-ind";
const T_GRU = "w1-gru";
const T_FINAL = "w1-final";

const alumno = (cedula: string, b: number): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres: `Alumno ${cedula}`,
  apellidos: "Prueba W1",
  seccion: "5C",
  equipoId: EQ,
  base: b,
  avatar: { estilo: "adventurer-neutral", semilla: `s${cedula}` },
  actualizadoEn: 1,
});

const equipo: Equipo = {
  nombre: "5C-G8 Prueba W1",
  seccion: "5C",
  tema: null,
  capitanId: A,
  logoPath: null,
};

const tarea = (tipo: Tarea["tipo"]): Tarea => ({
  titulo: `Prueba W1 ${tipo}`,
  tipo,
  secciones: ["5C"],
  estado: "abierta",
  fechaEntrega: "2026-11-14",
  premio: null,
  preguntas: [{ id: "p1", enunciado: "Uno", formato: "texto", valor: 20 }],
  importada: false,
  autorId: PROFE,
  actualizadoEn: 1,
});

const entregada = (
  tareaId: string,
  tipo: Entrega["tipo"],
  titularId: string,
  integrantes: string[],
): Entrega => ({
  tareaId,
  tipo,
  titularId,
  seccion: "5C",
  integrantes,
  estado: "entregada",
  respuestas: { p1: { texto: "Respuesta" } },
  enviadaPor: integrantes[0] ?? null,
  enviadaEn: AHORA - 1000,
  evaluacion: null,
});

const ev = (puntaje: number, o: Partial<Evaluacion> = {}): Evaluacion => ({
  puntos: { p1: puntaje },
  comentarios: {},
  puntaje,
  evaluadaPor: PROFE,
  evaluadaEn: AHORA - 500,
  ...o,
});

const E_IND = idEntrega(T_IND, A);
const E_GRU = idEntrega(T_GRU, EQ);

async function entrega(id: string) {
  const e = await docs.entrega(db(), id);
  if (!e) throw new Error("sin entrega");
  return e;
}

async function ranking() {
  const r = await docs.rankingDe(db(), "5C");
  if (!r) throw new Error("sin ranking");
  return r;
}

beforeAll(async () => {
  base = await baseNueva();
  await docs.ponerUsuario(db(), alumno(A, 15));
  await docs.ponerUsuario(db(), alumno(B, 18));
  await docs.ponerEquipo(db(), EQ, equipo);
  await docs.ponerTarea(db(), T_IND, tarea("individual"));
  await docs.ponerTarea(db(), T_GRU, tarea("grupal"));
  await docs.ponerTarea(db(), T_FINAL, tarea("individual"));
  await docs.ponerEntrega(db(), E_IND, entregada(T_IND, "individual", A, [A]));
  await docs.ponerEntrega(db(), E_GRU, entregada(T_GRU, "grupal", EQ, [A, B]));
}, 30_000);

describe("evaluar con la base de esta tarea (Postgres)", () => {
  test("individual: se guarda la elegida y el ranking sale con ella, no con la vigente", async () => {
    const r = await evaluarEnTransaccion(
      db(),
      PROFE,
      {
        entregaId: E_IND,
        puntos: { p1: 20 },
        comentarios: {},
        version: null,
        bases: { [A]: 12 },
      },
      AHORA,
    );
    expect(r.ok).toBe(true);
    expect((await entrega(E_IND)).evaluacion?.bases).toEqual({ [A]: 12 });
    // 20 × 12 / 20 = 12 (con la vigente, 15)
    expect((await ranking()).alumnos[A]?.puntos).toBe(12);
    // La base de «Editar alumno» no cambia (D404)
    expect((await docs.usuario(db(), A))?.base).toBe(15);
  });

  test("grupal: una base por integrante; el equipo suma el puntaje sin base", async () => {
    const r = await evaluarEnTransaccion(
      db(),
      PROFE,
      {
        entregaId: E_GRU,
        puntos: { p1: 20 },
        comentarios: {},
        version: null,
        bases: { [B]: 10 },
      },
      AHORA + 10,
    );
    expect(r.ok).toBe(true);
    // A no vino en el envío: su vigente
    expect((await entrega(E_GRU)).evaluacion?.bases).toEqual({
      [A]: 15,
      [B]: 10,
    });
    const rk = await ranking();
    expect(rk.equipos[EQ]?.puntos).toBe(20);
    expect(rk.alumnos[A]?.puntos).toBe(12 + 15);
    expect(rk.alumnos[B]?.puntos).toBe(10);
  });

  test("una base para quien no es integrante no se guarda", async () => {
    const antes = await entrega(E_GRU);
    expect(
      await evaluarEnTransaccion(
        db(),
        PROFE,
        {
          entregaId: E_GRU,
          puntos: { p1: 18 },
          comentarios: {},
          version: AHORA + 10,
          bases: { [C]: 15 },
        },
        AHORA + 20,
      ),
    ).toEqual({ ok: false, error: "invalida" });
    expect((await entrega(E_GRU)).evaluacion).toEqual(antes.evaluacion);
  });

  test("puntaje final de la tarea 1: conserva la base que tenía; si no tenía, la vigente", async () => {
    const id = idEntrega(T_FINAL, B);
    const nuevo = await ponerPuntajeFinalEnTransaccion(
      db(),
      PROFE,
      { cedula: B, puntaje: 16 },
      AHORA + 30,
      T_FINAL,
    );
    expect(nuevo).toEqual({ ok: true });
    expect((await entrega(id)).evaluacion?.bases).toEqual({ [B]: 18 });

    await docs.ponerEntrega(db(), id, {
      ...(await entrega(id)),
      evaluacion: ev(16, { bases: { [B]: 11 } }),
    });
    await ponerPuntajeFinalEnTransaccion(
      db(),
      PROFE,
      { cedula: B, puntaje: 14 },
      AHORA + 40,
      T_FINAL,
    );
    const e = await entrega(id);
    expect(e.evaluacion?.puntaje).toBe(14);
    expect(e.evaluacion?.bases).toEqual({ [B]: 11 });
  });
});

describe("SQL bases por entrega (D407)", () => {
  const VIEJA = "w1-vieja";
  const VIEJA_GRU = "w1-vieja-gru";
  const CON_BASES = "w1-con-bases";
  const SIN_EVALUAR = "w1-sin-evaluar";

  test("pone la vigente a las evaluadas sin `bases` (y a su anterior); no toca lo demás", async () => {
    await docs.ponerEntrega(db(), VIEJA, {
      ...entregada("t-vieja", "individual", A, [A]),
      estado: "evaluada",
      evaluacion: ev(18),
      evaluacionAnterior: ev(10),
    });
    await docs.ponerEntrega(db(), VIEJA_GRU, {
      ...entregada("t-vieja-gru", "grupal", EQ, [A, B, C]),
      estado: "evaluada",
      evaluacion: ev(16, { noParticiparon: [B] }),
      // Estaba sin evaluar antes: «Deshacer» la deja Pendiente
      evaluacionAnterior: null,
    });
    await docs.ponerEntrega(db(), CON_BASES, {
      ...entregada("t-con-bases", "individual", B, [B]),
      estado: "evaluada",
      evaluacion: ev(20, { bases: { [B]: 12.5 } }),
    });
    await docs.ponerEntrega(
      db(),
      SIN_EVALUAR,
      entregada("t-sin-evaluar", "individual", A, [A]),
    );

    await ejecutarSql();

    const vieja = await entrega(VIEJA);
    expect(vieja.evaluacion).toEqual(ev(18, { bases: { [A]: 15 } }));
    expect(vieja.evaluacionAnterior).toEqual(ev(10, { bases: { [A]: 15 } }));
    const gru = await entrega(VIEJA_GRU);
    // C no tiene perfil: sin clave (cae a la vigente, que no existe)
    expect(gru.evaluacion?.bases).toEqual({ [A]: 15, [B]: 18 });
    expect(gru.evaluacion?.noParticiparon).toEqual([B]);
    expect(gru.evaluacionAnterior).toBeNull();
    expect((await entrega(CON_BASES)).evaluacion?.bases).toEqual({
      [B]: 12.5,
    });
    const sin = await entrega(SIN_EVALUAR);
    expect(sin.evaluacion).toBeNull();
    // Las de arriba, guardadas desde la app, ya traían las suyas
    expect((await entrega(E_GRU)).evaluacion?.bases).toEqual({
      [A]: 15,
      [B]: 10,
    });
  });

  test("una segunda pasada no cambia nada", async () => {
    const antes = await Promise.all(
      [VIEJA, VIEJA_GRU, CON_BASES, SIN_EVALUAR, E_IND, E_GRU].map(entrega),
    );
    await ejecutarSql();
    const despues = await Promise.all(
      [VIEJA, VIEJA_GRU, CON_BASES, SIN_EVALUAR, E_IND, E_GRU].map(entrega),
    );
    expect(despues).toEqual(antes);
  });
});
