// Reglas de Firestore (D174, D175) contra el emulador:
//   bun run test:rules   (= firebase emulators:exec --only firestore … "bun test ./tests/rules")
import { afterAll, beforeAll, describe, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

let env: RulesTestEnvironment;

const YO = "33272397"; // 5A, equipo 5a-g2
const OTRO_5A = "32828381"; // 5A, equipo 5a-g1
const ALUMNO_5C = "30000001";
const PROFE = "10000000";

const estudiante = (uid: string, seccion: string, equipoId: string | null) =>
  env
    .authenticatedContext(uid, { rol: "estudiante", seccion, equipoId })
    .firestore();
const profe = () =>
  env
    .authenticatedContext(PROFE, {
      rol: "profesor",
      seccion: null,
      equipoId: null,
    })
    .firestore();

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-krea-rules",
    firestore: {
      rules: readFileSync("firebase/firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "usuarios", YO), { seccion: "5A" });
    await setDoc(doc(db, "usuarios", OTRO_5A), { seccion: "5A" });
    await setDoc(doc(db, "privados", YO), { email: null });
    await setDoc(doc(db, "equipos", "5a-g2"), { seccion: "5A" });
    await setDoc(doc(db, "equipos", "5c-g1"), { seccion: "5C" });
    await setDoc(doc(db, "tareas", "abierta-5a"), {
      estado: "abierta",
      secciones: ["5A"],
    });
    await setDoc(doc(db, "tareas", "borrador-5a"), {
      estado: "borrador",
      secciones: ["5A"],
    });
    await setDoc(doc(db, "tareas", "abierta-5c"), {
      estado: "abierta",
      secciones: ["5C"],
    });
    await setDoc(doc(db, "entregas", `t__${YO}`), { integrantes: [YO] });
    await setDoc(doc(db, "entregas", `t__${OTRO_5A}`), {
      integrantes: [OTRO_5A],
    });
    await setDoc(doc(db, "entregas", "t__5a-g2"), {
      integrantes: [YO, "34126088"],
    });
    await setDoc(doc(db, "ajustes", "a-yo"), {
      destino: "alumno",
      destinoId: YO,
    });
    await setDoc(doc(db, "ajustes", "a-otro"), {
      destino: "alumno",
      destinoId: OTRO_5A,
    });
    await setDoc(doc(db, "ajustes", "a-eq"), {
      destino: "equipo",
      destinoId: "5a-g2",
    });
    await setDoc(doc(db, "ajustes", "a-eq-otro"), {
      destino: "equipo",
      destinoId: "5a-g1",
    });
    await setDoc(doc(db, "historialBase", "h-yo"), { alumnoId: YO });
    await setDoc(doc(db, "historialBase", "h-otro"), { alumnoId: OTRO_5A });
    await setDoc(doc(db, "ranking", "5A"), { alumnos: {} });
    await setDoc(doc(db, "ranking", "5C"), { alumnos: {} });
    await setDoc(doc(db, "otra", "x"), { a: 1 });
  });
}, 30_000);

afterAll(async () => {
  await env?.cleanup();
});

