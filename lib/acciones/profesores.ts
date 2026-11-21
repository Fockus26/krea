"use server";
// Server Actions de la pantalla Profesores (D233): solo el profesor admin (`exigirAdmin`, D231).
// La cédula del destino llega en el body, pero cada acción comprueba que sea un PROFESOR (esta
// pantalla no toca alumnos) y el admin no puede borrarse a sí mismo. Todo se valida con zod.
import { refresh } from "next/cache";
import { crearCuenta, ErrorCuenta, eliminarCuenta } from "@/lib/cuentas";
import {
  type ErrorProfesor,
  type ResultadoCrearProfesor,
  type ResultadoProfesor,
  zCrearProfesor,
  zEditarProfesor,
} from "@/lib/cuentas-datos";
import { exigirAdmin } from "@/lib/dal";
import { editarProfesorEnTransaccion } from "@/lib/data/cuentas";
import { leerUsuario } from "@/lib/data/usuarios";
import { baseDeDatos, type Db } from "@/lib/db";
import { borrarEnLote, type ResultadoLote, zCedulasLote } from "@/lib/lote";
import { zCedula } from "@/lib/modelo";

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

/**
 * Nombres, apellidos y email de recuperación de un profesor (la cédula no cambia, D174). Con la
 * versión del diálogo: si alguien guardó en medio, `cambio` con lo de ahora (D532).
 */
export async function editarProfesor(
  entrada: unknown,
): Promise<ResultadoProfesor> {
  await exigirAdmin();
  const db = baseDeDatos();
  if (!db) return { ok: false, error: "red" };
  const d = zEditarProfesor.safeParse(entrada);
  if (!d.success) return { ok: false, error: "invalida" };
  try {
    const r = await editarProfesorEnTransaccion(db, d.data, Date.now());
    // `cambio`: la lista también pasa a lo de ahora; el diálogo conserva lo escrito
    if (r.ok || r.error === "cambio") refresh();
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
  const db = baseDeDatos();
  if (!db) return { ok: false, error: "red" };
  const c = zCedula.safeParse(cedula);
  if (!c.success) return { ok: false, error: "invalida" };
  const r = await borrarUnProfesor(db, sesion.uid, c.data);
  if (r.ok) refresh();
  return r;
}

/**
 * Lo mismo para varios (W22, D298): hasta TOPE_LOTE cédulas, una tras otra, con el resultado de
 * cada una. El admin no se borra a sí mismo aunque su cédula llegue en el body (`tu-cuenta`).
 * Idempotente como el de uno: el que ya no está cuenta como borrado.
 */
export async function eliminarProfesores(
  cedulas: unknown,
): Promise<ResultadoLote<ErrorProfesor>> {
  const sesion = await exigirAdmin();
  const db = baseDeDatos();
  if (!db) return { ok: false, error: "red" };
  const d = zCedulasLote.safeParse(cedulas);
  if (!d.success) return { ok: false, error: "invalida" };
  const resultados = await borrarEnLote<ErrorProfesor>(
    d.data,
    (cedula) => borrarUnProfesor(db, sesion.uid, cedula),
    "red",
  );
  refresh();
  return { ok: true, resultados };
}

/** El borrado de uno, sin sesión ni `refresh()`. No lanza: cualquier fallo vuelve como error. */
async function borrarUnProfesor(
  db: Db,
  yo: string,
  cedula: string,
): Promise<ResultadoProfesor> {
  if (cedula === yo) return { ok: false, error: "tu-cuenta" };
  try {
    const u = await leerUsuario(db, cedula);
    // Sin perfil no hay qué comprobar ni borrar (ya se eliminó)
    if (!u) return { ok: true };
    if (u.rol !== "profesor") return { ok: false, error: "no-profesor" };
    await eliminarCuenta(cedula);
    return { ok: true };
  } catch (e) {
    log("[eliminarProfesor]", e);
    return { ok: false, error: "red" };
  }
}
