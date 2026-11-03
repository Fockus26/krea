// Cookie de sesión contra el emulador de Auth (D180): login real con el SDK del navegador,
// cookie con el Admin SDK y verificación con `sesionDeCookie` (lo que usan el proxy y el DAL).
import { beforeAll, describe, expect, test } from "bun:test";
import { initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  getApps as getAdminApps,
  initializeApp as initAdmin,
} from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { sesionDeCookie } from "@/lib/firebase/sesion-servidor";
import { emailInterno } from "@/lib/modelo";

const PROYECTO = process.env.GCLOUD_PROJECT ?? "demo-krea";
const CEDULA = "33272397";
const PW = "clave-de-prueba-1";

const admin = () =>
  getAdminAuth(getAdminApps()[0] ?? initAdmin({ projectId: PROYECTO }));

const cliente = initializeApp(
  { apiKey: "demo-key", projectId: PROYECTO },
  "cliente",
);
const auth = getAuth(cliente);
connectAuthEmulator(auth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, {
  disableWarnings: true,
});

async function cookieDe(cedula: string, claims: object | null) {
  await admin()
    .deleteUser(cedula)
    .catch(() => {});
  await admin().createUser({
    uid: cedula,
    email: emailInterno(cedula),
    password: PW,
  });
  if (claims) await admin().setCustomUserClaims(cedula, claims);
  const cred = await signInWithEmailAndPassword(auth, emailInterno(cedula), PW);
  const idToken = await cred.user.getIdToken(true);
  return admin().createSessionCookie(idToken, { expiresIn: 60 * 60 * 1000 });
}

beforeAll(() => {
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST)
    throw new Error("Sin emulador de Auth");
}, 30_000);

describe("sesionDeCookie", () => {
  test("cookie válida con claims → sesión del estudiante", async () => {
    const c = await cookieDe(CEDULA, {
      rol: "estudiante",
      seccion: "5A",
      equipoId: "5a-g2",
    });
    expect(await sesionDeCookie(c, { revocadas: true })).toEqual({
      uid: CEDULA,
      rol: "estudiante",
      seccion: "5A",
      equipoId: "5a-g2",
    });
  });

  test("cuenta sin rol → null", async () => {
    const c = await cookieDe("20000000", null);
    expect(await sesionDeCookie(c, { revocadas: false })).toBeNull();
  });

  test("cookie alterada o vacía → null", async () => {
    const c = await cookieDe(CEDULA, { rol: "profesor" });
    expect(
      await sesionDeCookie(`${c.slice(0, -4)}xxxx`, { revocadas: false }),
    ).toBeNull();
    expect(await sesionDeCookie("basura", { revocadas: false })).toBeNull();
    expect(await sesionDeCookie(undefined, { revocadas: false })).toBeNull();
  });

  test("tras revocar (Salir): el DAL la rechaza", async () => {
    const c = await cookieDe(CEDULA, { rol: "profesor" });
    expect(await sesionDeCookie(c, { revocadas: true })).not.toBeNull();
    await new Promise((r) => setTimeout(r, 1100)); // la revocación es por segundo
    await admin().revokeRefreshTokens(CEDULA);
    expect(await sesionDeCookie(c, { revocadas: true })).toBeNull();
  });
});
