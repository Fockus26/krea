// El proxy solo redirige la navegación (QA 2026-11-08): la Server Action `confirmarIngreso` que
// corre en /ingresar justo después del login recibía un 307 y el login mostraba «No pudimos
// conectarnos».
import { describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

describe("proxy", () => {
  test("un POST (Server Action) pasa sin redirección", async () => {
    for (const ruta of ["/ingresar", "/profe", "/notas"]) {
      const res = await proxy(
        new NextRequest(`http://localhost${ruta}`, {
          method: "POST",
          headers: { "next-action": "abc" },
        }),
      );
      expect(res.headers.get("location")).toBeNull();
    }
  });

  test("un GET sin sesión a una ruta protegida sí redirige a ingresar", async () => {
    const res = await proxy(new NextRequest("http://localhost/profe"));
    expect(res.headers.get("location")).toContain("/ingresar");
  });
});
