// Opciones fijas de Ajustes de puntos sobre Postgres (D375, D327). Sin `server-only` para que las
// pruebas lo corran sobre PGlite; la app lo usa desde lib/acciones/motivos.ts (después de
// `exigirSesion("profesor")`), lib/datos/motivos.ts y lib/data/ajustes.ts.
//
// `config/motivos` es la fila `config` con id `motivos` (ausente = `MOTIVOS_INICIALES`; la primera
// escritura la materializa). Cada operación corre en una transacción con la fila bloqueada: dos
// profes a la vez no se pisan (el segundo ve la lista del primero).
import { eq } from "drizzle-orm";
import type { Db, Tx } from "@/lib/db";
import { config } from "@/lib/db/schema";
import { DOC_MOTIVOS } from "@/lib/modelo";
import {
  aplicarOperacionMotivos,
  type CatalogoMotivos,
  catalogoMotivosDeDocumento,
  type OperacionMotivos,
  type ResultadoMotivos,
} from "@/lib/motivos";

/**
 * Las opciones guardadas (o las iniciales); `null` si la fila no valida. `update` bloquea para
 * escribir; `share` deja leer a la vez pero espera a quien la esté cambiando (un ajuste nunca
 * usa una opción que se está borrando).
 */
export async function leerMotivos(
  db: Tx,
  bloqueo?: "update" | "share",
): Promise<CatalogoMotivos | null> {
  const q = db.select().from(config).where(eq(config.id, DOC_MOTIVOS));
  const [f] = await (bloqueo ? q.for(bloqueo) : q);
  return catalogoMotivosDeDocumento(f !== undefined, f?.datos);
}

/** Aplica la operación a la lista guardada y devuelve la lista nueva. */
export async function operarMotivosEnTransaccion(
  db: Db,
  op: OperacionMotivos,
  ahora: number,
): Promise<ResultadoMotivos> {
  return db.transaction(async (tx): Promise<ResultadoMotivos> => {
    // Materializa la fila para poder bloquearla
    const inicial = await leerMotivos(tx);
    if (inicial)
      await tx
        .insert(config)
        .values({
          id: DOC_MOTIVOS,
          datos: { motivos: inicial, actualizadoEn: ahora },
        })
        .onConflictDoNothing();
    const actual = await leerMotivos(tx, "update");
    if (!actual) {
      console.error(`[motivos] config/${DOC_MOTIVOS} no valida`);
      return { ok: false, error: "invalida" };
    }
    const r = aplicarOperacionMotivos(actual, op);
    if (!r.ok) return r;
    await tx
      .update(config)
      .set({ datos: { motivos: r.motivos, actualizadoEn: ahora } })
      .where(eq(config.id, DOC_MOTIVOS));
    return r;
  });
}
