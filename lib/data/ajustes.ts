// Ajustes de puntos sobre Postgres (fase 07 W7, D207, D327). Sin `server-only` para que las
// pruebas los corran sobre PGlite; la app los usa solo desde lib/acciones/ajustes.ts, después de
// `exigirSesion("profesor")`.
//
// Un ajuste mueve puntos del ranking, nunca la nota (D007): se escribe el ajuste y el ranking de su
// sección en la MISMA transacción (D175); ninguna entrega se toca.
import { eq } from "drizzle-orm";
import {
  type AplicarAjuste,
  armarAjuste,
  armarAnulacion,
  esAnulacion,
  idAnulacion,
  type ResultadoAjuste,
} from "@/lib/ajustes-datos";
import type { Db } from "@/lib/db";
import { ajustes, equipos } from "@/lib/db/schema";
import { ajusteDeFila, equipoDeFila, filaDeAjuste } from "@/lib/data/filas";
import {
  conAjuste,
  escribirRanking,
  leerSeccion,
} from "@/lib/data/ranking";
import { leerUsuario } from "@/lib/data/usuarios";
import type { SeccionId } from "@/lib/modelo";

/** Id nuevo para un documento sin id propio (lo que era `collection().doc()`). */
export const idNuevo = () => crypto.randomUUID().replaceAll("-", "").slice(0, 20);

/**
 * Aplica un ajuste a un alumno o a un equipo y recalcula el ranking de su sección. Con
 * `secciones` (las del catálogo), un destino cuya sección no está en la lista da `seccion` sin
 * escribir nada (D323).
 */
export async function aplicarAjusteEnTransaccion(
  db: Db,
  autorId: string,
  entrada: AplicarAjuste,
  ahora: number,
  secciones?: readonly SeccionId[],
): Promise<ResultadoAjuste> {
  const id = idNuevo();
  return db.transaction(async (tx): Promise<ResultadoAjuste> => {
    let seccion: SeccionId;
    if (entrada.destino === "alumno") {
      const u = await leerUsuario(tx, entrada.destinoId);
      if (!u) return { ok: false, error: "no-existe" };
      if (u.rol !== "estudiante" || u.seccion === null)
        return { ok: false, error: "invalida" };
      seccion = u.seccion;
    } else {
      const [f] = await tx
        .select()
        .from(equipos)
        .where(eq(equipos.id, entrada.destinoId));
      if (!f) return { ok: false, error: "no-existe" };
      const e = equipoDeFila(f);
      if (!e) return { ok: false, error: "invalida" };
      seccion = e.seccion;
    }
    if (secciones && !secciones.includes(seccion))
      return { ok: false, error: "seccion" };
    const datos = await leerSeccion(tx, seccion);
    const r = armarAjuste({ entrada, seccion, autorId, ahora });
    if (!r.ok) return r;
    await tx.insert(ajustes).values(filaDeAjuste(id, r.ajuste));
    await escribirRanking(
      tx,
      seccion,
      conAjuste(datos, { id, ...r.ajuste }),
      ahora,
    );
    return { ok: true, id };
  });
}

/**
 * Anula un ajuste con su inverso «Anulación» (D121; no se borra) y recalcula el ranking. La
 * anulación tiene id fijo (`idAnulacion`): si ya existe, el ajuste ya estaba anulado.
 */
export async function anularAjusteEnTransaccion(
  db: Db,
  autorId: string,
  ajusteId: string,
  ahora: number,
): Promise<ResultadoAjuste> {
  const inversaId = idAnulacion(ajusteId);
  return db.transaction(async (tx): Promise<ResultadoAjuste> => {
    const [f] = await tx.select().from(ajustes).where(eq(ajustes.id, ajusteId));
    if (!f) return { ok: false, error: "no-existe" };
    const a = ajusteDeFila(f);
    if (!a) return { ok: false, error: "invalida" };
    if (esAnulacion(a)) return { ok: false, error: "invalida" };
    // Bloquea la sección antes de mirar si ya hay anulación: dos «Anular» a la vez no pasan los dos
    const datos = await leerSeccion(tx, a.seccion);
    if (datos.ajustes.some((x) => x.id === inversaId || x.anulaA === ajusteId))
      return { ok: false, error: "anulado" };
    const { id: _, ...original } = a;
    const r = armarAnulacion({ original: { id: ajusteId, ...original }, autorId, ahora });
    if (!r.ok) return r;
    await tx.insert(ajustes).values(filaDeAjuste(inversaId, r.ajuste));
    await escribirRanking(
      tx,
      a.seccion,
      conAjuste(datos, { id: inversaId, ...r.ajuste }),
      ahora,
    );
    return { ok: true, id: inversaId };
  });
}
