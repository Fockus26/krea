import { describe, expect, test } from "bun:test";
import {
  coinciden,
  formatCuenta,
  PASSWORD_MIN,
  passwordFaltanTexto,
  passwordOkTexto,
  reenviarTexto,
  validarPassword,
} from "@/lib/auth";

describe("validarPassword", () => {
  test("vacía, corta y ok con el mínimo de 8", () => {
    expect(PASSWORD_MIN).toBe(8);
    expect(validarPassword("")).toEqual({ estado: "vacia" });
    expect(validarPassword("krea")).toEqual({ estado: "corta", faltan: 4 });
    expect(validarPassword("krea2026")).toEqual({ estado: "ok", largo: 8 });
    expect(validarPassword("krea2026!")).toEqual({ estado: "ok", largo: 9 });
  });
  test("un emoji cuenta como un carácter", () => {
    expect(validarPassword("krea202😀")).toEqual({ estado: "ok", largo: 8 });
  });
  test("textos", () => {
    expect(passwordOkTexto(9)).toBe("9 caracteres · cumple el mínimo");
    expect(passwordFaltanTexto(1)).toBe("Falta 1 carácter");
    expect(passwordFaltanTexto(3)).toBe("Faltan 3 caracteres");
  });
});

describe("coinciden", () => {
  test("null mientras la repetición está vacía", () => {
    expect(coinciden("abc", "")).toBeNull();
    expect(coinciden("abc", "abc")).toBe(true);
    expect(coinciden("abc", "abd")).toBe(false);
  });
});

describe("cuenta regresiva", () => {
  test("m:ss y texto del botón", () => {
    expect(formatCuenta(45)).toBe("0:45");
    expect(formatCuenta(60)).toBe("1:00");
    expect(formatCuenta(5)).toBe("0:05");
    expect(formatCuenta(-3)).toBe("0:00");
    expect(reenviarTexto(45)).toBe("Reenviar enlace en 0:45");
    expect(reenviarTexto(0)).toBe("Reenviar enlace");
  });
});
