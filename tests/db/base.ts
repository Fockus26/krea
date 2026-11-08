// Postgres en memoria (PGlite) con las migraciones de drizzle/ (D327): las pruebas de autorización y
// de la capa de datos corren sin Docker ni VPS. Cada `baseNueva()` es una base vacía.
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { Db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export async function baseNueva(): Promise<Db> {
  const cliente = new PGlite();
  const db = drizzle(cliente, { schema });
  await migrate(db, { migrationsFolder: "drizzle" });
  return db as unknown as Db;
}
