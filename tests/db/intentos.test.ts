// Límite de login por cuenta (D327, QA 2026-11-08): solo cuentan los fallos, y un salón entero
// entrando desde la misma IP no se bloquea. El intento se reserva antes de evaluar (D492, F-A1 v2).
import { beforeAll, describe, expect, test } from "bun:test";
import {
  devolverIntento,
  limpiarFallos,
  MAX_FALLOS,
  reservarIntento,
  VENTANA_FALLOS_MS,
} from "@/lib/data/intentos";
import type { Db } from "@/lib/db";
import { baseNueva } from "./base";

const EMAIL = "45025977@krea.local";

let db: Db;
beforeAll(async () => {
  db = await baseNueva();
});

describe("fallos de login por cuenta", () => {
  test(`deja ${MAX_FALLOS} intentos y bloquea el siguiente`, async () => {
    const t = 1_000_000;
    for (let i = 0; i < MAX_FALLOS; i++)
      expect(await reservarIntento(db, EMAIL, t + i)).toBe(true);
    expect(await reservarIntento(db, EMAIL, t + 10)).toBe(false);
    expect(await reservarIntento(db, EMAIL, t + 11)).toBe(false);
    // Otra cuenta (otro alumno del mismo salón) no se ve afectada
    expect(await reservarIntento(db, "45074220@krea.local", t + 11)).toBe(true);
  });

  test("el bloqueo vence a los 5 minutos del último fallo; insistir bloqueado no lo alarga", async () => {
    const EMAIL1 = `1${EMAIL}`;
    const t = 1_000_000;
    for (let i = 0; i < MAX_FALLOS; i++) await reservarIntento(db, EMAIL1, t);
    expect(await reservarIntento(db, EMAIL1, t + VENTANA_FALLOS_MS - 1)).toBe(
      false,
    );
    expect(await reservarIntento(db, EMAIL1, t + VENTANA_FALLOS_MS)).toBe(true);
    // Vuelve a empezar en 1: quedan 4 más
    for (let i = 1; i < MAX_FALLOS; i++)
      expect(await reservarIntento(db, EMAIL1, t + VENTANA_FALLOS_MS)).toBe(
        true,
      );
    expect(await reservarIntento(db, EMAIL1, t + VENTANA_FALLOS_MS)).toBe(
      false,
    );
  });

  test("30 reservas en paralelo: como mucho 5 permitidas", async () => {
    const EMAIL3 = `3${EMAIL}`;
    const rs = await Promise.all(
      Array.from({ length: 30 }, () => reservarIntento(db, EMAIL3, 1_000_000)),
    );
    expect(rs.filter(Boolean).length).toBe(MAX_FALLOS);
  });

  test("un intento devuelto no cuenta", async () => {
    const EMAIL4 = `4${EMAIL}`;
    const t = 1_000_000;
    for (let i = 0; i < MAX_FALLOS - 1; i++)
      await reservarIntento(db, EMAIL4, t);
    expect(await reservarIntento(db, EMAIL4, t)).toBe(true);
    await devolverIntento(db, EMAIL4);
    expect(await reservarIntento(db, EMAIL4, t)).toBe(true);
    expect(await reservarIntento(db, EMAIL4, t)).toBe(false);
  });

  test("un ingreso bueno borra los fallos; mayúsculas y espacios son la misma cuenta", async () => {
    const EMAIL2 = `2${EMAIL}`;
    const t = 1_000_000;
    for (let i = 0; i < MAX_FALLOS - 1; i++)
      await reservarIntento(db, ` ${EMAIL2.toUpperCase()} `, t);
    expect(await reservarIntento(db, EMAIL2, t)).toBe(true);
    expect(await reservarIntento(db, EMAIL2, t)).toBe(false);
    await limpiarFallos(db, EMAIL2);
    expect(await reservarIntento(db, EMAIL2, t)).toBe(true);
  });
});
