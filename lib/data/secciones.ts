// Catálogo de años y secciones sobre Postgres (D317, D318, D327). Sin `server-only` para que las
// pruebas lo corran sobre PGlite; la app lo usa desde lib/acciones/secciones.ts (después de
// `exigirAdmin()`) y lib/datos/secciones.ts.
//
// `config/secciones` es la fila `config` con id `secciones` (ausente = `CATALOGO_INICIAL`; la
// primera escritura la materializa). Renombrar o eliminar exige que los códigos que se van estén
// vacíos: se comprueba dentro de la transacción, con la fila bloqueada. Al irse, su ranking se borra.
import { arrayOverlaps, eq, inArray } from "drizzle-orm";
import type { Db, Tx } from "@/lib/db";
import { ajustes, config, entregas, equipos, ranking, tareas, usuarios } from "@/lib/db/schema";
import { DOC_SECCIONES } from "@/lib/modelo";
import {
  anioDoc,
  aplicarOperacion,
  type CatalogoSecciones,
  catalogoDeDocumento,
  codigosQueSeVan,
  type OperacionSecciones,
  type ResultadoSecciones,
} from "@/lib/secciones";

/** El catálogo guardado (o el inicial); `null` si la fila no valida. */
export async function leerCatalogo(
  db: Tx,
  bloquear = false,
): Promise<CatalogoSecciones | null> {
  const q = db.select().from(config).where(eq(config.id, DOC_SECCIONES));
  const [f] = await (bloquear ? q.for("update") : q);
  return catalogoDeDocumento(f !== undefined, f?.datos);
}

/** ¿Hay algo guardado con alguno de estos códigos? */
async function hayDatos(tx: Tx, codigos: readonly string[]): Promise<boolean> {
  const lista = [...codigos];
  const consultas = await Promise.all([
    tx.select({ x: usuarios.cedula }).from(usuarios).where(inArray(usuarios.seccion, lista)).limit(1),
    tx.select({ x: equipos.id }).from(equipos).where(inArray(equipos.seccion, lista)).limit(1),
    tx.select({ x: tareas.id }).from(tareas).where(arrayOverlaps(tareas.secciones, lista)).limit(1),
    tx.select({ x: entregas.id }).from(entregas).where(inArray(entregas.seccion, lista)).limit(1),
    tx.select({ x: ajustes.id }).from(ajustes).where(inArray(ajustes.seccion, lista)).limit(1),
  ]);
  return consultas.some((r) => r.length > 0);
}

/**
 * Aplica la operación al catálogo guardado. Crear lo que ya existe responde el error («Ya existe
 * 5A») sin escribir; con datos, `con-datos` y nada cambia.
 */
export async function operarSeccionesEnTransaccion(
  db: Db,
  op: OperacionSecciones,
  ahora: number,
): Promise<ResultadoSecciones> {
  return db.transaction(async (tx): Promise<ResultadoSecciones> => {
    // Materializa la fila para poder bloquearla: dos admins a la vez no se pisan
    const inicial = await leerCatalogo(tx);
    if (inicial)
      await tx
        .insert(config)
        .values({ id: DOC_SECCIONES, datos: { anios: anioDoc(inicial), actualizadoEn: ahora } })
        .onConflictDoNothing();
    const actual = await leerCatalogo(tx, true);
    if (!actual) {
      console.error(`[secciones] config/${DOC_SECCIONES} no valida`);
      return { ok: false, error: "invalida" };
    }
    const r = aplicarOperacion(actual, op);
    if (!r.ok) return r;
    const seVan = codigosQueSeVan(actual, op);
    if (seVan.length > 0 && (await hayDatos(tx, seVan)))
      return { ok: false, error: "con-datos" };
    await tx
      .update(config)
      .set({ datos: { anios: anioDoc(r.catalogo), actualizadoEn: ahora } })
      .where(eq(config.id, DOC_SECCIONES));
    if (seVan.length > 0)
      await tx.delete(ranking).where(inArray(ranking.seccion, [...seVan]));
    return { ok: true };
  });
}
