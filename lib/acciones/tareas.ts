"use server";
// Server Actions de las tareas del profe (fase 07 W6, D175, D199–D202). El autor sale SIEMPRE de
// la sesión (`exigirSesion("profesor")`), nunca del body. Cada una valida con zod y escribe en UNA
// transacción del Admin SDK (`lib/firebase/tareas.ts`). Guardar, cerrar y el premio no cambian
// puntos (D007); eliminar sí, y recalcula el ranking en su transacción (D206, D242).
import { refresh } from "next/cache";
import { almacenB2 } from "@/lib/almacen/b2";
import { claveFotoPremio, validarFotoPremio } from "@/lib/almacen/imagen";
import { exigirSesion, sesionDeCola } from "@/lib/dal";
import { diaDeInstante } from "@/lib/fecha";
import { firebaseAdmin } from "@/lib/firebase/admin";
import {
  cerrarTareaEnTransaccion,
  decidirPremioEnTransaccion,
  eliminarTareaEnTransaccion,
  guardarPremioEnTransaccion,
  guardarTareaEnTransaccion,
} from "@/lib/firebase/tareas";
import { zQuien } from "@/lib/offline/operacion";
import type { ResultadoPremio } from "@/lib/premios";
import {
  type CambioFoto,
  type ResultadoTarea,
  zDecidirPremio,
  zGuardarTarea,
  zIdTareaProfe,
  zTextoPremio,
} from "@/lib/tareas-profe-datos";

export type { ResultadoPremio, ResultadoTarea };

/** Desde la cola: además, `sesion` (no es la de quien la encoló o venció, D294). */
export type ResultadoTareaCola =
  | ResultadoTarea
  | { ok: false; error: "sesion" };

function registrar(accion: string, e: unknown) {
  console.error(`[${accion}]`, (e as { code?: string }).code ?? "error");
}

/** Guarda un borrador, publica o guarda cambios de una tarea publicada (`accion`). */
export async function guardarTarea(entrada: unknown): Promise<ResultadoTarea> {
  const sesion = await exigirSesion("profesor");
  const r = await guardar(sesion.uid, entrada);
  if (r.ok) refresh();
  return r;
}

/**
 * El mismo guardado desde la cola sin conexión (D292–D294): `entrada` lleva `usuario` (el profe
 * que lo encoló) y `opId`. Sin la sesión de ese profe devuelve `sesion` y queda pendiente.
 */
export async function guardarTareaPendiente(
  entrada: unknown,
): Promise<ResultadoTareaCola> {
  const quien = zQuien.safeParse(entrada);
  if (!quien.success) return { ok: false, error: "invalida" };
  const sesion = await sesionDeCola("profesor", quien.data.usuario);
  if (!sesion) return { ok: false, error: "sesion" };
  const r = await guardar(sesion.uid, entrada);
  if (r.ok) refresh();
  return r;
}

async function guardar(uid: string, entrada: unknown): Promise<ResultadoTarea> {
  const admin = firebaseAdmin();
  if (!admin) return { ok: false, error: "red" };
  const envio = zGuardarTarea.safeParse(entrada);
  if (!envio.success) return { ok: false, error: "invalida" };
  const ahora = Date.now();
  try {
    const { fotoSuelta, ...r } = await guardarTareaEnTransaccion(
      admin.db,
      uid,
      envio.data,
      diaDeInstante(ahora),
      ahora,
    );
    if (fotoSuelta) await borrarFoto(fotoSuelta, "guardarTarea");
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

/** Borra una foto de premio que ya no se usa; si falla, se registra y queda huérfana (D265). */
async function borrarFoto(clave: string, accion: string) {
  const almacen = almacenB2();
  const b = almacen ? await almacen.borrar(clave).catch(() => null) : null;
  if (!b?.ok)
    console.error(`[${accion}] no se borró la foto anterior del premio`);
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

/**
 * Pone o cambia el premio de una tarea (grupal o individual) y su foto (D263, D265, D266).
 * FormData: `tareaId`, `premio` (texto), `foto` (archivo, opcional) y `quitarFoto` ("1"). La foto
 * se valida por sus bytes, se sube a B2 (`premios/{tareaId}/{uuid}.{ext}`) y luego se escribe la
 * tarea; si la escritura falla se borra la nueva, y si sale bien se borra la anterior.
 */
export async function guardarPremio(form: FormData): Promise<ResultadoPremio> {
  await exigirSesion("profesor");
  const admin = firebaseAdmin();
  if (!admin) return { ok: false, error: "red" };
  const tareaId = zIdTareaProfe.safeParse(form.get("tareaId"));
  const premio = zTextoPremio.safeParse(form.get("premio"));
  const archivo = form.get("foto");
  const quitar = form.get("quitarFoto") === "1";
  if (!tareaId.success || !premio.success)
    return { ok: false, error: "invalida" };
  const conFoto = archivo instanceof Blob && archivo.size > 0;
  if (conFoto && quitar) return { ok: false, error: "invalida" };

  const almacen = almacenB2();
  let foto: CambioFoto = quitar ? { tipo: "quitar" } : { tipo: "mantener" };
  let nueva: string | null = null;
  let guardado = false;
  try {
    if (conFoto) {
      if (!almacen) {
        console.error(
          "[guardarPremio] almacén sin configurar (faltan las variables B2_*)",
        );
        return { ok: false, error: "almacen" };
      }
      const bytes = new Uint8Array(await archivo.arrayBuffer());
      const v = validarFotoPremio(bytes);
      if (!v.ok)
        return {
          ok: false,
          error: v.error === "peso" ? "foto-peso" : "foto-tipo",
        };
      nueva = claveFotoPremio(tareaId.data, crypto.randomUUID(), v.extension);
      const subida = await almacen.subir(nueva, bytes, v.tipo);
      if (!subida.ok) return { ok: false, error: "almacen" };
      foto = { tipo: "nueva", clave: nueva };
    }
    const r = await guardarPremioEnTransaccion(
      admin.db,
      tareaId.data,
      premio.data,
      foto,
      Date.now(),
    );
    if (!r.ok) {
      if (nueva) await almacen?.borrar(nueva).catch(() => null);
      return r;
    }
    guardado = true;
    if (r.anterior) await borrarFoto(r.anterior, "guardarPremio");
    refresh();
    return { ok: true };
  } catch (e) {
    registrar("guardarPremio", e);
    // Solo si la tarea no llegó a apuntar a la foto nueva
    if (nueva && !guardado) await almacen?.borrar(nueva).catch(() => null);
    return { ok: false, error: "red" };
  }
}
