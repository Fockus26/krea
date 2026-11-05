// «Olvidé mi contraseña» contra los emuladores de Auth y Firestore (D186–D188): enlace real del
// Admin SDK, límite en transacción y la REST de Identity Toolkit para verificar y gastar el
// código. Brevo es un doble: nunca se llama a la red.
import { beforeAll, describe, expect, test } from "bun:test";
import {
  getApps as getAdminApps,
  initializeApp as initAdmin,
} from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import type { Correo } from "@/lib/correo/brevo";
import { resetConCodigo, verificarPassword } from "@/lib/firebase/password";
import { depsRecuperacion } from "@/lib/firebase/recuperacion";
import { COL, emailInterno } from "@/lib/modelo";
import { procesarRecuperacion } from "@/lib/recuperar";

const PROYECTO = process.env.GCLOUD_PROJECT ?? "demo-krea";
const CON_EMAIL = "38291460";
const SIN_EMAIL = "38291461";
const PW = "clave-vieja-1";
const NUEVA = "clave-nueva-2";

const app = () => getAdminApps()[0] ?? initAdmin({ projectId: PROYECTO });
const auth = () => getAdminAuth(app());
const db = () => getFirestore(app());
const destino = () => ({
  apiKey: "demo-api-key",
  emuladorHost: process.env.FIREBASE_AUTH_EMULATOR_HOST,
});

async function cuenta(cedula: string, email: string | null) {
  await auth()
    .deleteUser(cedula)
    .catch(() => {});
  await auth().createUser({
    uid: cedula,
    email: emailInterno(cedula),
    password: PW,
  });
  await db().collection(COL.privados).doc(cedula).set({ email });
  await db()
    .collection(COL.usuarios)
    .doc(cedula)
    .set({ nombres: "Prueba Alumno", apellidos: "QA" });
  await db().collection(COL.recuperaciones).doc(cedula).delete();
}

function conDoble() {
  const enviados: Correo[] = [];
  const deps = depsRecuperacion(
    { auth: auth(), db: db() },
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

beforeAll(() => {
  if (
    !process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    !process.env.FIRESTORE_EMULATOR_HOST
  )
    throw new Error("Sin emuladores de Auth y Firestore");
}, 30_000);

describe("recuperar contraseña (emuladores)", () => {
  test("con email: un correo al email real con un oobCode que sirve una vez", async () => {
    await cuenta(CON_EMAIL, "alumno.prueba@correo.test");
    const { deps, enviados } = conDoble();
    expect(await procesarRecuperacion(CON_EMAIL, deps)).toBe("enviado");
    expect(enviados).toHaveLength(1);
    expect(enviados[0].para).toEqual({
      email: "alumno.prueba@correo.test",
      nombre: "Prueba",
    });
    const oob = oobDe(enviados[0]);
    expect(oob).toBeTruthy();

    // Verificar no gasta el código; confirmar sí.
    expect(await resetConCodigo(oob as string, null, destino())).toEqual({
      ok: true,
      email: emailInterno(CON_EMAIL),
    });
    expect((await resetConCodigo(oob as string, NUEVA, destino())).ok).toBe(
      true,
    );
    const otraVez = await resetConCodigo(
      oob as string,
      "otra-clave-3",
      destino(),
    );
    expect(otraVez.ok).toBe(false);

    expect(
      (await verificarPassword(emailInterno(CON_EMAIL), NUEVA, destino())).ok,
    ).toBe(true);
    expect(
      (await verificarPassword(emailInterno(CON_EMAIL), PW, destino())).ok,
    ).toBe(false);
  });

  test("segundo pedido inmediato: límite, sin correo", async () => {
    await cuenta(CON_EMAIL, "alumno.prueba@correo.test");
    const { deps, enviados } = conDoble();
    expect(await procesarRecuperacion(CON_EMAIL, deps)).toBe("enviado");
    expect(await procesarRecuperacion(CON_EMAIL, deps)).toBe("limite");
    expect(enviados).toHaveLength(1);
    const snap = await db().collection(COL.recuperaciones).doc(CON_EMAIL).get();
    expect((snap.get("envios") as number[]).length).toBe(1);
  });

  test("sin email o sin documento: nada", async () => {
    await cuenta(SIN_EMAIL, null);
    const { deps, enviados } = conDoble();
    expect(await procesarRecuperacion(SIN_EMAIL, deps)).toBe("sin-email");
    expect(await procesarRecuperacion("99999999", deps)).toBe("sin-email");
    expect(enviados).toHaveLength(0);
    const snap = await db().collection(COL.recuperaciones).doc(SIN_EMAIL).get();
    expect(snap.exists).toBe(false);
  });

  test("código inventado: vencido", async () => {
    const r = await resetConCodigo("codigo-falso", null, destino());
    expect(r.ok).toBe(false);
  });
});
