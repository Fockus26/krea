"use server";
// Server Actions de las tareas del profe (fase 07 W6, D175, D199–D202). El autor sale SIEMPRE de
// la sesión (`exigirSesion("profesor")`), nunca del body. Cada una valida con zod y escribe en UNA
// transacción del Admin SDK (`lib/firebase/tareas.ts`). Guardar, cerrar y el premio no cambian
// puntos (D007); eliminar sí, y recalcula el ranking en su transacción (D206, D242).
import { refresh } from "next/cache";
import { almacenB2 } from "@/lib/almacen/b2";
import { exigirSesion } from "@/lib/dal";
import { diaDeInstante } from "@/lib/fecha";
import { firebaseAdmin } from "@/lib/firebase/admin";
import {
  cerrarTareaEnTransaccion,
  decidirPremioEnTransaccion,
  eliminarTareaEnTransaccion,
  guardarTareaEnTransaccion,
} from "@/lib/firebase/tareas";
import {
  type ResultadoTarea,
  zDecidirPremio,
  zGuardarTarea,
  zIdTareaProfe,
} from "@/lib/tareas-profe-datos";

export type { ResultadoTarea };

function registrar(accion: string, e: unknown) {
  console.error(`[${accion}]`, (e as { code?: string }).code ?? "error");
}

/** Guarda un borrador, publica o guarda cambios de una tarea publicada (`accion`). */
export async function guardarTarea(entrada: unknown): Promise<ResultadoTarea> {
  const sesion = await exigirSesion("profesor");
  const admin = firebaseAdmin();
  if (!admin) return { ok: false, error: "red" };
  const envio = zGuardarTarea.safeParse(entrada);
  if (!envio.success) return { ok: false, error: "invalida" };
  const ahora = Date.now();
  try {
    const r = await guardarTareaEnTransaccion(
      admin.db,
      sesion.uid,
      envio.data,
      diaDeInstante(ahora),
      ahora,
    );
    if (r.ok) refresh();
    return r;
  } catch (e) {
    registrar("guardarTarea", e);
    return { ok: false, error: "red" };
  }
}

/** Cierra una tarea abierta: deja de recibir entregas. */
export async function cerrarTarea(id: unknown): Promise<ResultadoTarea> {
  await exigirSesion("profesor");
  const admin = firebaseAdmin();
  if (!admin) return { ok: false, error: "red" };
  const tareaId = zIdTareaProfe.safeParse(id);
  if (!tareaId.success) return { ok: false, error: "invalida" };
  try {
    const r = await cerrarTareaEnTransaccion(
      admin.db,
      tareaId.data,
      Date.now(),
    );
    if (r.ok) refresh();
    return r;
  } catch (e) {
    registrar("cerrarTarea", e);
    return { ok: false, error: "red" };
  }
}

/**
 * Elimina una tarea (cualquier estado) con sus entregas y notas, y recalcula el ranking de sus
 * secciones en la misma transacción (D242). Las imágenes de B2 se borran después: si B2 falla,
 * se registra y la acción sigue siendo un éxito (D229, D243); quedan huérfanas, sin dueño.
 */
export async function eliminarTarea(id: unknown): Promise<ResultadoTarea> {
  await exigirSesion("profesor");
  const admin = firebaseAdmin();
  if (!admin) return { ok: false, error: "red" };
  const tareaId = zIdTareaProfe.safeParse(id);
  if (!tareaId.success) return { ok: false, error: "invalida" };
  let imagenes: string[];
  try {
    const r = await eliminarTareaEnTransaccion(
      admin.db,
      tareaId.data,
      Date.now(),
    );
    if (!r.resultado.ok) return r.resultado;
    imagenes = r.imagenes;
  } catch (e) {
    registrar("eliminarTarea", e);
    return { ok: false, error: "red" };
  }
  await borrarImagenes(imagenes);
  refresh();
  return { ok: true, id: tareaId.data };
}

async function borrarImagenes(claves: readonly string[]) {
  if (claves.length === 0) return;
  const almacen = almacenB2();
  if (!almacen) {
    console.error(
      `[eliminarTarea] almacén sin configurar: ${claves.length} imágenes sin borrar`,
    );
    return;
  }
  const r = await Promise.allSettled(claves.map((c) => almacen.borrar(c)));
  const fallidas = r.filter((x) => x.status === "rejected" || !x.value.ok);
  if (fallidas.length > 0) {
    console.error(
      `[eliminarTarea] almacén: ${fallidas.length} de ${claves.length} imágenes sin borrar`,
    );
  }
}

/** Decide el empate del premio de una sección: darlo a un equipo o compartirlo. */
export async function decidirPremio(entrada: unknown): Promise<ResultadoTarea> {
  await exigirSesion("profesor");
  const admin = firebaseAdmin();
  if (!admin) return { ok: false, error: "red" };
  const d = zDecidirPremio.safeParse(entrada);
  if (!d.success) return { ok: false, error: "invalida" };
  try {
    const r = await decidirPremioEnTransaccion(
      admin.db,
      d.data.tareaId,
      d.data.seccion,
      d.data.decision,
      Date.now(),
    );
    if (r.ok) refresh();
    return r;
  } catch (e) {
    registrar("decidirPremio", e);
    return { ok: false, error: "red" };
  }
}
