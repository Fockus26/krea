// Opciones fijas de Ajustes de puntos sobre Postgres en memoria (D375, D327): la transacción real
// que usan las Server Actions de lib/acciones/motivos.ts, y el ajuste que busca su opción en la
// misma transacción.
import { beforeAll, describe, expect, test } from "bun:test";
import { aplicarAjusteEnTransaccion } from "@/lib/data/ajustes";
import { leerMotivos, operarMotivosEnTransaccion } from "@/lib/data/motivos";
import type { Db } from "@/lib/db";
import { DOC_MOTIVOS, type Usuario } from "@/lib/modelo";
import {
  MOTIVOS_INICIALES,
  type OperacionMotivos,
  type ResultadoMotivos,
} from "@/lib/motivos";
import { baseNueva } from "./base";
import { ajuste, ponerConfig, ponerUsuario, rankingDe, snap } from "./docs";

let base: Db;
const db = () => base;

const AHORA = Date.UTC(2026, 10, 13, 15);
const PROFE = "45001237";
const ALUMNO = "39800001";

const operar = (op: OperacionMotivos, ahora = AHORA) =>
  operarMotivosEnTransaccion(db(), op, ahora);
const lista = (r: ResultadoMotivos) => (r.ok ? r.motivos : null);

const alumno: Usuario = {
  cedula: ALUMNO,
  rol: "estudiante",
  nombres: "Alumno",
  apellidos: "Prueba Motivos",
  seccion: "5A",
  equipoId: null,
  base: 20,
  avatar: { estilo: "adventurer-neutral", semilla: ALUMNO },
  actualizadoEn: 1,
};

beforeAll(async () => {
  base = await baseNueva();
  await ponerUsuario(db(), alumno);
}, 30_000);

describe("config/motivos (D375)", () => {
  test("sin fila vale el inicial; la primera escritura lo materializa con la opción nueva", async () => {
    expect((await snap(db(), "config", DOC_MOTIVOS)).exists).toBe(false);
    expect(await leerMotivos(db())).toEqual(MOTIVOS_INICIALES);
    const r = await operar({
      tipo: "crear",
      id: "m-1",
      etiqueta: "Trajo material",
      valor: 1,
    });
    expect(lista(r)).toEqual([
      ...MOTIVOS_INICIALES,
      { id: "m-1", etiqueta: "Trajo material", valor: 1 },
    ]);
    expect(await leerMotivos(db())).toEqual(lista(r));
    expect(
      (await snap(db(), "config", DOC_MOTIVOS)).data()?.actualizadoEn,
    ).toBe(AHORA);
  });

  test("editar y repetir etiqueta: el error no escribe", async () => {
    expect(
      lista(
        await operar({
          tipo: "editar",
          id: "m-1",
          etiqueta: "Trajo materiales",
          valor: 1.5,
        }),
      )?.at(-1),
    ).toEqual({ id: "m-1", etiqueta: "Trajo materiales", valor: 1.5 });
    const antes = await leerMotivos(db());
    expect(
      await operar({
        tipo: "crear",
        id: "m-2",
        etiqueta: "trajo MATERIALES",
        valor: 1,
      }),
    ).toEqual({ ok: false, error: "repetida" });
    expect(await leerMotivos(db())).toEqual(antes);
  });

  test("un ajuste guarda la etiqueta del catálogo; borrar la opción no cambia el historial", async () => {
    const r = await aplicarAjusteEnTransaccion(
      db(),
      PROFE,
      {
        destino: "alumno",
        destinoId: ALUMNO,
        motivoId: "m-1",
        valor: 2,
        nota: "",
      },
      AHORA + 1,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(await ajuste(db(), r.id)).toMatchObject({
      motivoId: "m-1",
      motivo: "Trajo materiales",
      valor: 2,
      nota: null,
    });
    expect(lista(await operar({ tipo: "borrar", id: "m-1" }))).toEqual(
      MOTIVOS_INICIALES,
    );
    expect((await ajuste(db(), r.id))?.motivo).toBe("Trajo materiales");
  });

  test("un ajuste con una opción borrada da `motivo` y no mueve el ranking", async () => {
    const antes = (await rankingDe(db(), "5A"))?.alumnos[ALUMNO]?.puntos;
    expect(
      await aplicarAjusteEnTransaccion(
        db(),
        PROFE,
        {
          destino: "alumno",
          destinoId: ALUMNO,
          motivoId: "m-1",
          valor: 1,
          nota: "",
        },
        AHORA + 2,
      ),
    ).toEqual({ ok: false, error: "motivo" });
    expect((await rankingDe(db(), "5A"))?.alumnos[ALUMNO]?.puntos).toBe(antes);
  });

  test("dos profes a la vez: las dos opciones quedan", async () => {
    const [a, b] = await Promise.all([
      operar({ tipo: "crear", id: "m-a", etiqueta: "Opción A", valor: 1 }),
      operar({ tipo: "crear", id: "m-b", etiqueta: "Opción B", valor: -1 }),
    ]);
    expect(a.ok && b.ok).toBe(true);
    const ids = (await leerMotivos(db()))?.map((m) => m.id) ?? [];
    expect(ids).toContain("m-a");
    expect(ids).toContain("m-b");
  });

  test("la última no se borra; una fila que no valida responde `invalida`", async () => {
    await ponerConfig(db(), DOC_MOTIVOS, {
      motivos: [{ id: "solo", etiqueta: "Única", valor: 1 }],
      actualizadoEn: 1,
    });
    expect(await operar({ tipo: "borrar", id: "solo" })).toEqual({
      ok: false,
      error: "ultima",
    });
    await ponerConfig(db(), DOC_MOTIVOS, { motivos: [], actualizadoEn: 1 });
    expect(await leerMotivos(db())).toBeNull();
    expect(
      await operar({ tipo: "crear", id: "m-x", etiqueta: "X", valor: 1 }),
    ).toEqual({ ok: false, error: "invalida" });
  });
});
