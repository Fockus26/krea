/**
 * Profesores desde la terminal (D235): crear una cuenta de profesor y marcar al admin (D231).
 * Usa DATABASE_URL del entorno (`.env.development.local` si no está puesta): OJO, con la URL de
 * producción (`ssh kit-vps kit-db url krea`) eso es la base REAL (D327). Idempotente: repetirlo no
 * duplica ni pisa nada.
 *
 *   bun scripts/admin-profesor.ts --crear-profesor <cédula> --nombres "…" --apellidos "…" [--email …]
 *       Crea la cuenta con una contraseña temporal y la imprime UNA vez (no se guarda en ningún
 *       lado): dásela a la persona; al entrar, la app le pide crear la suya. Si la cédula ya
 *       tiene cuenta, lo dice y no toca nada.
 *
 *   bun scripts/admin-profesor.ts --hacer-admin <cédula>
 *       Marca a ese profesor como admin (perfil) y cierra sus sesiones: la próxima vez
 *       que entre ve «Profesores».
 *
 * Se pueden combinar: `--crear-profesor 45001237 --nombres … --apellidos … --hacer-admin 45001237`.
 */

import { existsSync } from "node:fs";
import { ErrorCuenta, zEntradaCuenta } from "@/lib/cuentas-datos";
import { crearCuentaCon, hacerAdminCon } from "@/lib/data/cuentas";
import { baseDeDatos } from "@/lib/db";

function valor(nombre: string): string | undefined {
  const i = process.argv.indexOf(nombre);
  if (i === -1) return undefined;
  const v = process.argv[i + 1];
  if (!v || v.startsWith("--")) {
    console.error(`✗ Falta el valor de ${nombre}.`);
    process.exit(1);
  }
  return v;
}

const crear = valor("--crear-profesor");
const hacerAdmin = valor("--hacer-admin");
if (!crear && !hacerAdmin) {
  console.error(
    "Uso: bun scripts/admin-profesor.ts --crear-profesor <cédula> --nombres … --apellidos … [--email …]\n" +
      "     bun scripts/admin-profesor.ts --hacer-admin <cédula>",
  );
  process.exit(1);
}

if (!process.env.DATABASE_URL && existsSync(".env.development.local"))
  process.loadEnvFile(".env.development.local");
const db = baseDeDatos();
if (!db) {
  console.error("✗ Sin DATABASE_URL en el entorno.");
  process.exit(1);
}
console.log(
  `→ base «${new URL(process.env.DATABASE_URL ?? "").pathname.slice(1)}»`,
);

if (crear) {
  const cuenta = zEntradaCuenta.safeParse({
    rol: "profesor",
    cedula: crear,
    nombres: valor("--nombres") ?? "",
    apellidos: valor("--apellidos") ?? "",
    email: valor("--email") ?? "",
  });
  if (!cuenta.success) {
    console.error(
      "✗ Datos inválidos: cédula de 7 a 9 dígitos, --nombres y --apellidos obligatorios, --email válido si va.",
    );
    process.exit(1);
  }
  try {
    const { passwordTemporal } = await crearCuentaCon(
      db,
      cuenta.data,
      Date.now(),
    );
    console.log(`✓ Profesor ${crear} creado.`);
    console.log(
      `  Contraseña temporal (se muestra solo ahora): ${passwordTemporal}`,
    );
  } catch (e) {
    if (e instanceof ErrorCuenta && e.codigo === "existe") {
      console.log(`• ${crear} ya tiene cuenta: no se tocó.`);
    } else {
      console.error("✗ No se pudo crear:", (e as Error).message);
      process.exit(1);
    }
  }
}

if (hacerAdmin) {
  const r = await hacerAdminCon(db, hacerAdmin, Date.now());
  if (!r.ok) {
    console.error(
      r.error === "no-existe"
        ? `✗ ${hacerAdmin} no tiene perfil: créalo antes con --crear-profesor.`
        : `✗ ${hacerAdmin} no es profesor: solo un profesor puede ser admin.`,
    );
    process.exit(1);
  }
  console.log(
    `✓ ${hacerAdmin} es admin. Sus sesiones se cerraron: que vuelva a entrar.`,
  );
}
process.exit(0);
