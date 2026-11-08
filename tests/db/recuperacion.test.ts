// «Olvidé mi contraseña» sobre Postgres en memoria con Better Auth de verdad (D186–D188, D327):
// el código de un solo uso, el límite en transacción, comprobar sin gastar y gastar una vez.
// Brevo es un doble: nunca se llama a la red.
import { beforeAll, describe, expect, test } from "bun:test";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import {
  type AuthKrea,
  crearAuth,
  tokenRecuperacion,
  verificarHash,
} from "@/lib/better-auth";
import type { Correo } from "@/lib/correo/brevo";
import { ponerHash } from "@/lib/data/cuentas";
import { codigoVigente, depsRecuperacion } from "@/lib/data/recuperacion";
import type { Db } from "@/lib/db";
import { account } from "@/lib/db/schema";
import { emailInterno, type Usuario } from "@/lib/modelo";
import { procesarRecuperacion } from "@/lib/recuperar";
import { baseNueva } from "./base";
import * as docs from "./docs";

const CON_EMAIL = "38291460";
const SIN_EMAIL = "38291461";
const PW = "clave-vieja-1";
const NUEVA = "clave-nueva-2";

let base: Db;
let auth: AuthKrea;
const db = () => base;

const perfil = (cedula: string): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres: "Prueba Alumno",
  apellidos: "QA",
  seccion: "5A",
  equipoId: null,
  base: 20,
  avatar: { estilo: "lorelei", semilla: cedula },
  actualizadoEn: 1,
});

async function cuenta(cedula: string, email: string | null) {
  await docs.ponerUsuario(db(), perfil(cedula), email);
  await ponerHash(db(), cedula, await hashPassword(PW));
  await docs.borrarDoc(db(), "recuperaciones", cedula);
}

async function entra(cedula: string, password: string) {
  const [f] = await db()
    .select({ h: account.password })
    .from(account)
    .where(eq(account.userId, cedula));
  return f?.h ? verificarHash({ hash: f.h, password }) : false;
}

function conDoble() {
  const enviados: Correo[] = [];
  const deps = depsRecuperacion(
    db(),
    (c) => tokenRecuperacion(c, emailInterno(c), auth),
    async (c) => {
      enviados.push(c);
      return { ok: true };
    },
    new URL("https://krea.test"),
  );
  return { deps, enviados };
}

const oobDe = (c: Correo) => {
  const m = c.texto.match(/https:\/\/krea\.test\/recuperar\/nueva\?\S+/);
  return m ? new URL(m[0]).searchParams.get("oobCode") : null;
};

beforeAll(async () => {
  base = await baseNueva();
  auth = crearAuth(base, {
    secret: "secreto-de-prueba-secreto-de-prueba-32",
    baseURL: "https://krea.test",
  });
}, 30_000);

describe("recuperar contraseña (Postgres)", () => {
  test("con email: un correo al email real con un código que sirve una vez", async () => {
    await cuenta(CON_EMAIL, "alumno.prueba@correo.test");
    const { deps, enviados } = conDoble();
    expect(await procesarRecuperacion(CON_EMAIL, deps)).toBe("enviado");
    expect(enviados).toHaveLength(1);
    expect(enviados[0]?.para).toEqual({
      email: "alumno.prueba@correo.test",
      nombre: "Prueba",
    });
    const oob = oobDe(enviados[0] as Correo) as string;
    expect(oob).toBeTruthy();

    // Comprobar no gasta el código; restablecer sí.
    expect(await codigoVigente(db(), oob)).toBe(true);
    expect(await codigoVigente(db(), oob)).toBe(true);
    await auth.api.resetPassword({ body: { token: oob, newPassword: NUEVA } });
    expect(await codigoVigente(db(), oob)).toBe(false);
    let segunda: unknown = null;
    try {
      await auth.api.resetPassword({
        body: { token: oob, newPassword: "otra-clave-3" },
      });
    } catch (e) {
      segunda = e;
    }
    expect(segunda).toMatchObject({ statusCode: 400 });

    expect(await entra(CON_EMAIL, NUEVA)).toBe(true);
    expect(await entra(CON_EMAIL, PW)).toBe(false);
  });

  test("segundo pedido inmediato: límite, sin correo", async () => {
    await cuenta(CON_EMAIL, "alumno.prueba@correo.test");
    const { deps, enviados } = conDoble();
    expect(await procesarRecuperacion(CON_EMAIL, deps)).toBe("enviado");
    expect(await procesarRecuperacion(CON_EMAIL, deps)).toBe("limite");
    expect(enviados).toHaveLength(1);
    expect((await docs.recuperacionDe(db(), CON_EMAIL))?.length).toBe(1);
  });

  test("sin email o sin cuenta: nada", async () => {
    await cuenta(SIN_EMAIL, null);
    const { deps, enviados } = conDoble();
    expect(await procesarRecuperacion(SIN_EMAIL, deps)).toBe("sin-email");
    expect(await procesarRecuperacion("99999999", deps)).toBe("sin-email");
    expect(enviados).toHaveLength(0);
    expect(await docs.recuperacionDe(db(), SIN_EMAIL)).toBeNull();
  });

  test("código inventado: vencido", async () => {
    expect(await codigoVigente(db(), "codigo-falso")).toBe(false);
  });
});
