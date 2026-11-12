import { describe, expect, test } from "bun:test";
import {
  CLAVE_EVENTO_INSTALAR,
  esDispositivoIOS,
  estadoInstalacion,
  INSTALAR_SCRIPT,
} from "@/lib/instalar-pwa";

const base = {
  standalone: false,
  iosStandalone: false,
  esIOS: false,
  hayEvento: false,
};

describe("estadoInstalacion (D369)", () => {
  test("ya instalada (standalone o iOS standalone): nada", () => {
    expect(
      estadoInstalacion({ ...base, standalone: true, hayEvento: true }),
    ).toBe("instalada");
    expect(
      estadoInstalacion({ ...base, iosStandalone: true, esIOS: true }),
    ).toBe("instalada");
  });
  test("con evento: disponible", () => {
    expect(estadoInstalacion({ ...base, hayEvento: true })).toBe("disponible");
  });
  test("iOS sin standalone: pasos", () => {
    expect(estadoInstalacion({ ...base, esIOS: true })).toBe("ios");
  });
  test("otro navegador sin evento: no disponible", () => {
    expect(estadoInstalacion(base)).toBe("no-disponible");
  });
});

describe("esDispositivoIOS", () => {
  test("iPhone por userAgent", () => {
    expect(esDispositivoIOS("iPhone", "Mozilla/5.0 (iPhone; CPU)", 5)).toBe(
      true,
    );
  });
  test("iPad que se presenta como Mac (táctil)", () => {
    expect(esDispositivoIOS("MacIntel", "Mozilla/5.0 (Macintosh)", 5)).toBe(
      true,
    );
  });
  test("Mac real (sin táctil) y Android no son iOS", () => {
    expect(esDispositivoIOS("MacIntel", "Mozilla/5.0 (Macintosh)", 0)).toBe(
      false,
    );
    expect(esDispositivoIOS("Linux armv8l", "Mozilla/5.0 (Android)", 5)).toBe(
      false,
    );
  });
});

describe("INSTALAR_SCRIPT (D371)", () => {
  test("guarda el evento en la clave que lee escucharInstalacion", () => {
    expect(INSTALAR_SCRIPT).toContain("beforeinstallprompt");
    expect(INSTALAR_SCRIPT).toContain("preventDefault()");
    expect(INSTALAR_SCRIPT).toContain(`window.${CLAVE_EVENTO_INSTALAR}=e`);
  });
});
