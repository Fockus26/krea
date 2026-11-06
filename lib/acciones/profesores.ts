"use server";
// Server Actions de la pantalla Profesores (D233): solo el profesor admin (`exigirAdmin`, D231).
// La cédula del destino llega en el body, pero cada acción comprueba que sea un PROFESOR (esta
// pantalla no toca alumnos) y el admin no puede borrarse a sí mismo. Todo se valida con zod.
import { refresh } from "next/cache";
import { crearCuenta, ErrorCuenta, eliminarCuenta } from "@/lib/cuentas";
import {
  type ResultadoCrearProfesor,
  type ResultadoProfesor,
  zCrearProfesor,
  zEditarProfesor,
} from "@/lib/cuentas-datos";
import { exigirAdmin } from "@/lib/dal";
import { firebaseAdmin } from "@/lib/firebase/admin";
import { editarProfesorEnTransaccion } from "@/lib/firebase/cuentas";
import { COL, zCedula, zUsuario } from "@/lib/modelo";

const log = (donde: string, e: unknown) =>
  console.error(donde, (e as { code?: string }).code ?? "error");

/** Crea un profesor y devuelve su contraseña temporal UNA vez (D232): no se guarda en ningún lado. */
export async function crearProfesor(
  entrada: unknown,
): Promise<ResultadoCrearProfesor> {
  await exigirAdmin();
  const d = zCrearProfesor.safeParse(entrada);
  if (!d.success) return { ok: false, error: "invalida" };
  try {
    const { passwordTemporal } = await crearCuenta({
      rol: "profesor",
      ...d.data,
    });
    refresh();
    return { ok: true, passwordTemporal };
  } catch (e) {
    if (e instanceof ErrorCuenta && e.codigo === "existe")
      return { ok: false, error: "existe" };
    log("[crearProfesor]", e);
    return { ok: false, error: "red" };
  }
}

/** Nombres, apellidos y email de recuperación de un profesor (la cédula no cambia, D174). */
export async function editarProfesor(
  entrada: unknown,
): Promise<ResultadoProfesor> {
  await exigirAdmin();
  const admin = firebaseAdmin();
  if (!admin) return { ok: false, error: "red" };
  const d = zEditarProfesor.safeParse(entrada);
  if (!d.success) return { ok: false, error: "invalida" };
  try {
    const r = await editarProfesorEnTransaccion(admin.db, d.data, Date.now());
    if (r.ok) refresh();
    return r;
  } catch (e) {
    log("[editarProfesor]", e);
    return { ok: false, error: "red" };
  }
}

/**
 * Elimina a un profesor: su cuenta y su perfil; sus tareas, ajustes y evaluaciones se quedan.
 * Idempotente: si ya no está, responde `ok` (un doble clic no muestra un error).
 */
export async function eliminarProfesor(
  cedula: unknown,
): Promise<ResultadoProfesor> {
  const sesion = await exigirAdmin();
  const admin = firebaseAdmin();
  if (!admin) return { ok: false, error: "red" };
  const c = zCedula.safeParse(cedula);
  if (!c.success) return { ok: false, error: "invalida" };
  if (c.data === sesion.uid) return { ok: false, error: "tu-cuenta" };
  try {
    const snap = await admin.db.collection(COL.usuarios).doc(c.data).get();
    // Sin perfil no hay qué comprobar ni borrar (eliminarCuenta borra Auth antes que el perfil)
    if (!snap.exists) return { ok: true };
    const u = zUsuario.safeParse(snap.data());
    if (!u.success || u.data.rol !== "profesor")
      return { ok: false, error: "no-profesor" };
    await eliminarCuenta(c.data);
    refresh();
    return { ok: true };
  } catch (e) {
    log("[eliminarProfesor]", e);
    return { ok: false, error: "red" };
  }
}
