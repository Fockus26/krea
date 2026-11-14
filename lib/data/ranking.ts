// Recalcular el ranking de una sección dentro de una transacción (D175, D204, D327). Sin
// `server-only` para que las pruebas lo corran sobre PGlite.
//
// `leerSeccion` bloquea la fila `ranking/{seccion}` (`FOR UPDATE`) antes de leer: dos escrituras de
// la misma sección se ponen en fila y la segunda lee lo que dejó la primera, así ninguna se pierde
// (en Firestore lo hacía el reintento de la transacción). Quien llama aplica sus cambios a esos
// datos en memoria (la entrega evaluada, el ajuste nuevo) y escribe con `escribirRanking`.
import { eq, sql } from "drizzle-orm";
import {
  ajusteDeFila,
  type ConId,
  entregaDeFila,
  equipoDeFila,
  validas,
} from "@/lib/data/filas";
import { usuarioDeFila } from "@/lib/data/usuarios";
import { enSerie, type Tx } from "@/lib/db";
import { ajustes, entregas, equipos, ranking, usuarios } from "@/lib/db/schema";
import type {
  Ajuste,
  Entrega,
  Equipo,
  RankingSeccion,
  SeccionId,
  Usuario,
} from "@/lib/modelo";
import { calcularRanking } from "@/lib/ranking-datos";

export type DatosSeccion = {
  usuarios: Usuario[];
  equipos: Array<ConId<Equipo>>;
  entregas: Array<ConId<Entrega>>;
  ajustes: Array<ConId<Ajuste>>;
};

/** Toma el turno de la sección: hasta el commit, nadie más recalcula su ranking. */
export async function bloquearSeccion(
  tx: Tx,
  seccion: SeccionId,
): Promise<void> {
  await tx
    .insert(ranking)
    .values({ seccion, alumnos: {}, equipos: {}, actualizadoEn: 0 })
    .onConflictDoNothing();
  await tx.execute(
    sql`select 1 from ${ranking} where ${ranking.seccion} = ${seccion} for update`,
  );
}

/** Bloquea la sección y lee todo lo que entra en su ranking. */
export async function leerSeccion(
  tx: Tx,
  seccion: SeccionId,
): Promise<DatosSeccion> {
  await bloquearSeccion(tx, seccion);
  const [us, eqs, ents, ajs] = await enSerie([
    tx.select().from(usuarios).where(eq(usuarios.seccion, seccion)),
    tx.select().from(equipos).where(eq(equipos.seccion, seccion)),
    tx.select().from(entregas).where(eq(entregas.seccion, seccion)),
    tx.select().from(ajustes).where(eq(ajustes.seccion, seccion)),
  ]);
  return {
    usuarios: validas(us.map(usuarioDeFila)),
    equipos: validas(eqs.map(equipoDeFila)),
    entregas: validas(ents.map(entregaDeFila)),
    ajustes: validas(ajs.map(ajusteDeFila)),
  };
}

/** Reemplaza (o añade) la entrega `id` en los datos leídos. */
export function conEntrega(
  datos: DatosSeccion,
  entrega: ConId<Entrega>,
): DatosSeccion {
  const otras = datos.entregas.filter((e) => e.id !== entrega.id);
  return { ...datos, entregas: [...otras, entrega] };
}

/** Quita la entrega `id` de los datos leídos (al eliminarla, D413). */
export function sinEntrega(datos: DatosSeccion, id: string): DatosSeccion {
  return { ...datos, entregas: datos.entregas.filter((e) => e.id !== id) };
}

/** Añade un ajuste a los datos leídos. */
export function conAjuste(
  datos: DatosSeccion,
  ajuste: ConId<Ajuste>,
): DatosSeccion {
  return { ...datos, ajustes: [...datos.ajustes, ajuste] };
}

/** Escribe el ranking de la sección con `calcularRanking` sobre los datos ya cambiados. */
export async function escribirRanking(
  tx: Tx,
  seccion: SeccionId,
  datos: DatosSeccion,
  ahora: number,
): Promise<void> {
  const r = calcularRanking(seccion, datos, ahora);
  await tx
    .insert(ranking)
    .values({ seccion, ...r })
    .onConflictDoUpdate({ target: ranking.seccion, set: r });
}

/** Lee el ranking guardado de una sección; `null` si aún no hay. */
export async function leerRanking(
  db: Tx,
  seccion: SeccionId,
): Promise<RankingSeccion | null> {
  const [f] = await db
    .select()
    .from(ranking)
    .where(eq(ranking.seccion, seccion))
    .limit(1);
  if (!f || f.actualizadoEn === 0) return null;
  return {
    alumnos: f.alumnos,
    equipos: f.equipos,
    actualizadoEn: f.actualizadoEn,
  };
}
