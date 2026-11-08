// Presencia en «Editar alumno» sobre Postgres (W14, D275, D327). El navegador del profe ya no
// escribe en la base: llama a /api/presencia con su sesión, y la hora la pone el servidor.
import { and, eq, gt } from "drizzle-orm";
import type { Tx } from "@/lib/db";
import { presencia } from "@/lib/db/schema";
import { type EntradaPresencia, VIGENCIA_MS } from "@/lib/presencia";

/** Las entradas vigentes de todos los alumnos (la lista de Alumnos las agrupa por alumno). */
export async function leerPresencia(
  db: Tx,
  ahora: number,
): Promise<Array<{ alumnoId: string; entrada: EntradaPresencia }>> {
  const filas = await db
    .select()
    .from(presencia)
    .where(gt(presencia.latido, ahora - VIGENCIA_MS));
  return filas.map((f) => ({
    alumnoId: f.alumnoId,
    entrada: {
      profeId: f.profeId,
      nombre: f.nombre,
      desde: f.desde,
      latido: f.latido,
    },
  }));
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
