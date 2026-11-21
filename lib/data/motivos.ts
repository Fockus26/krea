// Opciones fijas de Ajustes de puntos sobre Postgres (D375, D327). Sin `server-only` para que las
// pruebas lo corran sobre PGlite; la app lo usa desde lib/acciones/motivos.ts (después de
// `exigirSesion("profesor")`), lib/datos/motivos.ts y lib/data/ajustes.ts.
//
// `config/motivos` es la fila `config` con id `motivos` (ausente = `MOTIVOS_INICIALES`; la primera
// escritura la materializa). Cada operación corre en una transacción con la fila bloqueada: dos
// profes a la vez no se pisan (el segundo ve la lista del primero). Editar y borrar traen la
// versión que vio el diálogo (`actualizadoEn`, D509): si otro guardó después, `cambio`.
import { eq } from "drizzle-orm";
import type { Db, Tx } from "@/lib/db";
import { config } from "@/lib/db/schema";
import { DOC_MOTIVOS, zCatalogoMotivos } from "@/lib/modelo";
import {
  aplicarOperacionMotivos,
  type CatalogoMotivos,
  MOTIVOS_INICIALES,
  type OperacionMotivos,
  type ResultadoMotivos,
  VERSION_MOTIVOS_INICIAL,
  versionMotivosNueva,
} from "@/lib/motivos";

export type MotivosConVersion = {
  motivos: CatalogoMotivos;
  /** `actualizadoEn` de la fila; `VERSION_MOTIVOS_INICIAL` si aún no existe. */
  version: number;
};

/** La lista y su versión (D509); `null` si la fila no valida (quien lee decide). */
export async function leerMotivosConVersion(
  db: Tx,
  bloqueo?: "update" | "share",
): Promise<MotivosConVersion | null> {
  const q = db.select().from(config).where(eq(config.id, DOC_MOTIVOS));
  const [f] = await (bloqueo ? q.for(bloqueo) : q);
  if (!f)
    return { motivos: MOTIVOS_INICIALES, version: VERSION_MOTIVOS_INICIAL };
  const r = zCatalogoMotivos.safeParse(f.datos);
  return r.success
    ? { motivos: r.data.motivos, version: r.data.actualizadoEn }
    : null;
}

/**
 * Las opciones guardadas (o las iniciales); `null` si la fila no valida. `update` bloquea para
 * escribir; `share` deja leer a la vez pero espera a quien la esté cambiando (un ajuste nunca
 * usa una opción que se está borrando).
 */
export async function leerMotivos(
  db: Tx,
  bloqueo?: "update" | "share",
): Promise<CatalogoMotivos | null> {
  return (await leerMotivosConVersion(db, bloqueo))?.motivos ?? null;
}

/**
 * Aplica la operación a la lista guardada y devuelve la lista nueva con su versión. `version` = la
 * que vio quien edita (las Server Actions la exigen al editar y borrar; crear no: una opción nueva
 * no pisa nada y la etiqueta repetida se rechaza contra la lista de ahora).
 */
export async function operarMotivosEnTransaccion(
  db: Db,
  op: OperacionMotivos,
  ahora: number,
  version?: number,
): Promise<ResultadoMotivos> {
  return db.transaction(async (tx): Promise<ResultadoMotivos> => {
    // Materializa la fila para poder bloquearla, con la versión de «sin fila»: materializarla no
    // cuenta como un cambio de otro
    const inicial = await leerMotivos(tx);
    if (inicial)
      await tx
        .insert(config)
        .values({
          id: DOC_MOTIVOS,
          datos: { motivos: inicial, actualizadoEn: VERSION_MOTIVOS_INICIAL },
        })
        .onConflictDoNothing();
    const actual = await leerMotivosConVersion(tx, "update");
    if (!actual) {
      console.error(`[motivos] config/${DOC_MOTIVOS} no valida`);
      return { ok: false, error: "invalida" };
    }
    // Otro profe guardó desde que se abrió la lista: no se pisa; va la de ahora (D509)
    if (version !== undefined && version !== actual.version)
      return { ok: false, error: "cambio", ...actual };
    const r = aplicarOperacionMotivos(actual.motivos, op);
    if (!r.ok) return r;
    const nueva = versionMotivosNueva(actual.version, ahora);
    await tx
      .update(config)
      .set({ datos: { motivos: r.motivos, actualizadoEn: nueva } })
      .where(eq(config.id, DOC_MOTIVOS));
    return { ok: true, motivos: r.motivos, version: nueva };
  });
}
