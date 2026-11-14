// Presencia en «Evaluar entrega» sobre Postgres en memoria (pedido 8, D408–D410): la misma tabla
// que «Editar alumno» con la clave `entrega:<id>`, y las dos lecturas no se mezclan.
import { beforeAll, describe, expect, test } from "bun:test";
import {
  leerPresencia,
  leerPresenciaEntrega,
  marcarPresencia,
  quitarPresencia,
} from "@/lib/data/presencia";
import type { Db } from "@/lib/db";
import { claveEntrega, VIGENCIA_MS } from "@/lib/presencia";
import { baseNueva } from "./base";

let base: Db;
const db = () => base;

const AHORA = Date.UTC(2026, 10, 14, 16);
const PROFE_A = "39740011";
const PROFE_B = "39740012";
const ALUMNO = "39740013";
const ENTREGA = "identidad-marca__39740013";
const OTRA = "identidad-marca__39740014";

beforeAll(async () => {
  base = await baseNueva();
}, 30_000);

describe("presencia de una entrega (D408)", () => {
  test("marcar y leer por entrega; latir no mueve `desde`; quitar la borra", async () => {
    const clave = claveEntrega(ENTREGA);
    await marcarPresencia(db(), clave, PROFE_A, "Ana Pérez", AHORA);
    await marcarPresencia(db(), clave, PROFE_A, "Ana Pérez", AHORA + 20_000);
    expect(await leerPresenciaEntrega(db(), ENTREGA, AHORA + 20_000)).toEqual([
      {
        profeId: PROFE_A,
        nombre: "Ana Pérez",
        desde: AHORA,
        latido: AHORA + 20_000,
      },
    ]);
    await quitarPresencia(db(), clave, PROFE_A);
    expect(await leerPresenciaEntrega(db(), ENTREGA, AHORA + 20_000)).toEqual(
      [],
    );
  });

  test("dos profes en la misma entrega; otra entrega no se cuela", async () => {
    await marcarPresencia(db(), claveEntrega(ENTREGA), PROFE_A, "Ana", AHORA);
    await marcarPresencia(db(), claveEntrega(ENTREGA), PROFE_B, "Beto", AHORA);
    await marcarPresencia(db(), claveEntrega(OTRA), PROFE_B, "Beto", AHORA);
    const ids = (await leerPresenciaEntrega(db(), ENTREGA, AHORA))
      .map((e) => e.profeId)
      .sort();
    expect(ids).toEqual([PROFE_A, PROFE_B]);
    await quitarPresencia(db(), claveEntrega(ENTREGA), PROFE_B);
    expect(
      (await leerPresenciaEntrega(db(), ENTREGA, AHORA)).map((e) => e.profeId),
    ).toEqual([PROFE_A]);
    expect(
      (await leerPresenciaEntrega(db(), OTRA, AHORA)).map((e) => e.profeId),
    ).toEqual([PROFE_B]);
    await quitarPresencia(db(), claveEntrega(ENTREGA), PROFE_A);
    await quitarPresencia(db(), claveEntrega(OTRA), PROFE_B);
  });

  test("la de una entrega no sale en Alumnos, ni la de un alumno en Evaluar", async () => {
    await marcarPresencia(db(), claveEntrega(ENTREGA), PROFE_A, "Ana", AHORA);
    await marcarPresencia(db(), ALUMNO, PROFE_B, "Beto", AHORA);
    expect(await leerPresencia(db(), AHORA)).toEqual([
      {
        alumnoId: ALUMNO,
        entrada: {
          profeId: PROFE_B,
          nombre: "Beto",
          desde: AHORA,
          latido: AHORA,
        },
      },
    ]);
    expect(
      (await leerPresenciaEntrega(db(), ENTREGA, AHORA)).map((e) => e.profeId),
    ).toEqual([PROFE_A]);
    // Un id de entrega igual a la cédula no lee la fila del alumno
    expect(await leerPresenciaEntrega(db(), ALUMNO, AHORA)).toEqual([]);
    await quitarPresencia(db(), claveEntrega(ENTREGA), PROFE_A);
    await quitarPresencia(db(), ALUMNO, PROFE_B);
  });

  test("las vencidas no se leen (pestaña cerrada sin `pagehide`)", async () => {
    await marcarPresencia(db(), claveEntrega(ENTREGA), PROFE_A, "Ana", AHORA);
    expect(
      await leerPresenciaEntrega(db(), ENTREGA, AHORA + VIGENCIA_MS + 1),
    ).toEqual([]);
    expect(
      await leerPresenciaEntrega(db(), ENTREGA, AHORA + VIGENCIA_MS - 1),
    ).toHaveLength(1);
    await quitarPresencia(db(), claveEntrega(ENTREGA), PROFE_A);
  });
});
