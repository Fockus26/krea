// Cuentas sobre Postgres en memoria (W1, D231–D234, D327): crear con contraseña temporal, crear la
// propia, marcar admin, editar/borrar profesores, que ningún profe edite a otro por Alumnos y que
// las contraseñas importadas de Firebase sigan sirviendo.
import { beforeAll, describe, expect, test } from "bun:test";
import { and, eq } from "drizzle-orm";
import { FirebaseScrypt } from "firebase-scrypt";
import { PREFIJO_HASH_FIREBASE, verificarHash } from "@/lib/better-auth";
import { ErrorCuenta } from "@/lib/cuentas-datos";
import { editarAlumnoEnTransaccion } from "@/lib/data/alumnos";
import {
  crearCuentaCon,
  crearPasswordPropia,
  editarProfesorEnTransaccion,
  eliminarCuentaCon,
  guardarMisDatosCon,
  hacerAdminCon,
  PROVEEDOR_CREDENCIAL,
} from "@/lib/data/cuentas";
import type { Db } from "@/lib/db";
import { account, session } from "@/lib/db/schema";
import { emailInterno, zUsuario } from "@/lib/modelo";
import { baseNueva } from "./base";
import * as docs from "./docs";

let base: Db;
const db = () => base;

const AHORA = Date.UTC(2026, 10, 6, 15);
const ADMIN = "39710001";
const NUEVO = "39710002";
const ALUMNO = "39710003";

const usuario = async (cedula: string) =>
  zUsuario.parse((await docs.snap(db(), "usuarios", cedula)).data());

/** El error con el que rechaza `p` (se captura a mano, como en las pruebas de los emuladores). */
async function rechazo(p: Promise<unknown>): Promise<unknown> {
  try {
    await p;
  } catch (e) {
    return e;
  }
  throw new Error("se esperaba un rechazo");
}

/** ¿Entra con esta contraseña? Lo mismo que comprueba Better Auth en `sign-in/email`. */
async function entra(cedula: string, password: string): Promise<boolean> {
  const [f] = await db()
    .select({ hash: account.password })
    .from(account)
    .where(
      and(
        eq(account.userId, cedula),
        eq(account.providerId, PROVEEDOR_CREDENCIAL),
      ),
    );
  return f?.hash ? verificarHash({ hash: f.hash, password }) : false;
}

/** Una sesión abierta de la cuenta (como la que deja el login). */
async function abrirSesion(cedula: string) {
  await db()
    .insert(session)
    .values({
      id: crypto.randomUUID(),
      token: crypto.randomUUID(),
      userId: cedula,
      expiresAt: new Date(Date.now() + 60_000),
      updatedAt: new Date(),
    });
}

async function sesionesDe(cedula: string) {
  return (await db().select().from(session).where(eq(session.userId, cedula)))
    .length;
}

beforeAll(async () => {
  base = await baseNueva();
}, 30_000);

describe("crearCuentaCon (D232, D233)", () => {
  let temporal = "";

  test("crea la cuenta, el perfil y el email; la temporal sirve para entrar", async () => {
    const r = await crearCuentaCon(
      db(),
      {
        rol: "profesor",
        cedula: NUEVO,
        nombres: "Ana",
        apellidos: "Prueba W1",
        email: "ana@example.com",
      },
      AHORA,
    );
    temporal = r.passwordTemporal;
    expect(temporal).toMatch(/^[^-]{4}-[^-]{4}-[^-]{4}$/);
    const u = await usuario(NUEVO);
    expect(u).toMatchObject({
      rol: "profesor",
      seccion: null,
      debeCambiarPassword: true,
      actualizadoEn: AHORA,
    });
    expect(u.admin).toBeUndefined();
    expect(await docs.emailDe(db(), NUEVO)).toBe("ana@example.com");
    expect(await docs.existeCuenta(db(), NUEVO)).toBe(true);
    expect(await entra(NUEVO, temporal)).toBe(true);
    expect(await entra(NUEVO, "otra-cosa-123")).toBe(false);
  });

  test("cédula que ya existe → «existe», sin pisar nada", async () => {
    const antes = await usuario(NUEVO);
    const error = await rechazo(
      crearCuentaCon(
        db(),
        {
          rol: "profesor",
          cedula: NUEVO,
          nombres: "Otro",
          apellidos: "Nombre",
          email: null,
        },
        AHORA + 1,
      ),
    );
    expect(error).toBeInstanceOf(ErrorCuenta);
    expect(error).toMatchObject({ codigo: "existe" });
    expect(await usuario(NUEVO)).toEqual(antes);
    // La contraseña temporal sigue siendo la primera
    expect(await entra(NUEVO, temporal)).toBe(true);
  });

  test("cuenta sin perfil → «existe» y no deja perfil a medias", async () => {
    await docs.cuenta(db(), ADMIN);
    expect(
      await rechazo(
        crearCuentaCon(
          db(),
          {
            rol: "profesor",
            cedula: ADMIN,
            nombres: "César",
            apellidos: "Admin",
            email: null,
          },
          AHORA,
        ),
      ),
    ).toMatchObject({ codigo: "existe" });
    expect((await docs.snap(db(), "usuarios", ADMIN)).exists).toBe(false);
    await eliminarCuentaCon(db(), ADMIN);
  });

  test("crearPasswordPropia: quita la marca, cierra las sesiones; la nueva sirve", async () => {
    await abrirSesion(NUEVO);
    await crearPasswordPropia(db(), NUEVO, "mi-clave-nueva-1", AHORA);
    expect((await usuario(NUEVO)).debeCambiarPassword).toBeUndefined();
    expect(await sesionesDe(NUEVO)).toBe(0);
    expect(await entra(NUEVO, temporal)).toBe(false);
    expect(await entra(NUEVO, "mi-clave-nueva-1")).toBe(true);
  });
});

