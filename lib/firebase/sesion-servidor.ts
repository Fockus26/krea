// Verificación de la cookie de sesión con el Admin SDK (D180). Sin `server-only`: lo usa el
// proxy. Las páginas y Server Actions usan el DAL (`lib/dal.ts`).
import { firebaseAdmin } from "@/lib/firebase/admin-base";
import { type Sesion, sesionDeClaims } from "@/lib/sesion";

/**
 * Cookie → sesión, o `null` si no hay, está vencida, fue revocada (con `revocadas`) o Firebase no
 * está configurado: sin Firebase nadie entra (D181, «proteger siempre»).
 */
export async function sesionDeCookie(
  valor: string | undefined,
  { revocadas }: { revocadas: boolean },
): Promise<Sesion | null> {
  if (!valor) return null;
  const admin = firebaseAdmin();
  if (!admin) return null;
  try {
    const t = await admin.auth.verifySessionCookie(valor, revocadas);
    return sesionDeClaims(t.uid, t);
  } catch {
    return null;
  }
}
