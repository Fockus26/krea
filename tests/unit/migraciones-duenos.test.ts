// Guardia de las migraciones (D436): las tablas de 0004–0006 se aplicaron con `psql` como
// `postgres`, quedaron con ese dueño y el rol de la app no podía leerlas («permission denied for
// table partes / analisis_ia»). Una migración no fija dueños ni cambia de rol: la aplica el rol de
// la app (`bun run db:migrate`) o, si va por `psql` como `postgres`, se corre justo después
// `scripts/sql/2026-11-20-duenos-tablas.sql`. Esta prueba vigila lo primero; lo segundo, el PR.
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const CARPETA = "drizzle";
const migraciones = readdirSync(CARPETA)
  .filter((f) => f.endsWith(".sql"))
  .sort();

/** Lo que ata una migración a un rol concreto (sin comentarios SQL de por medio). */
const PROHIBIDO = [
  /\bOWNER\s+TO\b/i,
  /\bSET\s+(SESSION\s+|LOCAL\s+)?ROLE\b/i,
  /\bSET\s+SESSION\s+AUTHORIZATION\b/i,
  /\bRESET\s+ROLE\b/i,
];

const sinComentarios = (sql: string) =>
  sql.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--[^\n]*/g, "");

describe("migraciones sin dueño ni rol fijo (D436)", () => {
  test("hay migraciones que revisar", () => {
    expect(migraciones.length).toBeGreaterThan(0);
  });

  for (const archivo of migraciones) {
    test(archivo, () => {
      const sql = sinComentarios(readFileSync(join(CARPETA, archivo), "utf8"));
      for (const patron of PROHIBIDO) expect(sql).not.toMatch(patron);
    });
  }

  test("el script de dueños existe y es idempotente (solo cambia lo que no es del rol de la app)", () => {
    const sql = readFileSync(
      "scripts/sql/2026-11-20-duenos-tablas.sql",
      "utf8",
    );
    expect(sql).toContain("tablename = 'tareas'");
    expect(sql).toContain("tableowner <> dueno");
    expect(sql).toContain("sequenceowner <> dueno");
  });
});