describe("contraseñas importadas de Firebase (D327)", () => {
  test("el scrypt modificado de Firebase se acepta; uno incorrecto no", async () => {
    const params = {
      // Parámetros de prueba (los reales están en la consola de Firebase, no en el código)
      signerKey: Buffer.from("clave-de-prueba-para-firebase-scrypt").toString(
        "base64",
      ),
      saltSeparator: Buffer.from("sep").toString("base64"),
      rounds: 8,
      memCost: 14,
    };
    process.env.FIREBASE_HASH_SIGNER_KEY = params.signerKey;
    process.env.FIREBASE_HASH_SALT_SEPARATOR = params.saltSeparator;
    const salt = Buffer.from("sal-de-prueba").toString("base64");
    const hash = await new FirebaseScrypt(params).hash("clave-vieja-9", salt);
    const importado = `${PREFIJO_HASH_FIREBASE}${hash}$${salt}`;
    expect(
      await verificarHash({ hash: importado, password: "clave-vieja-9" }),
    ).toBe(true);
    expect(await verificarHash({ hash: importado, password: "otra" })).toBe(
      false,
    );
    expect(
      await verificarHash({
        hash: `${PREFIJO_HASH_FIREBASE}roto`,
        password: "x",
      }),
    ).toBe(false);
  });
});

describe("admin y edición de profesores (D231, D233, D234)", () => {
  test("hacerAdminCon: perfil; cierra sus sesiones; idempotente; un alumno no puede", async () => {
    await crearCuentaCon(
      db(),
      {
        rol: "profesor",
        cedula: ADMIN,
        nombres: "César",
        apellidos: "Admin W1",
        email: null,
      },
      AHORA,
    );
    await abrirSesion(ADMIN);
    expect(await hacerAdminCon(db(), ADMIN, AHORA)).toEqual({ ok: true });
    expect(await sesionesDe(ADMIN)).toBe(0);
    expect(await hacerAdminCon(db(), ADMIN, AHORA)).toEqual({ ok: true });
    const u = await usuario(ADMIN);
    expect(u.admin).toBe(true);
    // Conserva la marca de contraseña temporal que ya tenía
    expect(u.debeCambiarPassword).toBe(true);

    await crearCuentaCon(
      db(),
      {
        rol: "estudiante",
        cedula: ALUMNO,
        nombres: "Luis",
        apellidos: "Alumno W1",
        email: null,
        seccion: "5A",
      },
      AHORA,
    );
    expect(await hacerAdminCon(db(), ALUMNO, AHORA)).toEqual({
      ok: false,
      error: "no-profesor",
    });
    expect(await hacerAdminCon(db(), "39719999", AHORA)).toEqual({
      ok: false,
      error: "no-existe",
    });
  });

  test("editarProfesorEnTransaccion: nombres, apellidos y email; un alumno no", async () => {
    expect(
      await editarProfesorEnTransaccion(
        db(),
        {
          cedula: NUEVO,
          nombres: "Ana María",
          apellidos: "Prueba Editada",
          email: "",
        },
        AHORA + 5,
      ),
    ).toEqual({ ok: true });
    const u = await usuario(NUEVO);
    expect(u.nombres).toBe("Ana María");
    expect(u.actualizadoEn).toBe(AHORA + 5);
    expect(await docs.emailDe(db(), NUEVO)).toBeNull();
    expect(
      await editarProfesorEnTransaccion(
        db(),
        { cedula: ALUMNO, nombres: "X", apellidos: "Y", email: "" },
        AHORA,
      ),
    ).toEqual({ ok: false, error: "no-profesor" });
  });

  test("guardarMisDatosCon: el profesor sí; el alumno no", async () => {
    expect(
      await guardarMisDatosCon(
        db(),
        ADMIN,
        { nombres: "César Andrés", apellidos: "Admin W1" },
        AHORA,
      ),
    ).toEqual({ ok: true });
    expect((await usuario(ADMIN)).nombres).toBe("César Andrés");
    expect(
      await guardarMisDatosCon(
        db(),
        ALUMNO,
        { nombres: "Otro", apellidos: "Nombre" },
        AHORA,
      ),
    ).toEqual({ ok: false, error: "no-profesor" });
    expect((await usuario(ALUMNO)).nombres).toBe("Luis");
  });

  test("editarAlumno no toca a un profesor", async () => {
    const r = await editarAlumnoEnTransaccion(
      db(),
      ADMIN,
      {
        cedula: NUEVO,
        nombres: "Hackeado",
        apellidos: "Por Otro",
        base: 20,
        motivo: "",
      },
      AHORA,
    );
    expect(r).toEqual({ ok: false, error: "invalida" });
    expect((await usuario(NUEVO)).nombres).toBe("Ana María");
  });
});

describe("eliminarCuentaCon (D233)", () => {
  test("borra la cuenta, sus sesiones, el perfil y el email; repetir no falla", async () => {
    await abrirSesion(NUEVO);
    await eliminarCuentaCon(db(), NUEVO);
    expect(await docs.existeCuenta(db(), NUEVO)).toBe(false);
    expect(await sesionesDe(NUEVO)).toBe(0);
    expect((await docs.snap(db(), "usuarios", NUEVO)).exists).toBe(false);
    expect(await docs.emailDe(db(), NUEVO)).toBeUndefined();
    await eliminarCuentaCon(db(), NUEVO);
    for (const c of [ADMIN, ALUMNO]) await eliminarCuentaCon(db(), c);
    expect(emailInterno(ADMIN)).toContain(ADMIN);
  });
});
