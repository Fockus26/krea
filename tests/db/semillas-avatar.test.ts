// SQL de datos de D388 (`scripts/sql/2026-11-14-semillas-avatar.sql`) sobre PGlite: a quien tiene la
// cédula en la semilla del avatar le pone una opaca, conserva el estilo, copia la semilla al ranking
// (también a las filas viejas sin semilla) y una segunda pasada no cambia nada.
import { beforeAll, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import type { PGlite } from "@electric-sql/pglite";
import type { Db } from "@/lib/db";
import type { RankingSeccion, Usuario } from "@/lib/modelo";
import { baseNueva } from "./base";
import * as docs from "./docs";

const SQL = readFileSync("scripts/sql/2026-11-14-semillas-avatar.sql", "utf8");

let base: Db;
const db = () => base;
const ejecutar = () =>
  (base as unknown as { $client: PGlite }).$client.exec(SQL);

const OPACA = "0a1b2c3d4e5f60718293a4b5c6d7e8f9";
const SOLA = "39270001"; // semilla = su cédula
const CON_TANDA = "39270002"; // eligió otra opción: <cédula>-<tanda>-<i>
const YA_OPACA = "39270003"; // ya tiene una semilla opaca
const PROFE = "30270001";

const persona = (
  cedula: string,
  semilla: string,
  rol: Usuario["rol"] = "estudiante",
  estilo = "fun-emoji",
): Usuario => ({
  cedula,
  rol,
  nombres: "Ana",
  apellidos: "Semilla",
  seccion: rol === "estudiante" ? "5A" : null,
  equipoId: null,
  base: 20,
  avatar: { estilo, semilla },
  actualizadoEn: 7,
});

const fila = (semilla?: string): RankingSeccion["alumnos"][string] => ({
  nombres: "Ana",
  apellidos: "Semilla",
  equipoId: null,
  estilo: "fun-emoji",
  ...(semilla === undefined ? {} : { semilla }),
  puntos: 3,
});

beforeAll(async () => {
  base = await baseNueva();
  await docs.ponerUsuario(db(), persona(SOLA, SOLA));
  await docs.ponerUsuario(
    db(),
    persona(CON_TANDA, `${CON_TANDA}-3-5`, "estudiante", "bottts-neutral"),
  );
  await docs.ponerUsuario(db(), persona(YA_OPACA, OPACA));
  await docs.ponerUsuario(db(), persona(PROFE, PROFE, "profesor"));
  await docs.ponerRanking(db(), "5A", {
    alumnos: {
      [SOLA]: fila(SOLA),
      [CON_TANDA]: fila(), // documento viejo: sin semilla (el ranking caía a la cédula)
      [YA_OPACA]: fila(OPACA),
    },
    equipos: {},
    actualizadoEn: 1,
  });
  await docs.ponerRanking(db(), "5C", {
    alumnos: {},
    equipos: {},
    actualizadoEn: 1,
  });
}, 30_000);

describe("SQL semillas de avatar (D388)", () => {
  test("quita la cédula de perfiles y ranking, conserva estilo y lo ya opaco", async () => {
    await ejecutar();
    for (const c of [SOLA, CON_TANDA, PROFE]) {
      const u = await docs.usuario(db(), c);
      expect(u?.avatar.semilla).toMatch(/^[0-9a-f]{32}$/);
      expect(u?.avatar.semilla).not.toContain(c);
      expect(u?.actualizadoEn).toBe(7);
    }
    expect((await docs.usuario(db(), CON_TANDA))?.avatar.estilo).toBe(
      "bottts-neutral",
    );
    expect((await docs.usuario(db(), YA_OPACA))?.avatar.semilla).toBe(OPACA);

    const r = await docs.rankingDe(db(), "5A");
    for (const c of [SOLA, CON_TANDA, YA_OPACA])
      expect(r?.alumnos[c]?.semilla).toBe(
        (await docs.usuario(db(), c))?.avatar.semilla,
      );
    expect(r?.alumnos[SOLA]?.puntos).toBe(3);
    expect((await docs.rankingDe(db(), "5C"))?.alumnos).toEqual({});
  }, 30_000);

  test("idempotente: la segunda pasada no cambia nada", async () => {
    const antes = await Promise.all(
      [SOLA, CON_TANDA, YA_OPACA, PROFE].map((c) => docs.usuario(db(), c)),
    );
    const rankingAntes = await docs.rankingDe(db(), "5A");
    await ejecutar();
    expect(
      await Promise.all(
        [SOLA, CON_TANDA, YA_OPACA, PROFE].map((c) => docs.usuario(db(), c)),
      ),
    ).toEqual(antes);
    expect(await docs.rankingDe(db(), "5A")).toEqual(rankingAntes);
  }, 30_000);
});
