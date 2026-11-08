// Aviso de tarea nueva por Web Push (D335–D340): lo puro (configuración, payload, transición que
// avisa, validación de la suscripción), los guardianes del service worker y del envío, y el
// contraste del interruptor en 4 acentos × claro/oscuro.
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { contraste } from "@/lib/grades";
import {
  avisoTareaNueva,
  bytesDeClave,
  clavePublicaPush,
  configPush,
  debeAvisar,
  suscripcionVencida,
  TITULO_AVISO_TAREA,
  zSuscripcionPush,
} from "@/lib/push";
import {
  ACENTOS,
  MIN_GRAFICO,
  TEMAS,
  tokens,
} from "../../scripts/qa/contraste-acentos";

const leer = (ruta: string) => readFileSync(ruta, "utf8");

describe("configuración VAPID (D337)", () => {
  const todo = {
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: "BPub",
    VAPID_PRIVATE_KEY: "priv",
    VAPID_SUBJECT: "mailto:profe@example.test",
  };

  test("las tres o nada", () => {
    expect(configPush(todo)).toEqual({
      publica: "BPub",
      privada: "priv",
      subject: "mailto:profe@example.test",
    });
    for (const falta of Object.keys(todo)) {
      const env = { ...todo, [falta]: " " };
      expect(configPush(env)).toBeNull();
      expect(clavePublicaPush(env)).toBeNull();
    }
    expect(clavePublicaPush(todo)).toBe("BPub");
  });
});

describe("payload de la notificación", () => {
  test("título fijo, cuerpo con el título de la tarea y la ruta del alumno", () => {
    expect(avisoTareaNueva({ id: "abc-1", titulo: "  Afiche  " })).toEqual({
      titulo: TITULO_AVISO_TAREA,
      cuerpo: "Afiche",
      url: "/tareas/abc-1",
      etiqueta: "tarea-abc-1",
    });
  });

  test("un título largo se corta con elipsis", () => {
    const a = avisoTareaNueva({ id: "x", titulo: "a".repeat(200) });
    expect(a.cuerpo.length).toBeLessThanOrEqual(120);
    expect(a.cuerpo.endsWith("…")).toBe(true);
  });

  test("el id va codificado en la ruta", () => {
    expect(avisoTareaNueva({ id: "a b", titulo: "t" }).url).toBe(
      "/tareas/a%20b",
    );
  });
});

describe("cuándo se avisa (D336)", () => {
  test("solo borrador/nueva → abierta, nunca importada", () => {
    expect(debeAvisar(null, { estado: "abierta" })).toBe(true);
    expect(debeAvisar({ estado: "borrador" }, { estado: "abierta" })).toBe(
      true,
    );
    expect(debeAvisar({ estado: "abierta" }, { estado: "abierta" })).toBe(
      false,
    );
    expect(debeAvisar(null, { estado: "borrador" })).toBe(false);
    expect(debeAvisar({ estado: "evaluada" }, { estado: "abierta" })).toBe(
      false,
    );
    expect(debeAvisar(null, { estado: "abierta", importada: true })).toBe(
      false,
    );
  });

  test("404 y 410 son suscripción vencida; el resto no", () => {
    expect(suscripcionVencida(404)).toBe(true);
    expect(suscripcionVencida(410)).toBe(true);
    for (const c of [undefined, 400, 413, 429, 500])
      expect(suscripcionVencida(c)).toBe(false);
  });
});

describe("suscripción del navegador (zod)", () => {
  const buena = {
    endpoint: "https://fcm.googleapis.com/fcm/send/abc",
    expirationTime: null,
    keys: { p256dh: "BNcR-abc_123", auth: "tBHI-tqY" },
  };

  test("acepta la de PushSubscription.toJSON()", () => {
    expect(zSuscripcionPush.safeParse(buena).success).toBe(true);
  });

  test("rechaza http, claves faltantes o con caracteres raros", () => {
    for (const mala of [
      { ...buena, endpoint: "http://fcm.googleapis.com/x" },
      { ...buena, endpoint: "javascript:alert(1)" },
      { ...buena, keys: { p256dh: "abc" } },
      { ...buena, keys: { p256dh: "a b", auth: "x" } },
      { endpoint: buena.endpoint },
    ])
      expect(zSuscripcionPush.safeParse(mala).success).toBe(false);
  });
});

describe("clave pública → bytes", () => {
  test("base64url sin relleno", () => {
    expect([...bytesDeClave("AQID_-8")]).toEqual([1, 2, 3, 255, 239]);
  });
});

describe("service worker: push y notificationclick (D335)", () => {
  const sw = leer("public/sw.js");

  test("pinta la notificación con el ícono propio y solo abre rutas propias", () => {
    expect(sw).toContain('self.addEventListener("push"');
    expect(sw).toContain("showNotification(");
    expect(sw).toContain('"/icons/icon-192.png"');
    expect(sw).toContain('self.addEventListener("notificationclick"');
    expect(sw).toMatch(/url\.startsWith\("\/"\) && !url\.startsWith\("\/\/"\)/);
    expect(sw).toContain("openWindow(destino)");
  });
});

describe("envío y acciones (D338, D339)", () => {
  const envio = leer("lib/push-envio.ts");
  const acciones = leer("lib/acciones/push.ts");
  const tareas = leer("lib/acciones/tareas.ts");

  test("el envío va en after(), es solo servidor y no registra endpoints ni cédulas", () => {
    expect(envio).toContain('import "server-only"');
    expect(envio).toContain("after(async");
    expect(envio).not.toMatch(/console\.\w+\([^)]*(endpoint|cedula)/);
    expect(tareas).toContain("if (aviso) programarAvisoTarea(aviso)");
  });

  test("las acciones exigen sesión de estudiante y validan con zod", () => {
    expect(acciones.match(/exigirSesion\("estudiante"\)/g)).toHaveLength(2);
    expect(acciones).toContain("zSuscripcionPush.safeParse");
    expect(acciones).toContain("zEndpointPush.safeParse");
  });
});

describe("contraste del interruptor (4 acentos × claro/oscuro)", () => {
  for (const tema of TEMAS)
    for (const acento of ACENTOS) {
      const t = tokens(tema, acento);
      test(`${tema} · ${acento}`, () => {
        // Apagado: borde del riel y perilla sobre la tarjeta. Encendido: riel y perilla.
        expect(contraste(t["--input"], t["--surface"])).toBeGreaterThanOrEqual(
          MIN_GRAFICO,
        );
        expect(contraste(t["--text-2"], t["--surface"])).toBeGreaterThanOrEqual(
          MIN_GRAFICO,
        );
        expect(contraste(t["--accent"], t["--surface"])).toBeGreaterThanOrEqual(
          MIN_GRAFICO,
        );
        expect(
          contraste(t["--on-accent"], t["--accent"]),
        ).toBeGreaterThanOrEqual(MIN_GRAFICO);
      });
    }
});
