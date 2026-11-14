import { describe, expect, test } from "bun:test";
import {
  CLAVE_EVENTO_INSTALAR,
  esDispositivoIOS,
  estadoInstalacion,
  INSTALAR_SCRIPT,
  navegadorDeIOS,
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
  test("iOS: según el navegador (D393)", () => {
    expect(
      estadoInstalacion({ ...base, esIOS: true, navegadorIOS: "safari" }),
    ).toBe("ios");
    expect(
      estadoInstalacion({ ...base, esIOS: true, navegadorIOS: "otro" }),
    ).toBe("ios-otro-navegador");
    expect(
      estadoInstalacion({ ...base, esIOS: true, navegadorIOS: "en-app" }),
    ).toBe("ios-en-app");
    expect(
      estadoInstalacion({
        ...base,
        iosStandalone: true,
        esIOS: true,
        navegadorIOS: "otro",
      }),
    ).toBe("instalada");
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

describe("navegadorDeIOS (D393)", () => {
  const SAFARI_IPHONE =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
  const SAFARI_IPAD_MAC =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
  const CHROME =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.153 Mobile/15E148 Safari/604.1";
  const FIREFOX =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/127.0 Mobile/15E148 Safari/605.1.15";
  const EDGE =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/126.2592.87 Mobile/15E148 Safari/605.1.15";
  const INSTAGRAM =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21F90 Instagram 330.0.0.30.109 (iPhone14,5; iOS 17_5; es_VE; es; scale=3.00; 1170x2532; 551088763)";
  const FACEBOOK =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/460.0.0.0;FBBV/1;FBDV/iPhone14,5]";
  const WEBVIEW_SIN_SAFARI =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
  const ANDROID =
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";

  test("Safari de iPhone y iPad (que se presenta como Mac)", () => {
    expect(navegadorDeIOS(SAFARI_IPHONE)).toBe("safari");
    expect(navegadorDeIOS(SAFARI_IPAD_MAC)).toBe("safari");
  });
  test("Chrome, Firefox y Edge de iOS", () => {
    expect(navegadorDeIOS(CHROME)).toBe("otro");
    expect(navegadorDeIOS(FIREFOX)).toBe("otro");
    expect(navegadorDeIOS(EDGE)).toBe("otro");
  });
  test("navegador dentro de otra app", () => {
    expect(navegadorDeIOS(INSTAGRAM)).toBe("en-app");
    expect(navegadorDeIOS(FACEBOOK)).toBe("en-app");
    expect(navegadorDeIOS(WEBVIEW_SIN_SAFARI)).toBe("en-app");
  });
  test("Android no es iOS y Chrome de Android no cae en «otro»", () => {
    expect(esDispositivoIOS("Linux armv8l", ANDROID, 5)).toBe(false);
    expect(navegadorDeIOS(ANDROID)).toBe("safari");
  });
});
