"use server";
// Server Actions de la sesión (D180, D327): confirmar el login recién hecho con Better Auth y
// cerrarlo, y la sesión de las pantallas de error (D213).
import { headers } from "next/headers";
import type { NavUsuario } from "@/components/layout/nav-types";
import type { ErrorIngreso } from "@/lib/auth";
import { authKrea } from "@/lib/better-auth";
import { verificarSesion } from "@/lib/dal";
import { baseDeDatos } from "@/lib/db";
import { leerUsuario } from "@/lib/data/usuarios";
import type { RolUsuario } from "@/lib/modelo";
import { destinoDe } from "@/lib/sesion";
import { navUsuarioDe } from "@/lib/vistas-estudiante";

export type ResultadoIngreso =
  | { ok: true; destino: string }
  | { ok: false; error: ErrorIngreso };

/**
 * Tras `signIn.email` en el navegador: a dónde va la sesión recién abierta. Una cuenta sin perfil
 * válido no entra: se cierra la sesión y responde «credenciales», sin decir por qué.
 */
export async function confirmarIngreso(): Promise<ResultadoIngreso> {
  const sesion = await verificarSesion();
  if (sesion) return { ok: true, destino: destinoDe(sesion) };
  await cerrarSesion();
  return { ok: false, error: "credenciales" };
}

/** Cierra todas las sesiones de la cuenta (en todos sus equipos) y borra la cookie. */
export async function cerrarSesion(): Promise<void> {
  const auth = authKrea();
  if (!auth) return;
  const h = await headers();
  try {
    await auth.api.revokeSessions({ headers: h });
  } catch {
    // Sin sesión no hay nada que revocar
  }
  try {
    await auth.api.signOut({ headers: h });
  } catch (e) {
    console.error("[cerrarSesion]", (e as Error).message);
  }
}

/** Sesión de las pantallas 404/500 (D160 → D213): rol + usuario de la cabecera, o `null`. */
export type SesionPantalla = {
  rol: RolUsuario;
  usuario: NavUsuario | null;
} | null;

/**
 * Sesión real para la cabecera del 404 y el 500 (D213). Solo lee el perfil de la propia sesión.
 * Sin sesión válida → `null` («Iniciar sesión»); si el perfil no se puede leer, el rol sin usuario.
 */
export async function sesionDePantalla(): Promise<SesionPantalla> {
  const sesion = await verificarSesion();
  if (!sesion) return null;
  const db = baseDeDatos();
  if (!db) return { rol: sesion.rol, usuario: null };
  try {
    const u = await leerUsuario(db, sesion.uid);
    return { rol: sesion.rol, usuario: u ? navUsuarioDe(u) : null };
  } catch (e) {
    console.error("[sesionDePantalla]", (e as Error).message);
    return { rol: sesion.rol, usuario: null };
  }
}
