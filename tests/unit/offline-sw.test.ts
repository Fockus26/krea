// Guardianes del service worker (D291): sin navegador, se revisa el código. Lo que nunca debe
// guardar (Server Actions, RSC, otros orígenes como las URLs firmadas de B2) y que la página
// «Sin conexión» exista y sea pública.
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { accesoDeRuta } from "@/lib/sesion";
import nextConfig from "@/next.config";
import { config as proxyConfig } from "@/proxy";

const sw = readFileSync("public/sw.js", "utf8");

describe("service worker (D291)", () => {
  test("solo GET del mismo origen; sin RSC, Server Actions ni /api", () => {
    expect(sw).toContain('if (req.method !== "GET") return;');
    expect(sw).toContain("if (url.origin !== self.location.origin) return;");
    expect(sw).toContain('url.pathname.startsWith("/api/")');
    for (const cabecera of ["RSC", "Next-Action", "Next-Router-Prefetch"])
      expect(sw).toContain(`req.headers.has("${cabecera}")`);
    expect(sw).toContain('url.searchParams.has("_rsc")');
  });

  test("no guarda redirecciones y vacía las páginas al salir o al cambiar de cuenta", () => {
    expect(sw).toContain("!res.redirected");
    expect(sw).toContain('startsWith("/salir")');
    expect(sw).toContain('startsWith("/ingresar")');
    expect(sw).toMatch(/anterior !== usuario\) await vaciarPaginas\(\)/);
  });

  test("la página «Sin conexión» existe, es pública y el proxy no toca /sw.js", () => {
    expect(existsSync("app/sin-conexion/page.tsx")).toBe(true);
    expect(sw).toContain('const SIN_CONEXION = "/sin-conexion"');
    expect(accesoDeRuta("/sin-conexion")).toBeNull();
    const matcher = new RegExp(`^${proxyConfig.matcher[0]}$`);
    expect(matcher.test("/sw.js")).toBe(false);
    expect(matcher.test("/tareas")).toBe(true);
  });

  test("/sw.js se sirve sin caché HTTP (siempre la versión nueva)", async () => {
    const reglas = (await nextConfig.headers?.()) ?? [];
    const delSw = reglas.find((r) => r.source === "/sw.js");
    expect(
      delSw?.headers.find((h) => h.key === "Cache-Control")?.value,
    ).toContain("no-store");
  });
});
