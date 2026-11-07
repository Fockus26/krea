// Catálogo de años y secciones contra el emulador de Firestore (D317, D318): la transacción real
// del Admin SDK que usan las Server Actions de lib/acciones/secciones.ts.
import { beforeAll, describe, expect, test } from "bun:test";
import {
  getApps as getAdminApps,
  initializeApp as initAdmin,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { operarSeccionesEnTransaccion } from "@/lib/firebase/secciones";
import { COL, DOC_SECCIONES, zCatalogoSecciones } from "@/lib/modelo";
import type { OperacionSecciones } from "@/lib/secciones";

const PROYECTO = process.env.GCLOUD_PROJECT ?? "demo-krea";
const app = () => getAdminApps()[0] ?? initAdmin({ projectId: PROYECTO });
const db = () => getFirestore(app());

const AHORA = Date.UTC(2026, 10, 7, 15);
// Años que no usa ninguna otra prueba (las demás viven en 5A/5C)
const ALUMNO_3A = "30300001";
const TAREA_3B = "x5a-tarea-3b";

const config = () => db().collection(COL.config).doc(DOC_SECCIONES);
const operar = (op: OperacionSecciones) =>
  operarSeccionesEnTransaccion(db(), op, AHORA);
const leer = async () => {
  const snap = await config().get();
  return snap.exists ? zCatalogoSecciones.parse(snap.data()).anios : null;
};

beforeAll(async () => {
  await config().delete();
  await db().collection(COL.usuarios).doc(ALUMNO_3A).delete();
  await db().collection(COL.tareas).doc(TAREA_3B).delete();
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
    await db().collection(COL.ranking).doc("4B").set({
      alumnos: {},
      equipos: {},
      actualizadoEn: 1,
    });
    expect(
      await operar({ tipo: "editarSeccion", codigo: "4B", letra: "D" }),
    ).toEqual({ ok: true });
    expect((await leer())?.[0]).toEqual({ numero: 4, letras: ["A", "D"] });
    expect((await db().collection(COL.ranking).doc("4B").get()).exists).toBe(
      false,
    );
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
    await db().collection(COL.usuarios).doc(ALUMNO_3A).set({
      rol: "estudiante",
      seccion: "3A",
    });
    await db()
      .collection(COL.tareas)
      .doc(TAREA_3B)
      .set({ estado: "borrador", secciones: ["5A", "3B"] });

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

    await db().collection(COL.usuarios).doc(ALUMNO_3A).delete();
    await db().collection(COL.tareas).doc(TAREA_3B).delete();
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
