// Sesión desde la cookie de Better Auth (D327). Sin `server-only`: lo usa el proxy. Las páginas y
// Server Actions usan el DAL (`lib/dal.ts`). La sesión se comprueba en la base en cada llamada:
// una sesión revocada (cerrar sesión, contraseña nueva, cuenta borrada) deja de valer al instante.
import { eq } from "drizzle-orm";
import { type AuthKrea, authKrea } from "@/lib/better-auth";
import { baseDeDatos, type Tx } from "@/lib/db";
import { usuarios } from "@/lib/db/schema";
import { type Sesion, sesionDeClaims } from "@/lib/sesion";

/** Perfil → sesión (lo que antes eran las custom claims, D174). */
export async function sesionDeUid(
  uid: string,
  db: Tx | null = baseDeDatos(),
): Promise<Sesion | null> {
  if (!db) return null;
  const [u] = await db
    .select({
      rol: usuarios.rol,
      seccion: usuarios.seccion,
      equipoId: usuarios.equipoId,
      admin: usuarios.admin,
      debeCambiarPassword: usuarios.debeCambiarPassword,
    })
    .from(usuarios)
    .where(eq(usuarios.cedula, uid))
    .limit(1);
  return u ? sesionDeClaims(uid, u) : null;
}

/** Cabeceras del request → sesión, o `null` sin cookie válida, sin perfil o sin base configurada. */
export async function sesionDeHeaders(
  h: Headers,
  deps: { auth: AuthKrea | null; db: Tx | null } = {
    auth: authKrea(),
    db: baseDeDatos(),
  },
): Promise<Sesion | null> {
  const { auth, db } = deps;
  if (!auth) return null;
  try {
    const s = await auth.api.getSession({ headers: h });
    return s ? await sesionDeUid(s.user.id, db) : null;
  } catch (e) {
    console.error("[sesion]", (e as Error).message);
    return null;
  }
}
