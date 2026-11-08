// Tareas del profe sobre Postgres (D199–D202, D327). Sin `server-only` para que las pruebas las
// corran sobre PGlite; la app las usa solo desde lib/acciones/tareas.ts, después de
// `exigirSesion("profesor")` (el autor sale de la sesión).
//
// Guardar, cerrar y decidir el premio no cambian puntos: solo una entrega evaluada aporta al
// ranking (D007) y un premio no da puntos. Eliminar sí (se van sus notas): recalcula en la
// misma transacción (D206, D242). Cada operación bloquea la fila de la tarea (`FOR UPDATE`).
import { eq, sql } from "drizzle-orm";
import type { Db, Tx } from "@/lib/db";
import { entregas, equipos, tareas, usuarios } from "@/lib/db/schema";
import { idNuevo } from "@/lib/data/ajustes";
import {
  entregaDeFila,
  equipoDeFila,
  filaDeTarea,
  tareaDeFila,
  validas,
} from "@/lib/data/filas";
import { leerOperacionEnTx, registrarOperacionEnTx } from "@/lib/data/operaciones";
import { escribirRanking, leerSeccion } from "@/lib/data/ranking";
import { usuarioDeFila } from "@/lib/data/usuarios";
import { type DecisionPremio, idDeDecision, type SeccionId } from "@/lib/modelo";
import {
  armarPremio,
  armarTarea,
  type CambioFoto,
  decisionEncaja,
  estadoPremioSeccion,
  type GuardarTarea,
  planEliminar,
  puedeCerrar,
  type ResultadoTarea,
} from "@/lib/tareas-profe-datos";

/** La tarea `id` con bloqueo; `undefined` si no existe, `null` si existe pero no valida. */
async function tareaParaActualizar(tx: Tx, id: string) {
  const [f] = await tx.select().from(tareas).where(eq(tareas.id, id)).for("update");
  if (!f) return undefined;
  return tareaDeFila(f);
}

/**
 * Guarda, publica o edita una tarea en UNA transacción: lee la tarea y si ya tiene entregas
 * (congela su estructura, D200) y escribe lo que arma `armarTarea`.
 */
export async function guardarTareaEnTransaccion(
  db: Db,
  autorId: string,
  envio: GuardarTarea,
  hoy: string,
  ahora: number,
): Promise<ResultadoTarea & { fotoSuelta?: string }> {
  return db.transaction(
    async (tx): Promise<ResultadoTarea & { fotoSuelta?: string }> => {
      const t = envio.id ? await tareaParaActualizar(tx, envio.id) : undefined;
      // Reintento de un guardado que ya entró (D293): el mismo id, sin crear otra tarea
      const op = await leerOperacionEnTx(tx, envio.opId, autorId, "tarea");
      if (op?.previa.tipo === "repetida" && op.previa.id)
        return { ok: true, id: op.previa.id };
      if (op && op.previa.tipo !== "nueva")
        return { ok: false, error: "invalida" };
      const id = envio.id ?? idNuevo();
      let previa = null;
      let conEntregas = false;
      if (envio.id) {
        if (t === undefined) return { ok: false, error: "no-existe" };
        // Una fila que no valida no se pisa
        if (t === null) return { ok: false, error: "invalida" };
        const { id: _, ...doc } = t;
        previa = doc;
        const [una] = await tx
          .select({ id: entregas.id })
          .from(entregas)
          .where(eq(entregas.tareaId, envio.id))
          .limit(1);
        conEntregas = una !== undefined;
      }
      const r = armarTarea({
        entrada: envio.tarea,
        accion: envio.accion,
        previa,
        conEntregas,
        autorId,
        hoy,
        ahora,
      });
      if (!r.ok) return r;
      const fila = filaDeTarea(id, r.tarea);
      await tx
        .insert(tareas)
        .values(fila)
        .onConflictDoUpdate({ target: tareas.id, set: fila });
      await registrarOperacionEnTx(tx, op, autorId, "tarea", id, ahora);
      // Se quitó el premio: su foto ya no la usa nadie (se borra tras el commit, D265)
      return r.fotoSuelta
        ? { ok: true, id, fotoSuelta: r.fotoSuelta }
        : { ok: true, id };
    },
  );
}

/**
 * Elimina una tarea con todas sus entregas (y con ellas sus notas) en UNA transacción, y
 * recalcula el ranking de cada sección que tenía entregas sin ellas (D206, D242). Los ajustes
 * no se tocan (D007): solo desaparecen las notas. Devuelve las claves de B2 de las imágenes para
 * borrarlas después del commit (D229).
 */
