/**
 * Carga el seed del Excel en una base de DESARROLLO de Postgres (D327; reemplaza seed-emulator).
 *
 *   bun scripts/seed-db.ts            (usa DATABASE_URL de .env.development.local o del entorno)
 *
 * Solo acepta una base local (localhost / 127.0.0.1) o una del VPS cuyo nombre termine en `_dev`
 * o `_preview`: nunca la de producción. Crea los perfiles y cuentas de `lib/seed-firestore.ts`, el
 * ranking de cada sección calculado, el catálogo inicial y un profesor admin de prueba. Contraseña
 * de todas: SEED_PASSWORD (por defecto «krea-demo-2026»: solo existe en desarrollo).
 */
import { existsSync, readFileSync } from "node:fs";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { insertarCuentaAuth } from "@/lib/data/cuentas";
import {
  filaDeAjuste,
  filaDeEntrega,
  filaDeEquipo,
  filaDeTarea,
} from "@/lib/data/filas";
import { filaDeUsuario } from "@/lib/data/usuarios";
import type { Db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { DOC_SECCIONES, type Usuario } from "@/lib/modelo";
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

if (!process.env.DATABASE_URL && existsSync(".env.development.local"))
  process.loadEnvFile(".env.development.local");
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("✗ Sin DATABASE_URL: no se carga nada.");
  process.exit(1);
}
const destino = new URL(url);
const nombre = destino.pathname.slice(1);
const local = ["localhost", "127.0.0.1", "::1"].includes(destino.hostname);
if (!local && !/_(dev|preview)$/.test(nombre)) {
  console.error(
    `✗ El seed solo va a una base local o *_dev / *_preview (es «${nombre}»).`,
  );
  process.exit(1);
}

const leer = <T>(ruta: string): T =>
  JSON.parse(readFileSync(ruta, "utf8")) as T;
const alumnos = leer<AlumnoSeed[]>("data/seed/alumnos.json");
const grupos = leer<GrupoSeed[]>("data/seed/grupos.json");
const tarea = leer<TareaSeed>("data/seed/tarea-identidad-marca.json");

/** PLACEHOLDER: profesor de prueba (el seed no trae profesores). */
const PROFE_DEMO: Usuario = {
  cedula: "10000000",
  rol: "profesor",
  nombres: "Profesor",
  apellidos: "de Prueba",
  seccion: null,
  equipoId: null,
  base: 20,
  avatar: { estilo: ESTILO_AVATAR_DEFECTO, semilla: "10000000" },
  admin: true,
  actualizadoEn: 0,
};

const pool = new Pool({ connectionString: url, max: 2 });
pool.on("error", (e) => console.error("[seed] pool", e.message));
const db = drizzle(pool, { schema }) as unknown as Db;

const ahora = Date.now();
const docs = docsDesdeSeed(alumnos, grupos, tarea, ahora);
docs.usuarios.push({
  id: PROFE_DEMO.cedula,
  data: { ...PROFE_DEMO, actualizadoEn: ahora },
});
const emails = new Map(docs.privados.map((p) => [p.id, p.data.email]));
const hash = await hashPassword(process.env.SEED_PASSWORD || "krea-demo-2026");

let cuentas = 0;
await db.transaction(async (tx) => {
  for (const { data: u } of docs.usuarios) {
    const [existe] = await tx
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(eq(schema.user.id, u.cedula));
    if (!existe) {
      await insertarCuentaAuth(
        tx,
        u.cedula,
        `${u.nombres} ${u.apellidos}`,
        hash,
      );
      cuentas++;
    }
    const fila = {
      ...filaDeUsuario(u),
      emailRecuperacion: emails.get(u.cedula) ?? null,
    };
    await tx
      .insert(schema.usuarios)
      .values(fila)
      .onConflictDoUpdate({ target: schema.usuarios.cedula, set: fila });
  }
  for (const e of docs.equipos) {
    const f = filaDeEquipo(e.id, e.data);
    await tx
      .insert(schema.equipos)
      .values(f)
      .onConflictDoUpdate({ target: schema.equipos.id, set: f });
  }
  for (const t of docs.tareas) {
    const f = filaDeTarea(t.id, t.data);
    await tx
      .insert(schema.tareas)
      .values(f)
      .onConflictDoUpdate({ target: schema.tareas.id, set: f });
  }
  for (const e of docs.entregas) {
    const f = filaDeEntrega(e.id, e.data);
    await tx
      .insert(schema.entregas)
      .values(f)
      .onConflictDoUpdate({ target: schema.entregas.id, set: f });
  }
  for (const a of docs.ajustes) {
    const f = filaDeAjuste(a.id, a.data);
    await tx
      .insert(schema.ajustes)
      .values(f)
      .onConflictDoUpdate({ target: schema.ajustes.id, set: f });
  }
  const datos = {
    usuarios: docs.usuarios.map((u) => u.data),
    equipos: docs.equipos.map((e) => ({ id: e.id, ...e.data })),
    entregas: docs.entregas.map((e) => e.data),
    ajustes: docs.ajustes.map((a) => a.data),
  };
  for (const s of seccionesDe(CATALOGO_INICIAL)) {
    const r = calcularRanking(s, datos, ahora);
    await tx
      .insert(schema.ranking)
      .values({ seccion: s, ...r })
      .onConflictDoUpdate({ target: schema.ranking.seccion, set: r });
  }
  const catalogo = { anios: anioDoc(CATALOGO_INICIAL), actualizadoEn: ahora };
  await tx
    .insert(schema.config)
    .values({ id: DOC_SECCIONES, datos: catalogo })
    .onConflictDoUpdate({ target: schema.config.id, set: { datos: catalogo } });
});

console.log(
  `✓ Seed en «${nombre}»: ${docs.usuarios.length} usuarios (${cuentas} cuentas nuevas), ` +
    `${docs.equipos.length} equipos, ${docs.tareas.length} tareas, ${docs.entregas.length} entregas, ` +
    `${docs.ajustes.length} ajustes, ranking de ${listaSecciones(seccionesDe(CATALOGO_INICIAL))}.`,
);
await pool.end();
