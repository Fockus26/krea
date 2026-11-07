// Presencia al editar un alumno (W14, D275–D277) contra los emuladores:
//   - reglas: un profe escribe y borra solo SU entrada, con claves y tipos exactos; el estudiante
//     ni lee ni escribe;
//   - «el último gana» (D276): dos profes abren el mismo alumno, guarda uno y el segundo recibe
//     `conflicto` con los valores vigentes; con la versión nueva, guarda;
//   - eliminar alumno borra su presencia (Admin).
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import {
  getApps as getAdminApps,
  initializeApp as initAdmin,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { versionDe } from "@/lib/alumnos-datos";
import { editarAlumnoEnTransaccion } from "@/lib/firebase/alumnos";
import { borrarPresenciaAlumno } from "@/lib/firebase/presencia";
import { COL, SUBCOL_EDITORES, type Usuario, zUsuario } from "@/lib/modelo";

const PROYECTO = process.env.GCLOUD_PROJECT ?? "demo-krea";
const app = () => getAdminApps()[0] ?? initAdmin({ projectId: PROYECTO });
const adminDb = () => getFirestore(app());

let env: RulesTestEnvironment;

const PROFE_A = "31400001";
const PROFE_B = "31400002";
const ALUMNO = "39914001";
const ALUMNO_BORRAR = "39914002";
const AHORA = Date.UTC(2026, 10, 7, 15);

const profe = (uid: string) =>
  env
    .authenticatedContext(uid, {
      rol: "profesor",
      seccion: null,
      equipoId: null,
    })
    .firestore();
const estudiante = () =>
  env
    .authenticatedContext(ALUMNO, {
      rol: "estudiante",
      seccion: "5A",
      equipoId: null,
    })
    .firestore();

type Db = ReturnType<typeof profe>;
const entrada = (db: Db, profeId: string, alumnoId = ALUMNO) =>
  doc(db, COL.presencia, alumnoId, SUBCOL_EDITORES, profeId);
const nueva = (nombre = "Ana Pérez") => ({
  nombre,
  desde: serverTimestamp(),
  latido: serverTimestamp(),
});

const alumno = (cedula: string): Usuario => ({
  cedula,
  rol: "estudiante",
  nombres: "Luis Alberto",
  apellidos: "Prueba W14",
  seccion: "5A",
  equipoId: null,
  base: 20,
  avatar: { estilo: "adventurer-neutral", semilla: cedula },
  actualizadoEn: 1,
});

beforeAll(async () => {
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST)
    throw new Error("Corre con `bun run test:rules` (emuladores)");
  env = await initializeTestEnvironment({
    projectId: "demo-krea-rules",
    firestore: {
      rules: readFileSync("firebase/firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
  // La entrada de otro profe, ya escrita
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(entrada(ctx.firestore(), PROFE_B), {
      nombre: "Luis Díaz",
      desde: Timestamp.now(),
      latido: Timestamp.now(),
    });
  });
  const b = adminDb().batch();
  b.set(adminDb().collection(COL.usuarios).doc(ALUMNO), alumno(ALUMNO));
  b.set(adminDb().collection(COL.privados).doc(ALUMNO), { email: null });
  await b.commit();
});

afterAll(async () => {
  await env?.cleanup();
});

describe("reglas de presencia (D275)", () => {
  test("un profe crea, renueva y borra SU entrada", async () => {
    const db = profe(PROFE_A);
    await assertSucceeds(setDoc(entrada(db, PROFE_A), nueva()));
    await assertSucceeds(
      updateDoc(entrada(db, PROFE_A), { latido: serverTimestamp() }),
    );
    // Volver a crearla encima (otra pestaña la borró y el latido la rehace)
    await assertSucceeds(setDoc(entrada(db, PROFE_A), nueva()));
    await assertSucceeds(deleteDoc(entrada(db, PROFE_A)));
  });

  test("no escribe ni borra la entrada de otro profe", async () => {
    const db = profe(PROFE_A);
    await assertFails(setDoc(entrada(db, PROFE_B), nueva("Suplantado")));
    await assertFails(
      updateDoc(entrada(db, PROFE_B), { latido: serverTimestamp() }),
    );
    await assertFails(deleteDoc(entrada(db, PROFE_B)));
  });

  test("claves extra o que faltan → denegado", async () => {
    const db = profe(PROFE_A);
    await assertFails(setDoc(entrada(db, PROFE_A), { ...nueva(), base: 10 }));
    await assertFails(
      setDoc(entrada(db, PROFE_A), {
        nombre: "Ana Pérez",
        latido: serverTimestamp(),
      }),
    );
  });

  test("tipos y timestamps: nombre vacío, latido del cliente o desde inventado → denegado", async () => {
    const db = profe(PROFE_A);
    await assertFails(setDoc(entrada(db, PROFE_A), nueva("")));
    await assertFails(setDoc(entrada(db, PROFE_A), nueva("x".repeat(121))));
    await assertFails(
      setDoc(entrada(db, PROFE_A), {
        nombre: "Ana Pérez",
        desde: serverTimestamp(),
        latido: Timestamp.fromMillis(Date.now() + 3_600_000),
      }),
    );
    await assertFails(
      setDoc(entrada(db, PROFE_A), {
        nombre: "Ana Pérez",
        desde: Timestamp.fromMillis(0),
        latido: serverTimestamp(),
      }),
    );
    await assertFails(
      setDoc(entrada(db, PROFE_A), {
        nombre: 42,
        desde: serverTimestamp(),
        latido: serverTimestamp(),
      }),
    );
  });

  test("la ruta del alumno tiene que ser una cédula", async () => {
    await assertFails(
      setDoc(entrada(profe(PROFE_A), PROFE_A, "no-es-cedula"), nueva()),
    );
  });

  test("el profe lee la entrada y la consulta de grupo «editores»", async () => {
    const db = profe(PROFE_A);
    await assertSucceeds(getDoc(entrada(db, PROFE_B)));
    await assertSucceeds(
      getDocs(collection(db, COL.presencia, ALUMNO, SUBCOL_EDITORES)),
    );
    await assertSucceeds(getDocs(collectionGroup(db, SUBCOL_EDITORES)));
  });

  test("el estudiante ni lee ni escribe", async () => {
    const db = estudiante();
    await assertFails(getDoc(entrada(db, PROFE_B)));
    await assertFails(getDocs(collectionGroup(db, SUBCOL_EDITORES)));
    await assertFails(setDoc(entrada(db, ALUMNO), nueva("Yo")));
  });

  test("sin sesión: nada", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(entrada(db, PROFE_B)));
    await assertFails(setDoc(entrada(db, PROFE_A), nueva()));
  });

  test("fuera de `presencia/`, el profe sigue sin escribir (D175)", async () => {
    const db = profe(PROFE_A);
    await assertFails(
      setDoc(doc(db, COL.usuarios, ALUMNO), { nombres: "Hackeado" }),
    );
    await assertFails(
      setDoc(doc(db, "otra", "x", SUBCOL_EDITORES, PROFE_A), nueva()),
    );
  });
});

