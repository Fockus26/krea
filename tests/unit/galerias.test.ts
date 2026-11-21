import { afterEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { galeriaVisible } from "@/lib/galerias";

/**
 * D-A4 (QA versión 1): /secciones, /componentes y /tokens respondían 200 en producción con datos
 * del seed. Cada galería tiene un layout que responde 404 fuera de desarrollo y de las vistas
 * previas, como /estados (D162).
 */
const GALERIAS = ["secciones", "componentes", "tokens", "correos"] as const;
const ENV_ORIGINAL = { ...process.env };
const env = process.env as Record<string, string | undefined>;

afterEach(() => {
  env.NODE_ENV = ENV_ORIGINAL.NODE_ENV;
  env.VERCEL_ENV = ENV_ORIGINAL.VERCEL_ENV;
});

async function layoutDe(galeria: string) {
  const ruta = `app/${galeria}/layout.tsx`;
  expect(existsSync(ruta)).toBe(true);
  const mod = await import(`@/app/${galeria}/layout`);
  return mod.default as (p: { children: string }) => unknown;
}

describe("galerías ocultas en producción (D-A4)", () => {
  test("regla: desarrollo y vistas previas sí; producción no", () => {
    expect(galeriaVisible({ NODE_ENV: "development" })).toBe(true);
    expect(
      galeriaVisible({ NODE_ENV: "production", VERCEL_ENV: "preview" }),
    ).toBe(true);
    expect(
      galeriaVisible({ NODE_ENV: "production", VERCEL_ENV: "production" }),
    ).toBe(false);
    expect(galeriaVisible({ NODE_ENV: "production" })).toBe(false);
  });

  test("preview de kit-deploy: NEXT_PUBLIC_GALERIAS=1 en su build (D580)", () => {
    expect(
      galeriaVisible({ NODE_ENV: "production", NEXT_PUBLIC_GALERIAS: "1" }),
    ).toBe(true);
    expect(
      galeriaVisible({ NODE_ENV: "production", NEXT_PUBLIC_GALERIAS: "" }),
    ).toBe(false);
  });

  for (const galeria of GALERIAS) {
    test(`/${galeria} responde 404 en producción`, async () => {
      const Layout = await layoutDe(galeria);
      env.NODE_ENV = "production";
      env.VERCEL_ENV = "production";
      let digest = "";
      try {
        Layout({ children: "galería" });
      } catch (e) {
        digest = String((e as { digest?: string }).digest);
      }
      expect(digest).toContain("404");
    });

    test(`/${galeria} se ve en las vistas previas`, async () => {
      const Layout = await layoutDe(galeria);
      env.NODE_ENV = "production";
      env.VERCEL_ENV = "preview";
      expect(Layout({ children: "galería" })).toBe("galería");
    });
  }
});
