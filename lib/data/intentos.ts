// Límite de intentos de login por cuenta (D327): solo cuentan las contraseñas equivocadas. El
// límite de Better Auth es por IP y suma también los ingresos buenos; en el liceo un salón entero
// sale por la misma IP, así que ese queda holgado (lib/better-auth.ts) y el freno real es este.
// Usa la tabla `rate_limit` de Better Auth con su propia clave (`fallos|<email>`).
import { eq, sql } from "drizzle-orm";
import type { Db } from "@/lib/db";
import { rateLimit } from "@/lib/db/schema";

/** Contraseñas equivocadas seguidas antes de bloquear la cuenta. */
export const MAX_FALLOS = 5;
/** Bloqueo desde el último fallo: «Espera 5 minutos» (lib/auth.ts). */
export const VENTANA_FALLOS_MS = 5 * 60 * 1000;

const clave = (email: string) => `fallos|${email.trim().toLowerCase()}`;

/** ¿La cuenta está bloqueada por fallos recientes? */
export async function cuentaBloqueada(
  db: Db,
  email: string,
  ahora: number,
): Promise<boolean> {
  const [fila] = await db
    .select()
    .from(rateLimit)
    .where(eq(rateLimit.key, clave(email)))
    .limit(1);
  return (
    !!fila &&
    fila.count >= MAX_FALLOS &&
    ahora - fila.lastRequest < VENTANA_FALLOS_MS
  );
}

/** Suma un fallo; si el anterior es más viejo que la ventana, vuelve a empezar en 1. */
export async function registrarFallo(
  db: Db,
  email: string,
  ahora: number,
): Promise<void> {
  const desde = ahora - VENTANA_FALLOS_MS;
  await db
    .insert(rateLimit)
    .values({
      id: crypto.randomUUID(),
      key: clave(email),
      count: 1,
      lastRequest: ahora,
    })
    .onConflictDoUpdate({
      target: rateLimit.key,
      set: {
        count: sql`case when ${rateLimit.lastRequest} < ${desde} then 1 else ${rateLimit.count} + 1 end`,
        lastRequest: ahora,
      },
    });
}

/** Un ingreso bueno borra la cuenta de fallos. */
export async function limpiarFallos(db: Db, email: string): Promise<void> {
  await db.delete(rateLimit).where(eq(rateLimit.key, clave(email)));
}
