/**
 * Profesores desde la terminal (D235): crear una cuenta de profesor y marcar al admin (D231).
 * Usa el Admin SDK con las credenciales del entorno (`.env.local` / `.env`, como la app): OJO,
 * sin emuladores eso es la base REAL. Idempotente: repetirlo no duplica ni pisa nada.
 *
 *   bun scripts/admin-profesor.ts --crear-profesor <cédula> --nombres "…" --apellidos "…" [--email …]
 *       Crea la cuenta con una contraseña temporal y la imprime UNA vez (no se guarda en ningún
 *       lado): dásela a la persona; al entrar, la app le pide crear la suya. Si la cédula ya
 *       tiene cuenta, lo dice y no toca nada.
 *
 *   bun scripts/admin-profesor.ts --hacer-admin <cédula>
 *       Marca a ese profesor como admin (perfil + claims) y cierra sus sesiones: la próxima vez
 *       que entre ve «Profesores».
 *
 * Se pueden combinar: `--crear-profesor 30262232 --nombres … --apellidos … --hacer-admin 30262232`.
 */
import { ErrorCuenta, zEntradaCuenta } from "@/lib/cuentas-datos";
import { firebaseAdmin } from "@/lib/firebase/admin-base";
import { crearCuentaCon, hacerAdminCon } from "@/lib/firebase/cuentas";

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

const admin = firebaseAdmin();
if (!admin) {
  console.error(
    "✗ Sin credenciales del Admin SDK en el entorno (o emulador sin proyecto demo-*).",
  );
  process.exit(1);
}
const destino = process.env.FIRESTORE_EMULATOR_HOST
  ? `emuladores (${process.env.GCLOUD_PROJECT ?? "demo-krea"})`
  : `proyecto ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`;
console.log(`→ ${destino}`);

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
      admin.auth,
      admin.db,
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
      console.error("✗ No se pudo crear:", (e as { code?: string }).code ?? e);
      process.exit(1);
    }
  }
}

if (hacerAdmin) {
  const r = await hacerAdminCon(admin.auth, admin.db, hacerAdmin, Date.now());
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