describe("estudiante", () => {
  const db = () => estudiante(YO, "5A", "5a-g2");

  test("lee su perfil y su privado, no los de otros", async () => {
    await assertSucceeds(getDoc(doc(db(), "usuarios", YO)));
    await assertSucceeds(getDoc(doc(db(), "privados", YO)));
    await assertFails(getDoc(doc(db(), "usuarios", OTRO_5A)));
    await assertFails(getDoc(doc(db(), "privados", OTRO_5A)));
  });

  test("equipos y ranking solo de su sección", async () => {
    await assertSucceeds(getDoc(doc(db(), "equipos", "5a-g2")));
    await assertFails(getDoc(doc(db(), "equipos", "5c-g1")));
    await assertSucceeds(getDoc(doc(db(), "ranking", "5A")));
    await assertFails(getDoc(doc(db(), "ranking", "5C")));
  });

  test("tareas publicadas de su sección; ni borradores ni la otra sección", async () => {
    await assertSucceeds(getDoc(doc(db(), "tareas", "abierta-5a")));
    await assertFails(getDoc(doc(db(), "tareas", "borrador-5a")));
    await assertFails(getDoc(doc(db(), "tareas", "abierta-5c")));
  });

  test("entregas en las que figura (individual y grupal), no las de otros", async () => {
    await assertSucceeds(getDoc(doc(db(), "entregas", `t__${YO}`)));
    await assertSucceeds(getDoc(doc(db(), "entregas", "t__5a-g2")));
    await assertFails(getDoc(doc(db(), "entregas", `t__${OTRO_5A}`)));
  });

  test("ajustes propios y de su equipo; historial de su base", async () => {
    await assertSucceeds(getDoc(doc(db(), "ajustes", "a-yo")));
    await assertSucceeds(getDoc(doc(db(), "ajustes", "a-eq")));
    await assertFails(getDoc(doc(db(), "ajustes", "a-otro")));
    await assertFails(getDoc(doc(db(), "ajustes", "a-eq-otro")));
    await assertSucceeds(getDoc(doc(db(), "historialBase", "h-yo")));
    await assertFails(getDoc(doc(db(), "historialBase", "h-otro")));
  });

  test("sin equipo no ve ajustes de equipo", async () => {
    const sinEquipo = estudiante(OTRO_5A, "5A", null);
    await assertFails(getDoc(doc(sinEquipo, "ajustes", "a-eq")));
  });

  test("no escribe nada: ni su perfil, ni su entrega, ni el ranking (D175)", async () => {
    await assertFails(updateDoc(doc(db(), "usuarios", YO), { base: 20 }));
    await assertFails(
      setDoc(doc(db(), "entregas", `t__${YO}`), { integrantes: [YO] }),
    );
    await assertFails(setDoc(doc(db(), "ranking", "5A"), { alumnos: {} }));
    await assertFails(
      setDoc(doc(db(), "ajustes", "nuevo"), { destinoId: YO, valor: 20 }),
    );
  });

  test("un estudiante de 5C con claims de 5C no ve 5A", async () => {
    const c = estudiante(ALUMNO_5C, "5C", null);
    await assertFails(getDoc(doc(c, "ranking", "5A")));
    await assertSucceeds(getDoc(doc(c, "ranking", "5C")));
  });
});

describe("profesor", () => {
  test("lee todo lo del dominio", async () => {
    const db = profe();
    for (const [c, id] of [
      ["usuarios", OTRO_5A],
      ["privados", YO],
      ["equipos", "5c-g1"],
      ["tareas", "borrador-5a"],
      ["entregas", `t__${OTRO_5A}`],
      ["ajustes", "a-otro"],
      ["historialBase", "h-otro"],
      ["ranking", "5C"],
    ] as const) {
      await assertSucceeds(getDoc(doc(db, c, id)));
    }
  });
  test("tampoco escribe desde el cliente (D175)", async () => {
    await assertFails(
      setDoc(doc(profe(), "tareas", "nueva"), { estado: "abierta" }),
    );
    await assertFails(updateDoc(doc(profe(), "usuarios", YO), { base: 10 }));
  });
});

describe("sin sesión y colecciones desconocidas", () => {
  test("anónimo no lee nada", async () => {
    const anon = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(anon, "ranking", "5A")));
    await assertFails(getDoc(doc(anon, "tareas", "abierta-5a")));
  });
  test("una cuenta sin rol no lee nada", async () => {
    const sinRol = env.authenticatedContext(YO, {}).firestore();
    await assertFails(getDoc(doc(sinRol, "usuarios", OTRO_5A)));
    await assertFails(getDoc(doc(sinRol, "ranking", "5A")));
  });
  test("colección fuera del modelo: denegada incluso al profesor", async () => {
    await assertFails(getDoc(doc(profe(), "otra", "x")));
  });
});
