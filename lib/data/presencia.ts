// Presencia en «Editar alumno» sobre Postgres (W14, D275, D327). El navegador del profe ya no
// escribe en la base: llama a /api/presencia con su sesión, y la hora la pone el servidor.
// La presencia en «Evaluar» usa la misma tabla con la clave `entrega:<id>` (D408).
import { and, eq, gt, notLike } from "drizzle-orm";
import type { Tx } from "@/lib/db";
import { presencia } from "@/lib/db/schema";
import {
  claveEntrega,
  type EntradaPresencia,
  VIGENCIA_MS,
} from "@/lib/presencia";

const entradaDe = (f: typeof presencia.$inferSelect): EntradaPresencia => ({
  profeId: f.profeId,
  nombre: f.nombre,
  desde: f.desde,
  latido: f.latido,
});

/**
 * Las entradas vigentes de todos los alumnos (la lista de Alumnos las agrupa por alumno). Sin las
 * de entregas: esas solo las lee Evaluar.
 */
export async function leerPresencia(
  db: Tx,
  ahora: number,
): Promise<Array<{ alumnoId: string; entrada: EntradaPresencia }>> {
  const filas = await db
    .select()
    .from(presencia)
    .where(
      and(
        gt(presencia.latido, ahora - VIGENCIA_MS),
        notLike(presencia.alumnoId, `${claveEntrega("")}%`),
      ),
    );
  return filas.map((f) => ({ alumnoId: f.alumnoId, entrada: entradaDe(f) }));
}

/** Las entradas vigentes de UNA entrega (los profes que la tienen abierta en Evaluar). */
export async function leerPresenciaEntrega(
  db: Tx,
  entregaId: string,
  ahora: number,
): Promise<EntradaPresencia[]> {
  const filas = await db
    .select()
    .from(presencia)
    .where(
      and(
        eq(presencia.alumnoId, claveEntrega(entregaId)),
        gt(presencia.latido, ahora - VIGENCIA_MS),
      ),
    );
  return filas.map(entradaDe);
}

/** Crea la entrada propia o renueva su latido (`desde` se conserva). */
export async function marcarPresencia(
  db: Tx,
  alumnoId: string,
  profeId: string,
  nombre: string,
  ahora: number,
): Promise<void> {
  await db
    .insert(presencia)
    .values({ alumnoId, profeId, nombre, desde: ahora, latido: ahora })
    .onConflictDoUpdate({
      target: [presencia.alumnoId, presencia.profeId],
      set: { latido: ahora, nombre },
    });
}

export async function quitarPresencia(
  db: Tx,
  alumnoId: string,
  profeId: string,
): Promise<void> {
  await db
    .delete(presencia)
    .where(
      and(eq(presencia.alumnoId, alumnoId), eq(presencia.profeId, profeId)),
    );
}

/** Al eliminar un alumno (D268): fuera sus entradas. Devuelve cuántas había. */
export async function borrarPresenciaAlumno(
  db: Tx,
  cedula: string,
): Promise<number> {
  const r = await db
    .delete(presencia)
    .where(eq(presencia.alumnoId, cedula))
    .returning({ p: presencia.profeId });
  return r.length;
}
