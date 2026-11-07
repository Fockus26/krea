// Cuentas contra los emuladores (W1, D231–D234): crear con contraseña temporal, crear la propia,
// marcar admin, editar/borrar profesores y que ningún profe edite a otro por Alumnos.
import { beforeAll, describe, expect, test } from "bun:test";
import {
  getApps as getAdminApps,
  initializeApp as initAdmin,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { ErrorCuenta } from "@/lib/cuentas-datos";
import { editarAlumnoEnTransaccion } from "@/lib/firebase/alumnos";
import {
  crearCuentaCon,
  crearPasswordPropia,
  editarProfesorEnTransaccion,
  eliminarCuentaCon,
  guardarMisDatosCon,
  hacerAdminCon,
} from "@/lib/firebase/cuentas";
import { verificarPassword } from "@/lib/firebase/password";
import { COL, emailInterno, zPrivado, zUsuario } from "@/lib/modelo";

const PROYECTO = process.env.GCLOUD_PROJECT ?? "demo-krea";
const app = () => getAdminApps()[0] ?? initAdmin({ projectId: PROYECTO });
const db = () => getFirestore(app());
const auth = () => getAuth(app());
const destino = () => ({
  apiKey: "demo-api-key",
  emuladorHost: process.env.FIREBASE_AUTH_EMULATOR_HOST,
});

const AHORA = Date.UTC(2026, 10, 6, 15);
const ADMIN = "39710001";
const NUEVO = "39710002";
const ALUMNO = "39710003";

const usuario = async (cedula: string) =>
  zUsuario.parse(
    (await db().collection(COL.usuarios).doc(cedula).get()).data(),
  );

/**
 * El error con el que rechaza `p`. `expect(p).rejects` se queda colgado en bun 1.4.4 con estas
 * promesas del Admin SDK (visto en W1): se captura a mano.
 */
async function rechazo(p: Promise<unknown>): Promise<unknown> {
  try {
    await p;
  } catch (e) {
    return e;
  }
  throw new Error("se esperaba un rechazo");
}

async function limpiar(cedula: string) {
  await auth()
    .deleteUser(cedula)
    .catch(() => {});
  await db().collection(COL.usuarios).doc(cedula).delete();
  await db().collection(COL.privados).doc(cedula).delete();
}

beforeAll(async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST)
    throw new Error("Sin emulador de Firestore");
  for (const c of [ADMIN, NUEVO, ALUMNO]) await limpiar(c);
}, 30_000);

describe("crearCuentaCon (D232, D233)", () => {
  let temporal = "";

  test("crea Auth, claims, perfil y privado; la temporal sirve para entrar", async () => {
    const r = await crearCuentaCon(
      auth(),
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
    const p = zPrivado.parse(
      (await db().collection(COL.privados).doc(NUEVO).get()).data(),
    );
    expect(p.email).toBe("ana@example.com");
    const cuenta = await auth().getUser(NUEVO);
    expect(cuenta.email).toBe(emailInterno(NUEVO));
    expect(cuenta.customClaims).toEqual({
      rol: "profesor",
      seccion: null,
      equipoId: null,
      debeCambiarPassword: true,
    });
    const login = await verificarPassword(
      emailInterno(NUEVO),
      temporal,
      destino(),
    );
    expect(login.ok).toBe(true);
  });

  test("cédula que ya existe → «existe», sin pisar nada", async () => {
    const antes = await usuario(NUEVO);
    const intento = crearCuentaCon(
      auth(),
      db(),
      {
        rol: "profesor",
        cedula: NUEVO,
        nombres: "Otro",
        apellidos: "Nombre",
        email: null,
      },
      AHORA + 1,
    );
    const error = await rechazo(intento);
    expect(error).toBeInstanceOf(ErrorCuenta);
    expect(error).toMatchObject({ codigo: "existe" });
    expect(await usuario(NUEVO)).toEqual(antes);
    // La contraseña temporal sigue siendo la primera
    expect(
      (await verificarPassword(emailInterno(NUEVO), temporal, destino())).ok,
    ).toBe(true);
  });

  test("cuenta de Auth sin perfil → «existe» y no deja perfil a medias", async () => {
    await auth().createUser({ uid: ADMIN, email: emailInterno(ADMIN) });
    expect(
      await rechazo(
        crearCuentaCon(
          auth(),
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
    expect((await db().collection(COL.usuarios).doc(ADMIN).get()).exists).toBe(
      false,
    );
    await auth().deleteUser(ADMIN);
  });

  test("crearPasswordPropia: quita la marca del perfil y de las claims; la nueva sirve", async () => {
    await crearPasswordPropia(auth(), db(), NUEVO, "mi-clave-nueva-1", AHORA);
    expect((await usuario(NUEVO)).debeCambiarPassword).toBeUndefined();
    expect((await auth().getUser(NUEVO)).customClaims).toEqual({
      rol: "profesor",
      seccion: null,
      equipoId: null,
    });
    expect(
      (await verificarPassword(emailInterno(NUEVO), temporal, destino())).ok,
    ).toBe(false);
    expect(
      (
        await verificarPassword(
          emailInterno(NUEVO),
          "mi-clave-nueva-1",
          destino(),
        )
      ).ok,
    ).toBe(true);
  });
});

describe("admin y edición de profesores (D231, D233, D234)", () => {
  test("hacerAdminCon: perfil + claims; idempotente; un alumno no puede", async () => {
    await crearCuentaCon(
      auth(),
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
    expect(await hacerAdminCon(auth(), db(), ADMIN, AHORA)).toEqual({
      ok: true,
    });
    expect(await hacerAdminCon(auth(), db(), ADMIN, AHORA)).toEqual({
      ok: true,
    });
    expect((await usuario(ADMIN)).admin).toBe(true);
    // Conserva la marca de contraseña temporal que ya tenía
    expect((await auth().getUser(ADMIN)).customClaims).toEqual({
      rol: "profesor",
      seccion: null,
      equipoId: null,
      admin: true,
      debeCambiarPassword: true,
    });

    await crearCuentaCon(
      auth(),
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
    expect(await hacerAdminCon(auth(), db(), ALUMNO, AHORA)).toEqual({
      ok: false,
      error: "no-profesor",
    });
    expect(await hacerAdminCon(auth(), db(), "39719999", AHORA)).toEqual({
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
    expect(
      (await db().collection(COL.privados).doc(NUEVO).get()).data(),
    ).toEqual({ email: null });
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
  test("borra Auth, perfil y privado; repetir no falla", async () => {
    await eliminarCuentaCon(auth(), db(), NUEVO);
    expect(await rechazo(auth().getUser(NUEVO))).toMatchObject({
      code: "auth/user-not-found",
    });
    expect((await db().collection(COL.usuarios).doc(NUEVO).get()).exists).toBe(
      false,
    );
    expect((await db().collection(COL.privados).doc(NUEVO).get()).exists).toBe(
      false,
    );
    await eliminarCuentaCon(auth(), db(), NUEVO);
    for (const c of [ADMIN, ALUMNO]) await eliminarCuentaCon(auth(), db(), c);
  });
});
