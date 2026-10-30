import { describe, expect, test } from "bun:test";
import {
  CEDULA_MSG_FALTAN,
  CEDULA_MSG_SOLO_NUMEROS,
  pasteCedula,
  sanitizeCedula,
  validateCedula,
} from "@/lib/cedula";

describe("sanitizeCedula", () => {
  test("pegar 'V-12.345.678' deja 12345678", () => {
    expect(sanitizeCedula("V-12.345.678")).toBe("12345678");
  });
  test("descarta letras y espacios", () => {
    expect(sanitizeCedula(" 1a2 b3 ")).toBe("123");
  });
  test("corta en 9 dígitos", () => {
    expect(sanitizeCedula("1234567890")).toBe("123456789");
  });
});

describe("validateCedula (mensajes literales del handoff)", () => {
  test("7, 8 y 9 dígitos son válidas", () => {
    expect(validateCedula("1234567")).toBeNull();
    expect(validateCedula("12345678")).toBeNull();
    expect(validateCedula("123456789")).toBeNull();
  });
  test("6 dígitos faltan", () => {
    expect(validateCedula("123456")).toBe(CEDULA_MSG_FALTAN);
  });
  test("vacía: faltan dígitos", () => {
    expect(validateCedula("")).toBe(CEDULA_MSG_FALTAN);
  });
  test("10 dígitos: solo números de 7 a 9", () => {
    expect(validateCedula("1234567890")).toBe(CEDULA_MSG_SOLO_NUMEROS);
  });
  test("letras y puntos: solo números", () => {
    expect(validateCedula("V12345678")).toBe(CEDULA_MSG_SOLO_NUMEROS);
    expect(validateCedula("12.345.678")).toBe(CEDULA_MSG_SOLO_NUMEROS);
  });
  test("los textos son los del handoff", () => {
    expect(CEDULA_MSG_SOLO_NUMEROS).toBe(
      "La cédula lleva solo números: de 7 a 9 dígitos.",
    );
    expect(CEDULA_MSG_FALTAN).toBe(
      "Faltan dígitos: la cédula tiene de 7 a 9 números.",
    );
  });
});

describe("pasteCedula", () => {
  test("pegar en campo vacío sanea antes de cortar", () => {
    expect(pasteCedula("", 0, 0, "V-12.345.678")).toEqual({
      value: "12345678",
      caret: 8,
    });
  });
  test("reemplaza la selección", () => {
    expect(pasteCedula("1234567", 2, 4, "99")).toEqual({
      value: "1299567",
      caret: 4,
    });
  });
  test("no pasa de 9 dígitos y el cursor no se sale", () => {
    expect(pasteCedula("12345", 5, 5, "6789 0123")).toEqual({
      value: "123456789",
      caret: 9,
    });
  });
});
