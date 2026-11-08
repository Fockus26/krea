// Catálogo de años y secciones sobre Postgres en memoria (D327) (D317, D318): la transacción real
// del Admin SDK que usan las Server Actions de lib/acciones/secciones.ts.
import { beforeAll, describe, expect, test } from "bun:test";
import { operarSeccionesEnTransaccion } from "@/lib/data/secciones";
import type { Db } from "@/lib/db";
import { DOC_SECCIONES, zCatalogoSecciones } from "@/lib/modelo";
import type { OperacionSecciones } from "@/lib/secciones";
import { baseNueva } from "./base";
import * as docs from "./docs";

let base: Db;
const db = () => base;

const AHORA = Date.UTC(2026, 10, 7, 15);
// Años que no usa ninguna otra prueba (las demás viven en 5A/5C)
const ALUMNO_3A = "30300001";
const TAREA_3B = "x5a-tarea-3b";

const config = () => ({
  get: () => docs.snap(db(), "config", DOC_SECCIONES),
  set: (v: Record<string, unknown>) =>
    docs.ponerDoc(db(), "config", DOC_SECCIONES, v),
  delete: () => docs.borrarDoc(db(), "config", DOC_SECCIONES),
});
const operar = (op: OperacionSecciones) =>
  operarSeccionesEnTransaccion(db(), op, AHORA);
const leer = async () => {
  const snap = await config().get();
  return snap.exists ? zCatalogoSecciones.parse(snap.data()).anios : null;
};

beforeAll(async () => {
  base = await baseNueva();
  await config().delete();
  await docs.borrarDoc(db(), "usuarios", ALUMNO_3A);
  await docs.borrarDoc(db(), "tareas", TAREA_3B);
}, 30_000);

describe("catálogo de secciones (D317)", () => {
  test("sin documento vale el inicial: la primera escritura lo materializa con el año nuevo", async () => {
    expect(await leer()).toBeNull();
    expect(
      await operar({ tipo: "crearAnio", numero: 4, letras: ["B", "A"] }),
    ).toEqual({
      ok: true,
    });
    expect(await leer()).toEqual([
      { numero: 4, letras: ["A", "B"] },
      { numero: 5, letras: ["A", "C"] },
    ]);
    expect((await config().get()).data()?.actualizadoEn).toBe(AHORA);
  });

  test("crear lo que ya existe responde el error y no duplica", async () => {
    expect(await operar({ tipo: "crearAnio", numero: 4, letras: [] })).toEqual({
      ok: false,
      error: "existe-anio",
    });
    expect(
      await operar({ tipo: "crearSeccion", numero: 4, letra: "A" }),
    ).toEqual({ ok: false, error: "existe-seccion" });
    expect((await leer())?.[0]).toEqual({ numero: 4, letras: ["A", "B"] });
  });

  test("renombrar una sección vacía (4B → 4D) borra su ranking viejo", async () => {
    await docs.ponerDoc(db(), "ranking", "4B", {
      alumnos: {},
      equipos: {},
      actualizadoEn: 1,
    });
    expect(
      await operar({ tipo: "editarSeccion", codigo: "4B", letra: "D" }),
    ).toEqual({ ok: true });
    expect((await leer())?.[0]).toEqual({ numero: 4, letras: ["A", "D"] });
    expect((await docs.snap(db(), "ranking", "4B")).exists).toBe(false);
    expect(await operar({ tipo: "eliminarSeccion", codigo: "4D" })).toEqual({
      ok: true,
    });
    expect((await leer())?.[0]).toEqual({ numero: 4, letras: ["A"] });
    expect(await operar({ tipo: "eliminarSeccion", codigo: "4D" })).toEqual({
      ok: false,
      error: "no-existe",
    });
  });

  test("con datos (alumno o tarea) no se renombra ni se elimina (D318)", async () => {
    expect(
      await operar({ tipo: "crearAnio", numero: 3, letras: ["A", "B"] }),
    ).toEqual({
      ok: true,
    });
    await docs.ponerDoc(db(), "usuarios", ALUMNO_3A, {
      cedula: ALUMNO_3A,
      rol: "estudiante",
      nombres: "Alumno",
      apellidos: "Tercero",
      seccion: "3A",
      equipoId: null,
      base: 20,
      avatar: { estilo: "lorelei", semilla: ALUMNO_3A },
      actualizadoEn: 1,
    });
    await docs.ponerDoc(db(), "tareas", TAREA_3B, {
      titulo: "Borrador 3B",
      tipo: "individual",
      secciones: ["5A", "3B"],
      estado: "borrador",
      fechaEntrega: null,
      premio: null,
      preguntas: [],
      importada: false,
      autorId: null,
      actualizadoEn: 1,
    });

    expect(await operar({ tipo: "eliminarSeccion", codigo: "3A" })).toEqual({
      ok: false,
      error: "con-datos",
    });
    expect(
      await operar({ tipo: "editarSeccion", codigo: "3B", letra: "C" }),
    ).toEqual({ ok: false, error: "con-datos" });
    expect(await operar({ tipo: "editarAnio", de: 3, a: 2 })).toEqual({
      ok: false,
      error: "con-datos",
    });
    expect(await operar({ tipo: "eliminarAnio", numero: 3 })).toEqual({
      ok: false,
      error: "con-datos",
    });
    expect((await leer())?.[0]).toEqual({ numero: 3, letras: ["A", "B"] });

    await docs.borrarDoc(db(), "usuarios", ALUMNO_3A);
    await docs.borrarDoc(db(), "tareas", TAREA_3B);
    expect(await operar({ tipo: "editarAnio", de: 3, a: 2 })).toEqual({
      ok: true,
    });
    expect((await leer())?.[0]).toEqual({ numero: 2, letras: ["A", "B"] });
    expect(await operar({ tipo: "eliminarAnio", numero: 2 })).toEqual({
      ok: true,
    });
    expect(await operar({ tipo: "eliminarAnio", numero: 4 })).toEqual({
      ok: true,
    });
    expect(await leer()).toEqual([{ numero: 5, letras: ["A", "C"] }]);
  });

  test("documento con anios: [] es la escuela sin secciones (no resucita el inicial)", async () => {
    await config().set({ anios: [], actualizadoEn: 1 });
    expect(
      await operar({ tipo: "crearSeccion", numero: 5, letra: "A" }),
    ).toEqual({ ok: false, error: "no-existe" });
    expect(await leer()).toEqual([]);
    // Lo deja como estaba para las demás pruebas (documento ausente = inicial)
    await config().delete();
  });
});
