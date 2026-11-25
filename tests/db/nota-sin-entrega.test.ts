// Poner nota sin entrega (D581) sobre PGlite: crea la entrega evaluada y sin respuestas, con la
// base vigente de cada integrante, mueve el ranking en la misma transacción, deja que el alumno la
// complete después (`modoEnvio` = completar) y no pisa una entrega que ya existe.
import { beforeAll, describe, expect, test } from "bun:test";
import { ponerNotaSinEntregaEnTransaccion } from "@/lib/data/nota-sin-entrega";
import type { Db } from "@/lib/db";
import { modoEnvio } from "@/lib/entregas";
import {
  type Entrega,
  type Equipo,
  idEntrega,
  type Tarea,
  type Usuario,
} from "@/lib/modelo";
import { baseNueva } from "./base";
import * as docs from "./docs";

let base: Db;
const db = () => base;

const AHORA = Date.UTC(2026, 10, 24, 15);
const PROFE = "30581001";
const A = "39581001"; // base 15, equipo EQ
const B = "39581002"; // base 18, equipo EQ
const OTRA = "39581003"; // 5A: no es de la sección de la tarea
const EQ = "n1-g1";
const EQ_VACIO = "n1-g2";
const T_IND = "n1-ind";
const T_GRU = "n1-gru";
const T_BORRADOR = "n1-borrador";

const alumno = (
  cedula: string,
  b: number,
  o: Partial<Usuario> = {},
): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres: `Alumno ${cedula}`,
  apellidos: "Prueba N1",
  seccion: "5C",
  equipoId: EQ,
  base: b,
  avatar: { estilo: "adventurer-neutral", semilla: `s${cedula}` },
  actualizadoEn: 1,
  ...o,
});

const equipo = (nombre: string): Equipo => ({
  nombre,
  seccion: "5C",
  tema: null,
  capitanId: null,
  logoPath: null,
});

const tarea = (tipo: Tarea["tipo"], o: Partial<Tarea> = {}): Tarea => ({
  titulo: `Prueba N1 ${tipo}`,
  tipo,
  secciones: ["5C"],
  estado: "abierta",
  fechaEntrega: "2026-11-30",
  premio: null,
  preguntas: [{ id: "p1", enunciado: "Uno", formato: "texto", valor: 20 }],
  importada: false,
  autorId: PROFE,
  actualizadoEn: 1,
  ...o,
});

async function entrega(id: string) {
  const e = await docs.entrega(db(), id);
  if (!e) throw new Error("sin entrega");
  return e;
}

const poner = (tareaId: string, titularId: string, puntaje: number) =>
  ponerNotaSinEntregaEnTransaccion(
    db(),
    PROFE,
    { tareaId, titularId, puntaje },
    AHORA,
  );

beforeAll(async () => {
  base = await baseNueva();
  await docs.ponerUsuario(db(), alumno(A, 15));
  await docs.ponerUsuario(db(), alumno(B, 18));
  await docs.ponerUsuario(
    db(),
    alumno(OTRA, 20, { seccion: "5A", equipoId: null }),
  );
  await docs.ponerEquipo(db(), EQ, equipo("5C-G1 Prueba N1"));
  await docs.ponerEquipo(db(), EQ_VACIO, equipo("5C-G2 Vacío N1"));
  await docs.ponerTarea(db(), T_IND, tarea("individual"));
  await docs.ponerTarea(db(), T_GRU, tarea("grupal"));
  await docs.ponerTarea(
    db(),
    T_BORRADOR,
    tarea("individual", { estado: "borrador" }),
  );
}, 30_000);

describe("poner nota sin entrega (Postgres)", () => {
  test("individual: evaluada sin respuestas, con la base vigente, y el ranking la cuenta", async () => {
    expect(await poner(T_IND, A, 16)).toEqual({ ok: true });
    const e = await entrega(idEntrega(T_IND, A));
    expect(e.estado).toBe("evaluada");
    expect(e.respuestas).toEqual({});
    expect(e.integrantes).toEqual([A]);
    expect(e.enviadaPor).toBeNull();
    expect(e.evaluacion?.puntos).toBeNull();
    expect(e.evaluacion?.puntaje).toBe(16);
    expect(e.evaluacion?.evaluadaPor).toBe(PROFE);
    expect(e.evaluacion?.bases).toEqual({ [A]: 15 });
    // 16 × 15 / 20 = 12
    expect((await docs.rankingDe(db(), "5C"))?.alumnos[A]?.puntos).toBe(12);
    // El alumno puede subir sus respuestas después sin perder la nota
    expect(modoEnvio(e, [{ id: "p1" }])).toEqual({
      ok: true,
      modo: "completar",
    });
  });

  test("grupal: integrantes de hoy, una base por cada uno", async () => {
    expect(await poner(T_GRU, EQ, 20)).toEqual({ ok: true });
    const e = await entrega(idEntrega(T_GRU, EQ));
    expect(e.tipo).toBe("grupal");
    expect(e.integrantes).toEqual([A, B]);
    expect(e.evaluacion?.bases).toEqual({ [A]: 15, [B]: 18 });
  });

  test("no pisa una entrega que ya existe", async () => {
    expect(await poner(T_IND, A, 10)).toEqual({
      ok: false,
      error: "ya-entregada",
    });
    expect((await entrega(idEntrega(T_IND, A))).evaluacion?.puntaje).toBe(16);

    const enviada: Entrega = {
      tareaId: T_IND,
      tipo: "individual",
      titularId: B,
      seccion: "5C",
      integrantes: [B],
      estado: "entregada",
      respuestas: { p1: { texto: "Respuesta" } },
      enviadaPor: B,
      enviadaEn: AHORA - 1000,
      evaluacion: null,
    };
    await docs.ponerEntrega(db(), idEntrega(T_IND, B), enviada);
    expect(await poner(T_IND, B, 10)).toEqual({
      ok: false,
      error: "ya-entregada",
    });
    expect((await entrega(idEntrega(T_IND, B))).estado).toBe("entregada");
  });

  test("rechaza borradores, titulares de otra sección y equipos vacíos", async () => {
    expect(await poner(T_BORRADOR, A, 10)).toEqual({
      ok: false,
      error: "sin-tarea",
    });
    expect(await poner("n1-no-existe", A, 10)).toEqual({
      ok: false,
      error: "sin-tarea",
    });
    expect(await poner(T_IND, OTRA, 10)).toEqual({
      ok: false,
      error: "no-existe",
    });
    expect(await poner(T_IND, "39581999", 10)).toEqual({
      ok: false,
      error: "no-existe",
    });
    expect(await poner(T_GRU, EQ_VACIO, 10)).toEqual({
      ok: false,
      error: "sin-integrantes",
    });
    expect(await docs.entrega(db(), idEntrega(T_GRU, EQ_VACIO))).toBeNull();
  });
});
