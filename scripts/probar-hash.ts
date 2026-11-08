/**
 * Cutover (D327): comprueba, ANTES del merge, que un profesor importado entra con su contraseña de
 * Firebase. Lo corre César: pide la cédula y la contraseña en la terminal, lee el hash de la base de
 * producción y lo verifica con las FIREBASE_HASH_* de Vercel (producción). Solo imprime ✓ o ✗.
 *
 *   bun scripts/probar-hash.ts
 */
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/lib/db/schema";

const tmp = join(tmpdir(), `krea-prod-${process.pid}.env`);
const pull = Bun.spawnSync(
  ["vercel", "env", "pull", tmp, "--environment=production", "--yes"],
  { stdout: "ignore", stderr: "ignore" },
);
if (pull.exitCode !== 0) {
  console.error("✗ vercel env pull falló (¿vercel login?)");
  process.exit(1);
}
const url = Bun.spawnSync([
  "ssh",
  "-o",
  "BatchMode=yes",
  "kit-vps",
  "kit-db",
  "url",
  "krea",
]);
try {
  process.loadEnvFile(tmp);
} finally {
  rmSync(tmp, { force: true });
}
if (url.exitCode !== 0) {
  console.error("✗ no se pudo pedir la URL de la base (ssh kit-vps)");
  process.exit(1);
}

const cedula = (prompt("Cédula del profesor:") ?? "").trim();
const password =
  prompt("Contraseña (se ve al escribir; borra la terminal después):") ?? "";

// Se importa después de cargar las variables: lee FIREBASE_HASH_* al verificar.
const { verificarHash, PREFIJO_HASH_FIREBASE } = await import(
  "@/lib/better-auth"
);
const pool = new Pool({
  connectionString: url.stdout.toString().trim(),
  max: 1,
});
const db = drizzle(pool, { schema });
const [cuenta] = await db
  .select({ password: schema.account.password })
  .from(schema.account)
  .where(
    and(
      eq(schema.account.userId, cedula),
      eq(schema.account.providerId, "credential"),
    ),
  )
  .limit(1);
await pool.end();

if (!cuenta?.password) {
  console.log("✗ Esa cédula no tiene cuenta en la base de producción.");
  process.exit(1);
}
const deFirebase = cuenta.password.startsWith(PREFIJO_HASH_FIREBASE);
const ok = await verificarHash({ hash: cuenta.password, password });
console.log(
  ok
    ? `✓ La contraseña coincide${deFirebase ? " (hash importado de Firebase)" : ""}.`
    : "✗ No coincide: revisa la contraseña o las FIREBASE_HASH_* de Vercel.",
);
process.exit(ok ? 0 : 1);