export async function eliminarTareaEnTransaccion(
  db: Db,
  id: string,
  ahora: number,
): Promise<{ resultado: ResultadoTarea; imagenes: string[] }> {
  return db.transaction(async (tx) => {
    const t = await tareaParaActualizar(tx, id);
    if (t === undefined) {
      return {
        resultado: { ok: false, error: "no-existe" } as ResultadoTarea,
        imagenes: [],
      };
    }
    const ents = await tx.select().from(entregas).where(eq(entregas.tareaId, id));
    // Las que no validan también se borran; para el plan solo cuentan las válidas
    const plan = planEliminar(validas(ents.map(entregaDeFila)));
    // La foto del premio se va con la tarea (D265)
    const fotoPremio = t?.premioFoto ?? null;
    const datos = [];
    for (const s of plan.secciones) datos.push(await leerSeccion(tx, s));
    await tx.delete(entregas).where(eq(entregas.tareaId, id));
    await tx.delete(tareas).where(eq(tareas.id, id));
    for (const [i, s] of plan.secciones.entries()) {
      const leidos = datos[i];
      if (!leidos) continue;
      await escribirRanking(
        tx,
        s,
        {
          ...leidos,
          entregas: leidos.entregas.filter((e) => e.tareaId !== id),
        },
        ahora,
      );
    }
    return {
      resultado: { ok: true, id } as ResultadoTarea,
      imagenes: fotoPremio ? [...plan.imagenes, fotoPremio] : plan.imagenes,
    };
  });
}

/** Cierra una tarea abierta (`evaluada`, D202): deja de recibir entregas (D196). */
export async function cerrarTareaEnTransaccion(
  db: Db,
  id: string,
  ahora: number,
): Promise<ResultadoTarea> {
  return db.transaction(async (tx): Promise<ResultadoTarea> => {
    const t = await tareaParaActualizar(tx, id);
    if (t === undefined) return { ok: false, error: "no-existe" };
    if (t === null) return { ok: false, error: "invalida" };
    if (!puedeCerrar(t)) return { ok: false, error: "cerrada" };
    await tx
      .update(tareas)
      .set({ estado: "evaluada", actualizadoEn: ahora })
      .where(eq(tareas.id, id));
    return { ok: true, id };
  });
}

/**
 * Decide el empate del premio de una sección (D123, D124, D263): solo si la tarea está cerrada,
 * tiene premio y hay empate ahora mismo entre los equipos (grupal) o los alumnos (individual) de
 * esa sección; «dar» / «darAlumno» solo a un empatado y según el tipo de tarea.
 */
export async function decidirPremioEnTransaccion(
  db: Db,
  tareaId: string,
  seccion: SeccionId,
  decision: DecisionPremio,
  ahora: number,
): Promise<ResultadoTarea> {
  return db.transaction(async (tx): Promise<ResultadoTarea> => {
    const t = await tareaParaActualizar(tx, tareaId);
    if (t === undefined) return { ok: false, error: "no-existe" };
    if (t === null) return { ok: false, error: "invalida" };
    if (!t.premio || t.estado !== "evaluada" || !t.secciones.includes(seccion)) {
      return { ok: false, error: "sin-empate" };
    }
    const [eqs, ents, usrs] = await Promise.all([
      tx.select().from(equipos).where(eq(equipos.seccion, seccion)),
      tx.select().from(entregas).where(eq(entregas.tareaId, tareaId)),
      tx.select().from(usuarios).where(eq(usuarios.seccion, seccion)),
    ]);
    if (!decisionEncaja(t.tipo, decision))
      return { ok: false, error: "invalida" };
    // Estado sin la decisión anterior: se puede cambiar de opinión mientras siga el empate
    const actual = estadoPremioSeccion(
      { ...t, id: tareaId, decisionesPremio: undefined },
      seccion,
      validas(eqs.map(equipoDeFila)),
      validas(ents.map(entregaDeFila)).map(({ id: _, ...e }) => e),
      validas(usrs.map(usuarioDeFila)),
    );
    if (actual.tipo !== "empate") return { ok: false, error: "sin-empate" };
    const id = idDeDecision(decision);
    if (id !== null && !actual.titularIds.includes(id)) {
      return { ok: false, error: "invalida" };
    }
    await tx
      .update(tareas)
      .set({
        decisionesPremio: sql`coalesce(${tareas.decisionesPremio}, '{}'::jsonb) || jsonb_build_object(${seccion}::text, ${JSON.stringify(decision)}::jsonb)`,
        actualizadoEn: ahora,
      })
      .where(eq(tareas.id, tareaId));
    return { ok: true, id: tareaId };
  });
}

export type PremioGuardado =
  | { ok: true; anterior: string | null }
  | { ok: false; error: "no-existe" | "cerrada" | "invalida" };

/**
 * Pone o cambia el premio de una tarea y su foto (D266) en UNA transacción. La foto nueva ya está
 * en B2 (la sube la acción antes); la anterior sale en `anterior` para borrarla después del commit.
 */
export async function guardarPremioEnTransaccion(
  db: Db,
  tareaId: string,
  premio: string,
  foto: CambioFoto,
  ahora: number,
): Promise<PremioGuardado> {
  return db.transaction(async (tx): Promise<PremioGuardado> => {
    const t = await tareaParaActualizar(tx, tareaId);
    if (t === undefined) return { ok: false, error: "no-existe" };
    if (t === null) return { ok: false, error: "invalida" };
    const r = armarPremio(t, premio, foto);
    if (!r.ok) return r;
    await tx
      .update(tareas)
      .set({ ...r.campos, actualizadoEn: ahora })
      .where(eq(tareas.id, tareaId));
    return { ok: true, anterior: r.anterior };
  });
}
