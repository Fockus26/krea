// Conexión a Postgres del VPS (D327). Sin `server-only` para que lo usen el proxy, los scripts y
// las pruebas; nada del cliente lo importa. `DATABASE_URL` va por el pool de transacciones del
// VPS: nada de estado de sesión entre consultas (`SET`, advisory locks, `LISTEN`).
import type { ExtractTablesWithRelations } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import type {
  PgDatabase,
  PgQueryResultHKT,
  PgTransaction,
} from "drizzle-orm/pg-core";
import { Pool } from "pg";
import * as schema from "@/lib/db/schema";

type Esquema = typeof schema;
/** Cualquier driver de Postgres (node-postgres en la app, PGlite en las pruebas). */
export type Db = PgDatabase<PgQueryResultHKT, Esquema>;
/** La base o una transacción abierta: las funciones de `lib/data` aceptan las dos. */
export type Tx =
  | Db
  | PgTransaction<
      PgQueryResultHKT,
      Esquema,
      ExtractTablesWithRelations<Esquema>
    >;

let db: Db | null = null;

/** `null` sin `DATABASE_URL`: el llamador responde «no disponible», no inventa una conexión. */
export function baseDeDatos(): Db | null {
  if (db) return db;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  const pool = new Pool({ connectionString: url, max: 5 });
  // Sin esto, una conexión ociosa que el servidor corta tumba el proceso (world-flags).
  pool.on("error", (e) => console.error("[db] pool", e.message));
  db = drizzle(pool, { schema }) as unknown as Db;
  return db;
}

/** Igual que `baseDeDatos()` pero falla si no está configurada (scripts y acciones ya protegidas). */
export function bd(): Db {
  const d = baseDeDatos();
  if (!d) throw new Error("DATABASE_URL no configurada");
  return d;
}

/**
 * Espera las consultas una tras otra. Dentro de una transacción todas van por UNA conexión, y `pg`
 * no admite consultas en paralelo sobre la misma (las encola con un aviso; pg@9 lo quitará). Las
 * consultas de Drizzle son perezosas: no corren hasta que se esperan, así que pasarlas sin `await`
 * aquí es seguro. No sirve para promesas ya en marcha (llamadas a funciones `async`).
 */
export async function enSerie<T extends readonly unknown[]>(
  consultas: readonly [...T],
): Promise<{ -readonly [K in keyof T]: Awaited<T[K]> }> {
  const r: unknown[] = [];
  for (const q of consultas) r.push(await q);
  return r as { -readonly [K in keyof T]: Awaited<T[K]> };
}
