import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  CLAVE_RECARGA,
  debeRecargar,
  esErrorDeDeploy,
  recargarSiEsDeploy,
  relanzarSiEsDeploy,
  siNoEsDeploy,
  VENTANA_RECARGA_MS,
} from "@/lib/recarga-deploy";

const deAccion = Object.assign(
  new Error('Server Action "abc" was not found on the server'),
  { name: "UnrecognizedActionError" },
);
const deChunk = Object.assign(new Error("Failed to load chunk /_next/x.js"), {
  name: "ChunkLoadError",
});
const deRed = new TypeError("Failed to fetch");

describe("esErrorDeDeploy", () => {
  test("reconoce la Server Action y el chunk que ya no existen", () => {
    expect(esErrorDeDeploy(deAccion)).toBe(true);
    expect(esErrorDeDeploy(deChunk)).toBe(true);
    expect(esErrorDeDeploy(new Error("Failed to find Server Action x"))).toBe(
      true,
    );
  });

  test("un fallo de red o un valor raro no es de deploy", () => {
    expect(esErrorDeDeploy(deRed)).toBe(false);
    expect(esErrorDeDeploy(null)).toBe(false);
    expect(esErrorDeDeploy("Failed to load chunk")).toBe(false);
  });
});

describe("debeRecargar", () => {
  test("recarga la primera vez y pasada la ventana", () => {
    expect(debeRecargar(deAccion, null, 1000)).toBe(true);
    expect(debeRecargar(deAccion, 0, VENTANA_RECARGA_MS)).toBe(true);
  });

  test("dentro de la ventana no recarga (freno del bucle)", () => {
    expect(debeRecargar(deAccion, 1000, 1000 + VENTANA_RECARGA_MS - 1)).toBe(
      false,
    );
  });

  test("marca ilegible o del futuro: recarga", () => {
    expect(debeRecargar(deAccion, Number.NaN, 5)).toBe(true);
    expect(debeRecargar(deAccion, 9999, 5)).toBe(true);
  });

  test("un error que no es de deploy nunca recarga", () => {
    expect(debeRecargar(deRed, null, 1000)).toBe(false);
  });
});

describe("catch de Server Actions (L57)", () => {
  const original = (globalThis as { window?: unknown }).window;
  let recargas = 0;
  let almacen: Map<string, string>;

  beforeEach(() => {
    recargas = 0;
    almacen = new Map();
    (globalThis as { window?: unknown }).window = {
      sessionStorage: {
        getItem: (k: string) => almacen.get(k) ?? null,
        setItem: (k: string, v: string) => almacen.set(k, v),
      },
      location: {
        reload: () => {
          recargas += 1;
        },
      },
    };
  });

  afterEach(() => {
    (globalThis as { window?: unknown }).window = original;
  });

  const RED = { ok: false as const, error: "red" as const };

  test("sin red (fallo de fetch) devuelve el resultado «red» y no recarga", () => {
    expect(siNoEsDeploy(RED)(deRed)).toBe(RED);
    expect(recargas).toBe(0);
  });

  test("error de deploy: recarga y re-lanza el mismo error", () => {
    expect(() => siNoEsDeploy(RED)(deAccion)).toThrow(deAccion);
    expect(recargas).toBe(1);
    expect(almacen.has(CLAVE_RECARGA)).toBe(true);
  });

  test("segundo error de deploy dentro de la ventana: no recarga pero igual re-lanza", () => {
    expect(() => siNoEsDeploy(RED)(deAccion)).toThrow(deAccion);
    expect(() => siNoEsDeploy(RED)(deChunk)).toThrow(deChunk);
    expect(recargas).toBe(1);
  });

  test("en una promesa rechazada, `.catch(siNoEsDeploy(...))` propaga el de deploy", async () => {
    const ok = await Promise.reject(deRed).catch(siNoEsDeploy(RED));
    expect(ok).toBe(RED);
    await expect(
      Promise.reject(deAccion).catch(siNoEsDeploy(RED)),
    ).rejects.toBe(deAccion);
  });

  test("relanzarSiEsDeploy: no hace nada con otros errores", () => {
    expect(() => relanzarSiEsDeploy(deRed)).not.toThrow();
    expect(() => relanzarSiEsDeploy(deAccion)).toThrow(deAccion);
  });

  test("recargarSiEsDeploy sin sessionStorage no recarga", () => {
    (globalThis as { window?: unknown }).window = {
      sessionStorage: {
        getItem: () => {
          throw new Error("bloqueado");
        },
      },
      location: {
        reload: () => {
          recargas += 1;
        },
      },
    };
    expect(recargarSiEsDeploy(deAccion)).toBe(false);
    expect(recargas).toBe(0);
  });
});

/*
 * Clase L57: ningún cliente convierte el fallo de una Server Action en «red» sin dejar pasar el
 * error de deploy. Guarda estática sobre `components/` (no hay DOM para probar los formularios).
 */
function fuentes(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return fuentes(ruta);
    return /\.tsx?$/.test(ruta) ? [ruta] : [];
  });
}

describe("catch de acciones en components/ (L57, D538)", () => {
  const archivos = fuentes("components").map((ruta) => ({
    ruta,
    codigo: readFileSync(ruta, "utf8"),
  }));

  test("ningún `.catch(() => ({ ok: false … }))` ni `.catch(() => RED)` a pelo", () => {
    const sueltos = archivos
      .filter(({ codigo }) =>
        /\.catch\(\s*\(\s*\)\s*(?::\s*[\w<>]+\s*)?=>\s*(?:\(\s*\{\s*ok:\s*false|RED\b)/.test(
          codigo,
        ),
      )
      .map((a) => a.ruta);
    expect(sueltos).toEqual([]);
  });

  test('un `catch (x) { … r = { ok: false, error: "red" } }` relanza el de deploy', () => {
    const sin: string[] = [];
    for (const { ruta, codigo } of archivos) {
      for (const m of codigo.matchAll(
        /catch\s*(?:\((\w+)\))?\s*\{([^}]{0,200})\}/g,
      )) {
        if (!/error:\s*"red"|setError\("red"\)/.test(m[2] ?? "")) continue;
        if (!/relanzarSiEsDeploy\(/.test(m[2] ?? "")) sin.push(ruta);
      }
    }
    expect(sin).toEqual([]);
  });
});
