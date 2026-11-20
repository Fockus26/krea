// La cola de Evaluar sobre Postgres (D439, D441): las evaluadas, la huella de la cola para el
// sondeo y el estado de una entrega. Sin `server-only` para que las pruebas lo corran sobre PGlite;
// la app lo usa desde `lib/datos/profesor.ts` y `/api/evaluar/version`, después de comprobar que
// quien pregunta es profesor.
import { eq, ne, sql } from "drizzle-orm";
import { entregaDeFila, validas } from "@/lib/data/filas";
import type { Db } from "@/lib/db";
import { entregas } from "@/lib/db/schema";
import { colaEvaluadas } from "@/lib/evaluar-datos";
import { huellaCola, type ResumenCola } from "@/lib/evaluar-vivo";
import type { Entrega } from "@/lib/modelo";

type ConId<T> = { id: string } & T;

const numero = (v: unknown): number | null =>
  v === null || v === undefined ? null : Number(v);

/** Las evaluadas, la evaluada más recientemente primero (D439). */
export async function leerEvaluadas(db: Db): Promise<Array<ConId<Entrega>>> {
  const filas = await db
    .select()
    .from(entregas)
    .where(eq(entregas.estado, "evaluada"));
  return colaEvaluadas(validas(filas.map(entregaDeFila)));
}

/** Una sola consulta de agregados: el sondeo cada 5 s casi no pesa (D441). */
export async function leerResumenCola(db: Db): Promise<ResumenCola> {
  const [f] = await db
    .select({
      total: sql<number>`count(*)::int`,
      porEvaluar: sql<number>`(count(*) filter (where ${entregas.estado} = 'entregada'))::int`,
      maxEnviada: sql<string | null>`max(${entregas.enviadaEn})`,
      maxEvaluada: sql<
        string | null
      >`max((${entregas.evaluacion}->>'evaluadaEn')::bigint)`,
    })
    .from(entregas)
    .where(ne(entregas.estado, "borrador"));
  return {
    total: Number(f?.total ?? 0),
    porEvaluar: Number(f?.porEvaluar ?? 0),
    maxEnviada: numero(f?.maxEnviada),
    maxEvaluada: numero(f?.maxEvaluada),
  };
}

export async function leerVersionCola(
  db: Db,
): Promise<{ version: string; porEvaluar: number }> {
  const r = await leerResumenCola(db);
  return { version: huellaCola(r), porEvaluar: r.porEvaluar };
}

/** Estado, `evaluadaEn` y autor (cédula) de la evaluación de una entrega; `null` si no existe. */
export async function leerEstadoEntrega(
  db: Db,
  id: string,
): Promise<{
  estado: "borrador" | "entregada" | "evaluada";
  evaluadaEn: number | null;
  evaluadaPor: string | null;
} | null> {
  const [f] = await db
    .select({ estado: entregas.estado, evaluacion: entregas.evaluacion })
    .from(entregas)
    .where(eq(entregas.id, id));
  if (!f) return null;
  return {
    estado: f.estado,
    evaluadaEn: numero(f.evaluacion?.evaluadaEn),
    evaluadaPor: f.evaluacion?.evaluadaPor ?? null,
  };
}
