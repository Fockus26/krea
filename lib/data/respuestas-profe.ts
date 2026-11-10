// El profe edita las respuestas de texto de una entrega (permiso temporal, `lib/respuestas-profe`).
// Sin `server-only` para las pruebas sobre PGlite; la app lo usa solo desde
// lib/acciones/respuestas-profe.ts, después de `exigirSesion("profesor")`. Las respuestas no dan
// puntos: no toca la evaluación ni el ranking.
import { eq } from "drizzle-orm";
import { entregaDeFila, tareaDeFila } from "@/lib/data/filas";
import type { Db } from "@/lib/db";
import { entregas, tareas } from "@/lib/db/schema";
import { zEntrega } from "@/lib/modelo";
import {
  type EditarRespuestas,
  type ResultadoRespuestas,
  respuestasEditadas,
} from "@/lib/respuestas-profe";

export async function editarRespuestasEnTransaccion(
  db: Db,
  envio: EditarRespuestas,
): Promise<ResultadoRespuestas> {
  return db.transaction(async (tx): Promise<ResultadoRespuestas> => {
    const [f] = await tx
      .select()
      .from(entregas)
      .where(eq(entregas.id, envio.entregaId))
      .for("update");
    if (!f) return { ok: false, error: "no-existe" };
    // Una fila que no valida no se pisa
    const e = entregaDeFila(f);
    if (!e) return { ok: false, error: "invalida" };
    if (e.estado === "borrador") return { ok: false, error: "no-entregada" };
    const [ft] = await tx.select().from(tareas).where(eq(tareas.id, e.tareaId));
    const t = ft ? tareaDeFila(ft) : null;
    if (!t) return { ok: false, error: "no-existe" };
    const deTexto = new Set(
      t.preguntas.filter((p) => p.formato === "texto").map((p) => p.id),
    );
    const respuestas = respuestasEditadas(
      e.respuestas,
      deTexto,
      envio.respuestas,
    );
    if (!respuestas) return { ok: false, error: "invalida" };
    const { id: _, ...entrega } = e;
    const ok = zEntrega.safeParse({ ...entrega, respuestas });
    if (!ok.success) return { ok: false, error: "invalida" };
    await tx
      .update(entregas)
      .set({ respuestas })
      .where(eq(entregas.id, envio.entregaId));
    return { ok: true };
  });
}
