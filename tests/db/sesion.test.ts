// La sesión de Better Auth sobre Postgres en memoria (D180, D327): entrar deja una cookie que da la
// sesión con el rol del perfil; sin perfil, con la cookie alterada o tras revocar, no hay sesión.
import { beforeAll, describe, expect, test } from "bun:test";
import { hashPassword } from "better-auth/crypto";
import { type AuthKrea, crearAuth } from "@/lib/better-auth";
import { ponerHash, revocarSesiones } from "@/lib/data/cuentas";
import { sesionDeHeaders } from "@/lib/data/sesion";
import type { Db } from "@/lib/db";
import { emailInterno, type Usuario } from "@/lib/modelo";
import { baseNueva } from "./base";
import * as docs from "./docs";

let base: Db;
let auth: AuthKrea;
const ALUMNO = "45009896";
const SIN_PERFIL = "33272398";
const PW = "clave-de-prueba-1";

const alumno: Usuario = {
  cedula: ALUMNO,
  rol: "estudiante",
  nombres: "Raquel",
  apellidos: "Prueba",
  seccion: "5A",
  equipoId: "g2",
  base: 20,
  avatar: { estilo: "lorelei", semilla: ALUMNO },
  actualizadoEn: 1,
};

/** Entra y devuelve las cabeceras con la cookie, como las mandaría el navegador. */
async function entrar(cedula: string): Promise<Headers> {
  const r = await auth.api.signInEmail({
    body: { email: emailInterno(cedula), password: PW },
    returnHeaders: true,
  });
  const cookie = r.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  return new Headers({ cookie });
}

const sesion = (h: Headers) => sesionDeHeaders(h, { auth, db: base });

beforeAll(async () => {
  base = await baseNueva();
  auth = crearAuth(base, {
    secret: "secreto-de-prueba-secreto-de-prueba-32",
    baseURL: "http://localhost:3000",
  });
  await docs.ponerUsuario(base, alumno);
  await ponerHash(base, ALUMNO, await hashPassword(PW));
  await docs.cuenta(base, SIN_PERFIL, await hashPassword(PW));
}, 30_000);

describe("sesionDeHeaders", () => {
  test("cookie válida → sesión del estudiante con rol, sección y equipo del perfil", async () => {
    expect(await sesion(await entrar(ALUMNO))).toEqual({
      uid: ALUMNO,
      rol: "estudiante",
      seccion: "5A",
      equipoId: "g2",
    });
  });

  test("cuenta sin perfil → null", async () => {
    expect(await sesion(await entrar(SIN_PERFIL))).toBeNull();
  });

  test("cookie alterada o vacía → null", async () => {
    const h = await entrar(ALUMNO);
    const alterada = new Headers({ cookie: `${h.get("cookie")}x` });
    expect(await sesion(alterada)).toBeNull();
    expect(await sesion(new Headers())).toBeNull();
  });

  test("el equipo nuevo se ve sin volver a entrar (D210, D327)", async () => {
    const h = await entrar(ALUMNO);
    await docs.ponerUsuario(base, { ...alumno, equipoId: null });
    expect((await sesion(h))?.equipoId).toBeNull();
    await docs.ponerUsuario(base, alumno);
  });

  test("tras revocar (Salir en todos sus equipos, contraseña nueva): no hay sesión", async () => {
    const h = await entrar(ALUMNO);
    expect(await sesion(h)).not.toBeNull();
    await revocarSesiones(base, ALUMNO);
    expect(await sesion(h)).toBeNull();
  });

  test("contraseña incorrecta: no entra", async () => {
    let error: unknown = null;
    try {
      await auth.api.signInEmail({
        body: { email: emailInterno(ALUMNO), password: "otra-clave-9" },
      });
    } catch (e) {
      error = e;
    }
    expect(error).toMatchObject({ statusCode: 401 });
  });
});
