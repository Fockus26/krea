// Better Auth en el servidor (D327): reemplaza Firebase Auth. Sin `server-only` para que lo use el
// proxy. La cuenta es `user.id` = cédula y `user.email` = email interno (D008); el rol, la sección,
// el equipo y las marcas viven en `usuarios` (antes eran custom claims).
//
// No hay registro público: las cuentas las crea el profe (`lib/data/cuentas.ts`). Las contraseñas
// importadas de Firebase llegan como `firebase$<hash>$<salt>` y se comprueban con su scrypt
// modificado; al cambiarla, la persona pasa al formato de Better Auth.
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { nextCookies } from "better-auth/next-js";
import { FirebaseScrypt } from "firebase-scrypt";
import { baseDeDatos } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { SESION_MS } from "@/lib/sesion";

/** Prefijo de los hashes importados de Firebase Auth. */
export const PREFIJO_HASH_FIREBASE = "firebase$";

let scrypt: FirebaseScrypt | null | undefined;

/** Parámetros de hash del proyecto Firebase (consola › Authentication › Password hash parameters). */
function scryptFirebase(): FirebaseScrypt | null {
  if (scrypt !== undefined) return scrypt;
  const e = process.env;
  scrypt =
    e.FIREBASE_HASH_SIGNER_KEY && e.FIREBASE_HASH_SALT_SEPARATOR
      ? new FirebaseScrypt({
          signerKey: e.FIREBASE_HASH_SIGNER_KEY,
          saltSeparator: e.FIREBASE_HASH_SALT_SEPARATOR,
          rounds: Number(e.FIREBASE_HASH_ROUNDS ?? 8),
          memCost: Number(e.FIREBASE_HASH_MEM_COST ?? 14),
        })
      : null;
  return scrypt;
}

export async function verificarHash({
  hash,
  password,
}: {
  hash: string;
  password: string;
}): Promise<boolean> {
  if (!hash.startsWith(PREFIJO_HASH_FIREBASE))
    return verifyPassword({ hash, password });
  const [h, salt] = hash.slice(PREFIJO_HASH_FIREBASE.length).split("$");
  const fb = scryptFirebase();
  if (!fb || !h || !salt) return false;
  return fb.verify(password, salt, h).catch(() => false);
}

/**
 * Enlaces de recuperación generados en esta petición (cédula → token). Better Auth llama a
 * `sendResetPassword` y espera (no hay tareas en segundo plano configuradas): así
 * `tokenRecuperacion` recibe el token sin que Better Auth envíe nada; el correo lo manda la app
 * con su plantilla y al email real (D185–D187).
 */
const tokens = new Map<string, string>();

function crear() {
  const db = baseDeDatos();
  if (!db) return null;
  return betterAuth({
    database: drizzleAdapter(db, { provider: "pg", schema }),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 8,
      password: { hash: hashPassword, verify: verificarHash },
      resetPasswordTokenExpiresIn: 60 * 60,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, token }) => {
        tokens.set(user.id, token);
      },
    },
    session: {
      expiresIn: SESION_MS / 1000,
      updateAge: 24 * 60 * 60,
    },
    advanced: { cookiePrefix: "krea" },
    rateLimit: {
      enabled: true,
      storage: "database",
      modelName: "rateLimit",
      // «Demasiados intentos. Espera 5 minutos.» (lib/auth.ts)
      customRules: {
        "/sign-in/email": { window: 300, max: 10 },
        "/request-password-reset": { window: 300, max: 5 },
      },
    },
    plugins: [nextCookies()],
  });
}

export type AuthKrea = NonNullable<ReturnType<typeof crear>>;

let instancia: AuthKrea | null = null;

/** `null` sin base de datos configurada: nadie entra (D181, «proteger siempre»). */
export function authKrea(): AuthKrea | null {
  if (!instancia) instancia = crear();
  return instancia;
}

/** Genera el token de «Olvidé mi contraseña» para la cuenta del email interno; `null` si no existe. */
export async function tokenRecuperacion(
  cedula: string,
  emailInternoCuenta: string,
): Promise<string | null> {
  const auth = authKrea();
  if (!auth) return null;
  tokens.delete(cedula);
  await auth.api.requestPasswordReset({
    body: { email: emailInternoCuenta },
  });
  const t = tokens.get(cedula) ?? null;
  tokens.delete(cedula);
  return t;
}
