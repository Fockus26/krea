"use server";
// Server Actions de la entrega (fase 07 W5, D175, D195–D197). La cédula sale SIEMPRE de la
// sesión (`exigirSesion`), nunca del body. Subir: valida permiso e imagen y la guarda privada en
// B2; devuelve solo la ruta. Enviar: zod + permiso + respuestas en UNA transacción, que crea la
// entrega `entregada` (`lib/firebase/entregas.ts`). Enviar no cambia puntos (solo una entrega
// evaluada aporta, D007), así que `ranking/{seccion}` no se recalcula aquí: lo hará W7 al evaluar.
import { refresh } from "next/cache";
import { almacenB2 } from "@/lib/almacen/b2";
import { validarImagenSubida } from "@/lib/almacen/imagen";
import { exigirSesion, sesionDeCola } from "@/lib/dal";
import {
  carpetaEntrega,
  claveImagen,
  comprobarImagenes,
  type ErrorSubida,
  imagenesDe,
  zEnvioEntrega,
  zIdPregunta,
  zIdTarea,
} from "@/lib/entregas";
import { firebaseAdmin } from "@/lib/firebase/admin";
import {
  enviarEnTransaccion,
  permisoSubida,
  type ResultadoEnvio,
} from "@/lib/firebase/entregas";
import { zOpId, zQuien } from "@/lib/offline/operacion";

export type ResultadoSubida =
  | { ok: true; imagenPath: string }
  | { ok: false; error: ErrorSubida };

/** Desde la cola: además, `sesion` (no es la de quien la encoló o venció, D294). */
export type ResultadoSubidaCola =
  | ResultadoSubida
  | { ok: false; error: "sesion" };
export type ResultadoEnvioCola =
  | ResultadoEnvio
  | { ok: false; error: "sesion" };

export type { ResultadoEnvio };

/** Sin `B2_*` en el servidor: se registra para que alguien lo vea (D229). */
function sinAlmacen(accion: string): { ok: false; error: "almacen" } {
  console.error(
    `[${accion}] almacén sin configurar (faltan las variables B2_*)`,
  );
  return { ok: false, error: "almacen" };
}

/** Sube la imagen de una respuesta (FormData: `tareaId`, `preguntaId`, `imagen`). */
export async function subirImagenRespuesta(
  form: FormData,
): Promise<ResultadoSubida> {
  const sesion = await exigirSesion("estudiante");
  return subir(sesion.uid, form, crypto.randomUUID());
}

/**
 * La misma subida desde la cola sin conexión (D294, D295). FormData con `usuario` (quien la
 * encoló) e `imagenId` (uuid del teléfono): la clave sale de él, así un reintento pisa el mismo
 * objeto en vez de dejar otro. Sin la sesión de ese alumno: `sesion`, sin redirigir.
 */
export async function subirImagenPendiente(
  form: FormData,
): Promise<ResultadoSubidaCola> {
  const usuario = form.get("usuario");
  const imagenId = zOpId.safeParse(form.get("imagenId"));
  if (typeof usuario !== "string" || !imagenId.success)
    return { ok: false, error: "incompleta" };
  const sesion = await sesionDeCola("estudiante", usuario);
  if (!sesion) return { ok: false, error: "sesion" };
  return subir(sesion.uid, form, imagenId.data);
}

async function subir(
  uid: string,
  form: FormData,
  uuid: string,
): Promise<ResultadoSubida> {
  const admin = firebaseAdmin();
  const almacen = almacenB2();
  if (!admin) return { ok: false, error: "red" };
  if (!almacen) return sinAlmacen("subirImagenRespuesta");

  const tareaId = zIdTarea.safeParse(form.get("tareaId"));
  const preguntaId = zIdPregunta.safeParse(form.get("preguntaId"));
  const imagen = form.get("imagen");
  if (!tareaId.success || !preguntaId.success || !(imagen instanceof Blob)) {
    return { ok: false, error: "incompleta" };
  }

  try {
    const p = await permisoSubida(admin.db, uid, tareaId.data, preguntaId.data);
    if (!p.ok) return p;

    const bytes = new Uint8Array(await imagen.arrayBuffer());
    const v = validarImagenSubida(bytes);
    if (!v.ok) {
      return {
        ok: false,
        error: v.error === "peso" ? "imagen-peso" : "imagen-tipo",
      };
    }

    const clave = claveImagen(
      tareaId.data,
      await carpetaEntrega(p.permiso.entregaId),
      uuid,
    );
    const r = await almacen.subir(clave, bytes, "image/jpeg");
    // B2 falló del lado del servidor: no es la conexión del alumno (D229)
    if (!r.ok) return { ok: false, error: "almacen" };
    return { ok: true, imagenPath: clave };
  } catch (e) {
    console.error(
      "[subirImagenRespuesta]",
      (e as { code?: string }).code ?? "error",
    );
    return { ok: false, error: "red" };
  }
}

/** Envía la entrega (D012: en grupal solo el capitán). Después no se puede cambiar. */
export async function enviarEntrega(entrada: unknown): Promise<ResultadoEnvio> {
  const sesion = await exigirSesion("estudiante");
  const r = await enviar(sesion.uid, entrada);
  if (r.ok) refresh();
  return r;
}

/**
 * El mismo envío desde la cola sin conexión (D292–D294): `entrada` lleva `usuario` (quien lo
 * encoló) y `opId`. Sin la sesión de ese alumno devuelve `sesion` y la operación queda pendiente.
 * El permiso (tarea abierta, capitán en grupal, D012) se comprueba igual que en línea.
 */
export async function enviarEntregaPendiente(
  entrada: unknown,
): Promise<ResultadoEnvioCola> {
  const quien = zQuien.safeParse(entrada);
  if (!quien.success) return { ok: false, error: "incompleta" };
  const sesion = await sesionDeCola("estudiante", quien.data.usuario);
  if (!sesion) return { ok: false, error: "sesion" };
  const r = await enviar(sesion.uid, entrada);
  if (r.ok) refresh();
  return r;
}

async function enviar(uid: string, entrada: unknown): Promise<ResultadoEnvio> {
  const admin = firebaseAdmin();
  if (!admin) return { ok: false, error: "red" };
  const envio = zEnvioEntrega.safeParse(entrada);
  if (!envio.success) return { ok: false, error: "incompleta" };
  try {
    const almacen = almacenB2();
    if (!almacen && imagenesDe(envio.data.respuestas).length > 0)
      return sinAlmacen("enviarEntrega");
    const faltan = await comprobarImagenes(almacen, envio.data.respuestas);
    if (faltan) return { ok: false, error: faltan };
    return await enviarEnTransaccion(admin.db, uid, envio.data, Date.now());
  } catch (e) {
    console.error("[enviarEntrega]", (e as { code?: string }).code ?? "error");
    return { ok: false, error: "red" };
  }
}
