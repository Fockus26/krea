/**
 * Carga el seed del Excel en los EMULADORES de Firebase (nunca en la base real).
 *
 *   bun scripts/seed-emulator.ts          (qa-local lo corre solo tras arrancar los emuladores)
 *
 * Necesita FIRESTORE_EMULATOR_HOST y FIREBASE_AUTH_EMULATOR_HOST y un proyecto `demo-*`; si no,
 * aborta. Crea: los documentos de `lib/seed-firestore.ts`, `ranking/{5A,5C}` calculado, las
 * cuentas de Auth de los alumnos (uid = cédula, email interno, claims) y una cuenta de
 * profesor de prueba. Contraseña de todas: SEED_PASSWORD (por defecto «krea-demo-2026»: solo
 * existe en el emulador).
 */
import { readFileSync } from "node:fs";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import {
  COL,
  claimsDe,
  DOC_SECCIONES,
  emailInterno,
  type Usuario,
} from "@/lib/modelo";
import { calcularRanking } from "@/lib/ranking-datos";
import {
  anioDoc,
  CATALOGO_INICIAL,
  listaSecciones,
  seccionesDe,
} from "@/lib/secciones";
import {
  type AlumnoSeed,
  docsDesdeSeed,
  ESTILO_AVATAR_DEFECTO,
  type GrupoSeed,
  type TareaSeed,
} from "@/lib/seed-firestore";

const proyecto = process.env.GCLOUD_PROJECT || "demo-krea";
if (
  !process.env.FIRESTORE_EMULATOR_HOST ||
  !process.env.FIREBASE_AUTH_EMULATOR_HOST
) {
  console.error(
    "✗ Sin FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST: no se carga nada.",
  );
  process.exit(1);
}
if (!proyecto.startsWith("demo-")) {
  console.error(`✗ El seed solo va a un proyecto demo-* (es ${proyecto}).`);
  process.exit(1);
}

const leer = <T>(ruta: string): T =>
  JSON.parse(readFileSync(ruta, "utf8")) as T;
const alumnos = leer<AlumnoSeed[]>("data/seed/alumnos.json");
const grupos = leer<GrupoSeed[]>("data/seed/grupos.json");
const tarea = leer<TareaSeed>("data/seed/tarea-identidad-marca.json");

/** PLACEHOLDER: profesor de prueba del emulador (el seed no trae profesores). */
const PROFE_DEMO: Usuario = {
  cedula: "10000000",
  rol: "profesor",
  nombres: "Profesor",
  apellidos: "de Prueba",
  seccion: null,
  equipoId: null,
  base: 20,
  avatar: { estilo: ESTILO_AVATAR_DEFECTO, semilla: "10000000" },
  // Admin (D231): el QA prueba la pantalla Profesores con esta cuenta
  admin: true,
  actualizadoEn: 0,
};

const password = process.env.SEED_PASSWORD || "krea-demo-2026";
const ahora = Date.now();
const docs = docsDesdeSeed(alumnos, grupos, tarea, ahora);
docs.usuarios.push({
  id: PROFE_DEMO.cedula,
  data: { ...PROFE_DEMO, actualizadoEn: ahora },
});
docs.privados.push({ id: PROFE_DEMO.cedula, data: { email: null } });

const app = initializeApp({ projectId: proyecto });
const db = getFirestore(app);
const auth = getAuth(app);

let lote = db.batch();
let enLote = 0;
async function poner(col: string, id: string, data: object) {
  lote.set(db.collection(col).doc(id), data);
  if (++enLote === 400) {
    await lote.commit();
    lote = db.batch();
    enLote = 0;
  }
}

for (const [col, filas] of [
  [COL.usuarios, docs.usuarios],
  [COL.privados, docs.privados],
  [COL.equipos, docs.equipos],
  [COL.tareas, docs.tareas],
  [COL.entregas, docs.entregas],
  [COL.ajustes, docs.ajustes],
] as const) {
  for (const f of filas) await poner(col, f.id, f.data);
}
const datos = {
  usuarios: docs.usuarios.map((u) => u.data),
  equipos: docs.equipos.map((e) => ({ id: e.id, ...e.data })),
  entregas: docs.entregas.map((e) => e.data),
  ajustes: docs.ajustes.map((a) => a.data),
};
const seccionesSeed = seccionesDe(CATALOGO_INICIAL);
for (const s of seccionesSeed)
  await poner(COL.ranking, s, calcularRanking(s, datos, ahora));
// Catálogo de años y secciones (D317): el de producción, explícito
await poner(COL.config, DOC_SECCIONES, {
  anios: anioDoc(CATALOGO_INICIAL),
  actualizadoEn: ahora,
});
await lote.commit();

let creadas = 0;
for (const { data: u } of docs.usuarios) {
  try {
    await auth.createUser({
      uid: u.cedula,
      email: emailInterno(u.cedula),
      password,
      displayName: `${u.nombres} ${u.apellidos}`,
    });
    creadas++;
  } catch (e) {
    if ((e as { code?: string }).code !== "auth/uid-already-exists") throw e;
  }
  await auth.setCustomUserClaims(u.cedula, claimsDe(u));
}

console.log(
  `✓ Seed en ${proyecto}: ${docs.usuarios.length} usuarios (${creadas} cuentas nuevas), ` +
    `${docs.equipos.length} equipos, ${docs.tareas.length} tareas, ${docs.entregas.length} entregas, ` +
    `${docs.ajustes.length} ajustes, ranking de ${listaSecciones(seccionesSeed)}.`,
);
process.exit(0);
