// % orientativo de IA sobre Postgres (D425–D429). Sin `server-only` para que las pruebas la corran
// sobre PGlite; la app la usa solo desde lib/acciones/analisis-ia.ts y lib/datos/analisis-ia.ts,
// después de `exigirSesion("profesor")` (el `autorId` sale de la sesión).
import { and, eq, inArray } from "drizzle-orm";
import { entregaDeFila } from "@/lib/data/filas";
import type { Tx } from "@/lib/db";
import { analisisIa, entregas } from "@/lib/db/schema";
import type { AnalisisGuardado } from "@/lib/ia-texto";

export type FilaAnalisis = {
  entregaId: string;
  preguntaId: string;
  porcentaje: number;
  huella: string;
  modelo: string;
  autorId: string;
  analizadoEn: number;
};

/**
 * El texto de una respuesta, leído en el servidor (la acción nunca lo acepta del cliente).
 * `no-existe`: no hay entrega (o es un borrador, que aún no es una entrega, D196) o no tiene esa
 * pregunta; `no-texto`: la respuesta es de imagen.
 */
export async function textoDeRespuesta(
  db: Tx,
  entregaId: string,
  preguntaId: string,
): Promise<
  { ok: true; texto: string } | { ok: false; error: "no-existe" | "no-texto" }
> {
  const [f] = await db
    .select()
    .from(entregas)
    .where(eq(entregas.id, entregaId));
  const e = f ? entregaDeFila(f) : null;
  if (!e || e.estado === "borrador") return { ok: false, error: "no-existe" };
  const r = e.respuestas[preguntaId];
  if (!r) return { ok: false, error: "no-existe" };
  if (!("texto" in r)) return { ok: false, error: "no-texto" };
  return { ok: true, texto: r.texto };
}

/** Un análisis por respuesta: el nuevo reemplaza al anterior. */
export async function guardarAnalisis(db: Tx, a: FilaAnalisis): Promise<void> {
  await db
    .insert(analisisIa)
    .values(a)
    .onConflictDoUpdate({
      target: [analisisIa.entregaId, analisisIa.preguntaId],
      set: {
        porcentaje: a.porcentaje,
        huella: a.huella,
        modelo: a.modelo,
        autorId: a.autorId,
        analizadoEn: a.analizadoEn,
      },
    });
}

/**
 * Al eliminar entregas (una, o las de una tarea): sus análisis se van con ellas (D531), en la
 * misma transacción. Sin claves foráneas: quien borra la entrega llama aquí.
 */
export async function borrarAnalisisDe(
  tx: Tx,
  entregaIds: readonly string[],
): Promise<void> {
  if (entregaIds.length === 0) return;
  await tx
    .delete(analisisIa)
    .where(inArray(analisisIa.entregaId, [...entregaIds]));
}

/**
 * Los análisis de una entrega por pregunta. Una fila con un porcentaje fuera de 0–100 no se
 * muestra. Eliminar la entrega los borra (D531); las filas de antes de eso quedan huérfanas y
 * nadie las pide.
 */
export async function leerAnalisis(
  db: Tx,
  entregaId: string,
): Promise<Map<string, AnalisisGuardado>> {
  const filas = await db
    .select()
    .from(analisisIa)
    .where(eq(analisisIa.entregaId, entregaId));
  const m = new Map<string, AnalisisGuardado>();
  for (const f of filas) {
    if (
      !Number.isInteger(f.porcentaje) ||
      f.porcentaje < 0 ||
      f.porcentaje > 100
    )
      continue;
    m.set(f.preguntaId, {
      porcentaje: f.porcentaje,
      huella: f.huella,
      analizadoEn: f.analizadoEn,
    });
  }
  return m;
}

/** El análisis de una respuesta con todas sus columnas (o `null`). */
export async function leerAnalisisDe(
  db: Tx,
  entregaId: string,
  preguntaId: string,
): Promise<FilaAnalisis | null> {
  const [f] = await db
    .select()
    .from(analisisIa)
    .where(
      and(
        eq(analisisIa.entregaId, entregaId),
        eq(analisisIa.preguntaId, preguntaId),
      ),
    );
  return f ?? null;
}
