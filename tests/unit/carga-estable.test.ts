// «La página no carga» (tanda 11-20 Q1, D437, D438): el contador de fallos del sondeo y la
// decisión de recargar tras un deploy. Puro: sin navegador.
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { OPCIONES_POOL } from "@/lib/db";
import {
  debeRecargar,
  esErrorDeDeploy,
  VENTANA_RECARGA_MS,
} from "@/lib/recarga-deploy";
import {
  ESPERA_AL_VOLVER_MS,
  estaCortado,
  FALLOS_PARA_CORTADO,
  fallosTras,
  SONDEO_MS,
} from "@/lib/sondeo";

const repetir = (desde: number, oks: boolean[]) =>
  oks.reduce((f, ok) => fallosTras(f, ok), desde);

describe("sondeo tolerante (D437)", () => {
  test("un fallo suelto no corta; el tercero seguido sí (≈ 15 s)", () => {
    expect(FALLOS_PARA_CORTADO).toBe(3);
    expect(FALLOS_PARA_CORTADO * SONDEO_MS).toBe(15_000);
    expect(estaCortado(repetir(0, [false]))).toBe(false);
    expect(estaCortado(repetir(0, [false, false]))).toBe(false);
    expect(estaCortado(repetir(0, [false, false, false]))).toBe(true);
  });

  test("un éxito vuelve el contador a 0", () => {
    expect(repetir(0, [false, false, true])).toBe(0);
    expect(estaCortado(repetir(0, [false, false, true, false, false]))).toBe(
      false,
    );
    expect(estaCortado(repetir(0, [false, false, false, true]))).toBe(false);
  });

  test("al volver a la pestaña espera ~1 s antes de pedir, sin cambiar la firma", () => {
    expect(ESPERA_AL_VOLVER_MS).toBe(1_000);
    const src = readFileSync("lib/sondeo.ts", "utf8");
    expect(src).toContain("setTimeout(tic, ESPERA_AL_VOLVER_MS)");
    expect(src).toContain("clearTimeout(despertar)");
    expect(src).toContain("export function useSondeo(");
    expect(src).toContain("pedir: (senal: AbortSignal) => Promise<void>,");
  });

  test("el ranking y la presencia cuentan fallos en vez de cortar al primero", () => {
    for (const archivo of [
      "components/sections/ranking/ranking-en-vivo.tsx",
      "components/sections/alumnos/use-presencia.ts",
    ]) {
      const src = readFileSync(archivo, "utf8");
      expect(src).toContain("fallosTras(");
      expect(src).toContain("estaCortado(");
    }
    const ranking = readFileSync(
      "components/sections/ranking/ranking-en-vivo.tsx",
      "utf8",
    );
    expect(ranking).not.toContain("setCortado(true)");
  });

  test("las API del sondeo responden 503 sin caché si la base falla", () => {
    for (const archivo of [
      "app/api/ranking/[seccion]/route.ts",
      "app/api/presencia/route.ts",
    ]) {
      const src = readFileSync(archivo, "utf8");
      expect(src).toContain("catch (e)");
      expect(src).toContain("status: 503");
      expect(src).toContain('"Cache-Control": "no-store"');
      expect(src).toContain("console.error(");
    }
  });
});

describe("pool frente a PgBouncer (D437)", () => {
  test("tiempos de conexión, ociosas y consulta; nada de parámetros de arranque", () => {
    expect(OPCIONES_POOL.connectionTimeoutMillis).toBeGreaterThan(0);
    expect(OPCIONES_POOL.idleTimeoutMillis).toBeGreaterThan(0);
    expect(OPCIONES_POOL.query_timeout).toBeGreaterThan(0);
    // `statement_timeout`/`options` viajan al arrancar y PgBouncer (transacción) los rechaza
    expect("statement_timeout" in OPCIONES_POOL).toBe(false);
    expect("options" in OPCIONES_POOL).toBe(false);
  });
});

describe("recarga tras un deploy (D438)", () => {
  const chunkTurbopack = Object.assign(
    new Error(
      "Failed to load chunk /_next/static/chunks/abc.js from module 123",
    ),
    { name: "ChunkLoadError" },
  );
  const chunkWebpack = new Error("Loading chunk 42 failed.");
  const cssWebpack = new Error("Loading CSS chunk 7 failed.");
  const accion = Object.assign(
    new Error(
      'Server Action "7f00ab" was not found on the server. \nRead more: https://nextjs.org/docs/messages/failed-to-find-server-action',
    ),
    { name: "UnrecognizedActionError" },
  );
  const accionServidor = new Error(
    'Failed to find Server Action "7f00ab". This request might be from an older or newer deployment.',
  );

  test("reconoce chunks y Server Actions desfasados", () => {
    for (const e of [
      chunkTurbopack,
      chunkWebpack,
      cssWebpack,
      accion,
      accionServidor,
    ])
      expect(esErrorDeDeploy(e)).toBe(true);
    expect(esErrorDeDeploy({ name: "ChunkLoadError" })).toBe(true);
  });

  test("no confunde otros errores", () => {
    for (const e of [
      new Error("permission denied for table partes"),
      Object.assign(
        new Error("An error occurred in the Server Components render."),
        {
          digest: "ABC123",
        },
      ),
      new TypeError("Failed to fetch"),
      "ChunkLoadError",
      null,
      undefined,
      42,
    ])
      expect(esErrorDeDeploy(e)).toBe(false);
  });

  test("recarga la primera vez; si vuelve a fallar en < 30 s, la pantalla normal", () => {
    const ahora = 1_800_000_000_000;
    expect(VENTANA_RECARGA_MS).toBe(30_000);
    expect(debeRecargar(chunkTurbopack, null, ahora)).toBe(true);
    expect(debeRecargar(chunkTurbopack, ahora - 5_000, ahora)).toBe(false);
    expect(debeRecargar(chunkTurbopack, ahora - 29_999, ahora)).toBe(false);
    expect(debeRecargar(chunkTurbopack, ahora - 30_000, ahora)).toBe(true);
    expect(debeRecargar(accion, ahora - 60_000, ahora)).toBe(true);
  });

  test("una marca corrupta o del futuro no bloquea la recarga", () => {
    const ahora = 1_800_000_000_000;
    expect(debeRecargar(chunkWebpack, Number.NaN, ahora)).toBe(true);
    expect(debeRecargar(chunkWebpack, ahora + 60_000, ahora)).toBe(true);
  });

  test("otro error nunca recarga", () => {
    expect(debeRecargar(new Error("boom"), null, 0)).toBe(false);
  });

  test("error.tsx y global-error.tsx la usan", () => {
    for (const archivo of ["app/error.tsx", "app/global-error.tsx"])
      expect(readFileSync(archivo, "utf8")).toContain(
        "recargarSiEsDeploy(error)",
      );
  });
});
