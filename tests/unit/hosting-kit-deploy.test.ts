import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { urlBaseAuth } from "@/lib/better-auth";

/** D580 · hosting en kit-deploy (VPS): lo que el contenedor necesita del repo. */
describe("D580 · origen de la sesión", () => {
  test("producción: BETTER_AUTH_URL manda", () => {
    expect(
      urlBaseAuth({
        BETTER_AUTH_URL: "https://krea.fockus.dev",
        KIT_DEPLOY_PREVIEW_URL: "https://krea-pr-3.preview.fockus.dev",
      }),
    ).toBe("https://krea.fockus.dev");
  });
  test("preview de kit-deploy: su propia URL", () => {
    expect(
      urlBaseAuth({
        KIT_DEPLOY_PREVIEW_URL: "https://krea-pr-3.preview.fockus.dev",
      }),
    ).toBe("https://krea-pr-3.preview.fockus.dev");
  });
  test("sin ninguna (Vercel preview, local): Better Auth la deduce", () => {
    expect(urlBaseAuth({ BETTER_AUTH_URL: " " })).toBeUndefined();
  });
});

describe("D580 · /api/health", () => {
  test("sin base ni sesión, sin caché y con el commit", () => {
    const ruta = readFileSync("app/api/health/route.ts", "utf8");
    expect(ruta).not.toContain("@/lib/db");
    expect(ruta).toContain("await connection()");
    expect(ruta).toContain('"no-store"');
    expect(ruta).toContain("process.env.GIT_SHA");
    // El proxy no la intercepta: kit-agent la pide sin cookie.
    expect(readFileSync("proxy.ts", "utf8")).toContain("api/");
  });
});

describe("D580 · imagen", () => {
  test("los datos reales y los .env no entran en la imagen", () => {
    const lineas = readFileSync(".dockerignore", "utf8")
      .split("\n")
      .map((l) => l.trim());
    expect(lineas).toContain("data/privado");
    expect(lineas).toContain(".env*");
    expect(lineas).toContain(".qa");
  });
  test("standalone solo en el build del Dockerfile", () => {
    expect(readFileSync("next.config.ts", "utf8")).toContain(
      'process.env.NEXT_OUTPUT === "standalone"',
    );
    expect(readFileSync("Dockerfile", "utf8")).toContain(
      "NEXT_OUTPUT=standalone",
    );
  });
});
