import "server-only";
// Data Access Layer de la sesión (D180): toda página o Server Action que lea o escriba datos
// pregunta aquí, cerca del dato. El proxy solo hace la comprobación rápida.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { sesionDeCookie } from "@/lib/firebase/sesion-servidor";
import type { RolUsuario } from "@/lib/modelo";
import {
  COOKIE_SESION,
  inicioDe,
  RUTA_CREAR_PASSWORD,
  RUTA_INGRESAR,
  type Sesion,
} from "@/lib/sesion";

/** Sesión del request (con chequeo de revocación), una vez por render. */
export const verificarSesion = cache(async (): Promise<Sesion | null> => {
  // verifySessionCookie usa Date.now(): sin esto, Next lo rechaza durante el prerender (D219)
  await connection();
  const valor = (await cookies()).get(COOKIE_SESION)?.value;
  return sesionDeCookie(valor, { revocadas: true });
});

/**
 * Exige un rol: sin sesión → /ingresar; otro rol → su inicio. Con contraseña temporal, nada de
 * su rol carga hasta crear la suya: → «Crea tu contraseña» (D232).
 */
export async function exigirSesion(rol: RolUsuario): Promise<Sesion> {
  const s = await verificarSesion();
  if (!s) redirect(RUTA_INGRESAR);
  if (s.debeCambiarPassword) redirect(RUTA_CREAR_PASSWORD);
  if (s.rol !== rol) redirect(inicioDe(s.rol));
  return s;
}

/**
 * Exige el profesor admin (D231): la pantalla Profesores y sus Server Actions. Un profesor que no
 * es admin vuelve al Panel; otro rol, a su inicio (lo hace `exigirSesion`).
 */
export async function exigirAdmin(): Promise<Sesion> {
  const s = await exigirSesion("profesor");
  if (!s.admin) redirect(inicioDe("profesor"));
  return s;
}
