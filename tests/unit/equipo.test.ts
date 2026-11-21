import { describe, expect, test } from "bun:test";
import { CEDULA_SIN_EQUIPO, equipoVistaDe } from "@/lib/demo/equipo";
import { alumnoPorCedula } from "@/lib/demo/seed";
import {
  enJuegoTexto,
  eyebrowEquipo,
  ganadorPremio,
  nombreIntegranteTexto,
  premioGanadoTexto,
} from "@/lib/equipo";

describe("textos", () => {
  test("lienzo", () => {
    expect(eyebrowEquipo("5A")).toBe("Mi equipo · 5A");
    expect(enJuegoTexto("Salida al cine con todo pago")).toBe(
      "En juego: Salida al cine con todo pago",
    );
    expect(premioGanadoTexto("Presentación de la marca", 19)).toBe(
      "Mejor nota en Presentación de la marca · 19",
    );
    expect(nombreIntegranteTexto("Raquel Figueroa", true)).toBe(
      "Raquel Figueroa, tú",
    );
  });
});

describe("ganadorPremio", () => {
  test("mejor nota única gana; empate o sin notas → nadie (§9 #3)", () => {
    expect(
      ganadorPremio([
        { id: "a", nota: 17 },
        { id: "b", nota: 19 },
      ]),
    ).toBe("b");
    expect(
      ganadorPremio([
        { id: "a", nota: 19 },
        { id: "b", nota: 19 },
      ]),
    ).toBeNull();
    expect(ganadorPremio([{ id: "a", nota: null }])).toBeNull();
  });
});

describe("datos de ejemplo (seed)", () => {
  test("5A-G2: #1 de 6, 19 pts, capitana primero, gana el premio de la grupal evaluada", () => {
    const d = equipoVistaDe();
    expect(d?.equipo.puesto).toBe("#1 de 6");
    expect(d?.equipo.puntos).toBe(19);
    expect(d?.integrantes[0]?.esCapitan).toBe(true);
    expect(d?.integrantes[0]?.esTu).toBe(true);
    expect(d?.integrantes[0]?.puntos).toBe(37.5);
    expect(d?.premios).toHaveLength(1);
  });
  test("la grupal pendiente lleva el premio en juego y nunca 0 (D003)", () => {
    const pendiente = equipoVistaDe()?.notas.find((n) => n.nota === null);
    expect(pendiente?.enJuego).toStartWith("En juego: ");
  });
  test("sin equipo → null (vacío)", () => {
    expect(equipoVistaDe(alumnoPorCedula(CEDULA_SIN_EQUIPO))).toBeNull();
  });
});
