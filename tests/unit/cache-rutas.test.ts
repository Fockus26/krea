import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import nextConfig from "@/next.config";

/**
 * D250: el router guarda las rutas ya vistas unos minutos (`staleTimes.dynamic`). Para que nadie
 * vea su propio cambio viejo, toda Server Action de `lib/acciones/` que escribe vacía esa caché
 * (`refresh()` o una revalidación), o toca la cookie de sesión, que también la vacía. Las que no
 * cambian nada de lo que pintan las páginas van en la lista de abajo, con su motivo.
 */
const SIN_INVALIDAR: Record<string, string> = {
  tokenEnVivo: "solo emite un token para onSnapshot",
  sesionDePantalla: "solo lee la sesión del 404/500",
  pedirEnlace: "manda el correo de recuperación; no hay sesión",
  comprobarCodigo: "solo valida el código del enlace",
  subirImagenRespuesta:
    "sube a B2; la respuesta no existe hasta enviarEntrega, que sí invalida",
  resumenEliminarAlumno:
    "solo cuenta lo que se borraría; eliminarAlumno sí invalida",
  resumenEliminarAlumnos:
    "solo suma lo que se borraría; eliminarAlumnos sí invalida",
};

const INVALIDA =
  /\brefresh\(\)|\brevalidatePath\(|\brevalidateTag\(|\bupdateTag\(|\.(set|delete)\(COOKIE_SESION/;

function acciones(): { archivo: string; nombre: string; cuerpo: string }[] {
  const dir = "lib/acciones";
  return readdirSync(dir)
    .filter((f) => f.endsWith(".ts"))
    .flatMap((f) => {
      const codigo = readFileSync(join(dir, f), "utf8");
      // Cada trozo va de un `export async function` al siguiente
      return codigo
        .split(/^export async function /m)
        .slice(1)
        .map((trozo) => ({
          archivo: f,
          nombre: trozo.slice(0, trozo.search(/[(<\s]/)),
          cuerpo: trozo,
        }));
    });
}

describe("caché entre rutas (D250, D251)", () => {
  test("staleTimes.dynamic es de minutos, no de horas", () => {
    const dynamic = nextConfig.experimental?.staleTimes?.dynamic ?? 0;
    expect(dynamic).toBeGreaterThanOrEqual(60);
    expect(dynamic).toBeLessThanOrEqual(600);
  });

  test("toda Server Action que escribe invalida la caché del router", () => {
    const lista = acciones();
    expect(lista.length).toBeGreaterThan(10);
    const sinInvalidar = lista
      .filter((a) => !(a.nombre in SIN_INVALIDAR) && !INVALIDA.test(a.cuerpo))
      .map((a) => `${a.archivo} › ${a.nombre}`);
    expect(sinInvalidar).toEqual([]);
  });

  test("la lista de excepciones no tiene acciones que ya no existen", () => {
    const nombres = new Set(acciones().map((a) => a.nombre));
    expect(Object.keys(SIN_INVALIDAR).filter((n) => !nombres.has(n))).toEqual(
      [],
    );
  });

  test("salir e ingresar cambian de cuenta con carga completa (D251)", () => {
    for (const archivo of [
      "components/sections/auth/cerrar-sesion.tsx",
      "components/sections/auth/ingresar.tsx",
    ]) {
      const codigo = readFileSync(archivo, "utf8");
      expect(codigo).toContain("window.location.replace(");
      expect(codigo).not.toContain("router.replace(");
    }
  });
});
