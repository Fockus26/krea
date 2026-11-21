// Límite de intentos de login por cuenta (D327): solo cuentan las contraseñas equivocadas. El
// límite de Better Auth es por IP y suma también los ingresos buenos; en el liceo un salón entero
// sale por la misma IP, así que ese queda holgado (lib/better-auth.ts) y el freno real es este.
// Usa la tabla `rate_limit` de Better Auth con su propia clave (`fallos|<email>`).
// El intento se reserva ANTES de evaluar la contraseña, en una sola sentencia (D492): una ráfaga
// en paralelo no puede pasar todas el chequeo antes de que se cuente el primer fallo.
import { eq, sql } from "drizzle-orm";
import type { Db } from "@/lib/db";
import { rateLimit } from "@/lib/db/schema";

/** Contraseñas equivocadas seguidas antes de bloquear la cuenta. */
export const MAX_FALLOS = 5;
/** Bloqueo desde el último fallo: «Espera 5 minutos» (lib/auth.ts). */
export const VENTANA_FALLOS_MS = 5 * 60 * 1000;

const clave = (email: string) => `fallos|${email.trim().toLowerCase()}`;

/**
 * Aparta un intento para la cuenta: `true` si quedaba alguno (se puede evaluar la contraseña),
 * `false` si la cuenta está bloqueada. Si el último fallo es más viejo que la ventana, vuelve a
 * empezar en 1. Bloqueada, la fila se queda en `MAX_FALLOS + 1` y no mueve `lastRequest`: insistir
 * no alarga los 5 minutos.
 */
export async function reservarIntento(
  db: Db,
  email: string,
  ahora: number,
): Promise<boolean> {
  const vencida = sql`${rateLimit.lastRequest} <= ${ahora - VENTANA_FALLOS_MS}`;
  const [fila] = await db
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
        count: sql`case when ${vencida} then 1 else least(${rateLimit.count} + 1, ${MAX_FALLOS + 1}) end`,
        lastRequest: sql`case when ${vencida} or ${rateLimit.count} < ${MAX_FALLOS} then ${ahora} else ${rateLimit.lastRequest} end`,
      },
    })
    .returning({ count: rateLimit.count });
  return !!fila && fila.count <= MAX_FALLOS;
}

/** Devuelve un intento reservado que no terminó en contraseña equivocada (error, 400, 429 por IP). */
export async function devolverIntento(db: Db, email: string): Promise<void> {
  await db
    .update(rateLimit)
    .set({ count: sql`greatest(${rateLimit.count} - 1, 0)` })
    .where(eq(rateLimit.key, clave(email)));
}

/** Un ingreso bueno borra la cuenta de fallos. */
export async function limpiarFallos(db: Db, email: string): Promise<void> {
  await db.delete(rateLimit).where(eq(rateLimit.key, clave(email)));
}
