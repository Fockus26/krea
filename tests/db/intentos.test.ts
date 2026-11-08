// Límite de login por cuenta (D327, QA 2026-11-08): solo cuentan los fallos, y un salón entero
// entrando desde la misma IP no se bloquea.
import { beforeAll, describe, expect, test } from "bun:test";
import {
  cuentaBloqueada,
  limpiarFallos,
  MAX_FALLOS,
  registrarFallo,
  VENTANA_FALLOS_MS,
} from "@/lib/data/intentos";
import type { Db } from "@/lib/db";
import { baseNueva } from "./base";

const EMAIL = "33696102@krea.local";

let db: Db;
beforeAll(async () => {
  db = await baseNueva();
});

describe("fallos de login por cuenta", () => {
  test(`bloquea tras ${MAX_FALLOS} fallos seguidos, no antes`, async () => {
    const t = 1_000_000;
    for (let i = 0; i < MAX_FALLOS - 1; i++)
      await registrarFallo(db, EMAIL, t + i);
    expect(await cuentaBloqueada(db, EMAIL, t + 10)).toBe(false);
    await registrarFallo(db, EMAIL, t + 10);
    expect(await cuentaBloqueada(db, EMAIL, t + 11)).toBe(true);
    // Otra cuenta (otro alumno del mismo salón) no se ve afectada
    expect(await cuentaBloqueada(db, "34834242@krea.local", t + 11)).toBe(
      false,
    );
  });

  test("el bloqueo vence a los 5 minutos del último fallo y la cuenta vuelve a empezar", async () => {
    const EMAIL1 = `1${EMAIL}`;
    const t = 1_000_000;
    for (let i = 0; i < MAX_FALLOS; i++) await registrarFallo(db, EMAIL1, t);
    expect(await cuentaBloqueada(db, EMAIL1, t + VENTANA_FALLOS_MS - 1)).toBe(
      true,
    );
    expect(await cuentaBloqueada(db, EMAIL1, t + VENTANA_FALLOS_MS)).toBe(
      false,
    );
    await registrarFallo(db, EMAIL1, t + VENTANA_FALLOS_MS + 1);
    expect(await cuentaBloqueada(db, EMAIL1, t + VENTANA_FALLOS_MS + 2)).toBe(
      false,
    );
  });

  test("un ingreso bueno borra los fallos; mayúsculas y espacios son la misma cuenta", async () => {
    const EMAIL2 = `2${EMAIL}`;
    const t = 1_000_000;
    for (let i = 0; i < MAX_FALLOS - 1; i++)
      await registrarFallo(db, ` ${EMAIL2.toUpperCase()} `, t);
    await limpiarFallos(db, EMAIL2);
    await registrarFallo(db, EMAIL2, t);
    expect(await cuentaBloqueada(db, EMAIL2, t)).toBe(false);
  });
});