describe("«el último gana» (D276)", () => {
  test("dos profes abren el mismo alumno: el segundo guardado recibe el conflicto", async () => {
    const snap = await adminDb().collection(COL.usuarios).doc(ALUMNO).get();
    const abierto = versionDe(zUsuario.parse(snap.data()), null);
    const base = {
      cedula: ALUMNO,
      apellidos: "Prueba W14",
      base: 20,
      motivo: "",
      email: "",
    };

    const a = await editarAlumnoEnTransaccion(
      adminDb(),
      PROFE_A,
      { ...base, nombres: "Luis Ana", version: abierto },
      AHORA,
    );
    expect(a).toEqual({ ok: true });

    const b = await editarAlumnoEnTransaccion(
      adminDb(),
      PROFE_B,
      { ...base, nombres: "Luis Bruno", version: abierto },
      AHORA + 1,
    );
    expect(b).toEqual({
      ok: false,
      error: "conflicto",
      actual: {
        nombres: "Luis Ana",
        apellidos: "Prueba W14",
        base: 20,
        email: null,
      },
    });
    const tras = await adminDb().collection(COL.usuarios).doc(ALUMNO).get();
    expect(zUsuario.parse(tras.data()).nombres).toBe("Luis Ana");

    // Con la versión nueva (lo que vio tras el aviso), el último gana
    if (b.ok || b.error !== "conflicto") throw new Error("sin conflicto");
    const c = await editarAlumnoEnTransaccion(
      adminDb(),
      PROFE_B,
      { ...base, nombres: "Luis Bruno", version: b.actual },
      AHORA + 2,
    );
    expect(c).toEqual({ ok: true });
    const fin = await adminDb().collection(COL.usuarios).doc(ALUMNO).get();
    expect(zUsuario.parse(fin.data()).nombres).toBe("Luis Bruno");
  });

  test("un email cambiado por otro profe también es conflicto", async () => {
    const snap = await adminDb().collection(COL.usuarios).doc(ALUMNO).get();
    const abierto = versionDe(zUsuario.parse(snap.data()), null);
    await adminDb()
      .collection(COL.privados)
      .doc(ALUMNO)
      .set({ email: "luis.w14@gmail.com" });
    const r = await editarAlumnoEnTransaccion(
      adminDb(),
      PROFE_A,
      {
        cedula: ALUMNO,
        nombres: abierto.nombres,
        apellidos: abierto.apellidos,
        base: 18,
        motivo: "Acuerdo",
        email: "",
        version: abierto,
      },
      AHORA + 3,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("conflicto");
    const u = await adminDb().collection(COL.usuarios).doc(ALUMNO).get();
    expect(zUsuario.parse(u.data()).base).toBe(20);
  });
});

describe("eliminar alumno borra su presencia (D277)", () => {
  test("todas las entradas del alumno, ninguna de otro", async () => {
    const ref = (alumnoId: string, profeId: string) =>
      adminDb()
        .collection(COL.presencia)
        .doc(alumnoId)
        .collection(SUBCOL_EDITORES)
        .doc(profeId);
    const valor = { nombre: "Ana Pérez", desde: AHORA, latido: AHORA };
    await ref(ALUMNO_BORRAR, PROFE_A).set(valor);
    await ref(ALUMNO_BORRAR, PROFE_B).set(valor);
    await ref(ALUMNO, PROFE_A).set(valor);

    expect(await borrarPresenciaAlumno(adminDb(), ALUMNO_BORRAR)).toBe(2);
    expect((await ref(ALUMNO_BORRAR, PROFE_A).get()).exists).toBe(false);
    expect((await ref(ALUMNO, PROFE_A).get()).exists).toBe(true);
    expect(await borrarPresenciaAlumno(adminDb(), ALUMNO_BORRAR)).toBe(0);
  });
});
