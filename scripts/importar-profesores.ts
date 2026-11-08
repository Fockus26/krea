/**
 * Cutover a Postgres (D327): copia SOLO los profesores del proyecto Firebase a la base del VPS, con
 * su contraseña. Los alumnos y todo lo demás no se migran (decisión de César, 2026-11-07).
 *
 *   1. Exportar Auth (lo corre César, con su sesión de Firebase):
 *        bunx firebase-tools@15 auth:export auth.json --format=json --project krea-d22f7
 *   2. Exportar los perfiles de profesor (`usuarios` con rol profesor + el `privados` de cada uno)
 *      a profesores.json: [{ "usuario": { …documento de usuarios… }, "email": "…" | null }, …]
 *   3. Ensayo en una base temporal, luego la real:
 *        DATABASE_URL=… bun scripts/importar-profesores.ts auth.json profesores.json [--ensayo]
 *
 * Todo o nada (una transacción). Con `--ensayo` hace todo y al final deshace (ROLLBACK). Compara
 * contenido, no solo cuentas: cada perfil se valida con `zUsuario` y cada profesor tiene que tener
 * su hash en auth.json. Los hashes se guardan como `firebase$<hash>$<salt>`: Better Auth los
 * comprueba con el scrypt de Firebase (variables FIREBASE_HASH_*) y al cambiar la contraseña pasan
 * a su formato. Los dos JSON tienen hashes y datos personales: se guardan FUERA de la carpeta del
 * proyecto y se borran después del cutover.
 */
import { readFileSync } from "node:fs";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { z } from "zod";
import { PREFIJO_HASH_FIREBASE } from "@/lib/better-auth";
import { insertarCuentaAuth } from "@/lib/data/cuentas";
import { filaDeUsuario } from "@/lib/data/usuarios";
import type { Db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { zUsuario } from "@/lib/modelo";

const [rutaAuth, rutaPerfiles] = process.argv
  .slice(2)
  .filter((a) => !a.startsWith("--"));
const ensayo = process.argv.includes("--ensayo");
if (!rutaAuth || !rutaPerfiles || !process.env.DATABASE_URL) {
  console.error(
    "Uso: DATABASE_URL=… bun scripts/importar-profesores.ts auth.json profesores.json [--ensayo]",
  );
  process.exit(1);
}

const zAuth = z.object({
  users: z.array(
    z.object({
      localId: z.string(),
      passwordHash: z.string().optional(),
      salt: z.string().optional(),
    }),
  ),
});
const zPerfiles = z.array(
  z.object({
    usuario: zUsuario,
    email: z.string().trim().toLowerCase().email().nullable(),
  }),
);

const auth = zAuth.parse(JSON.parse(readFileSync(rutaAuth, "utf8")));
const perfiles = zPerfiles.parse(
  JSON.parse(readFileSync(rutaPerfiles, "utf8")),
);
const hashes = new Map(auth.users.map((u) => [u.localId, u]));

const problemas: string[] = [];
for (const { usuario } of perfiles) {
  if (usuario.rol !== "profesor")
    problemas.push(`${usuario.cedula}: no es profesor`);
  const h = hashes.get(usuario.cedula);
  if (!h?.passwordHash || !h.salt)
    problemas.push(`${usuario.cedula}: sin hash en auth.json`);
}
if (problemas.length) {
  console.error(
    `✗ ${problemas.length} problema(s), no se importa nada:\n  ${problemas.join("\n  ")}`,
  );
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
pool.on("error", (e) => console.error("[importar] pool", e.message));
const db = drizzle(pool, { schema }) as unknown as Db;

class Ensayo extends Error {}
try {
  await db.transaction(async (tx) => {
    for (const { usuario, email } of perfiles) {
      const h = hashes.get(usuario.cedula);
      const hash = `${PREFIJO_HASH_FIREBASE}${h?.passwordHash}$${h?.salt}`;
      await insertarCuentaAuth(
        tx,
        usuario.cedula,
        `${usuario.nombres} ${usuario.apellidos}`,
        hash,
      );
      // Sus sesiones de Firebase no viajan: la primera vez entra de nuevo (con su contraseña de siempre)
      await tx
        .insert(schema.usuarios)
        .values({ ...filaDeUsuario(usuario), emailRecuperacion: email });
    }
    const n = await tx.$count(schema.usuarios);
    if (n !== perfiles.length)
      throw new Error(
        `se esperaban ${perfiles.length} perfiles y hay ${n} (¿la base no estaba vacía?)`,
      );
    console.log(
      `✓ ${n} profesores copiados con su contraseña${ensayo ? " (ensayo: se deshace)" : ""}.`,
    );
    if (ensayo) throw new Ensayo();
  });
} catch (e) {
  if (!(e instanceof Ensayo)) {
    console.error("✗ No se importó nada:", (e as Error).message);
    process.exitCode = 1;
  }
} finally {
  await pool.end();
}
