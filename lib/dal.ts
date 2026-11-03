import "server-only";
// Data Access Layer de la sesión (D180): toda página o Server Action que lea o escriba datos
// pregunta aquí, cerca del dato. El proxy solo hace la comprobación rápida.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { sesionDeCookie } from "@/lib/firebase/sesion-servidor";
import type { RolUsuario } from "@/lib/modelo";
import {
  COOKIE_SESION,
  inicioDe,
  RUTA_INGRESAR,
  type Sesion,
} from "@/lib/sesion";

/** Sesión del request (con chequeo de revocación), una vez por render. */
export const verificarSesion = cache(async (): Promise<Sesion | null> => {
  const valor = (await cookies()).get(COOKIE_SESION)?.value;
  return sesionDeCookie(valor, { revocadas: true });
});

/** Exige un rol: sin sesión → /ingresar; otro rol → su inicio. */
export async function exigirSesion(rol: RolUsuario): Promise<Sesion> {
  const s = await verificarSesion();
  if (!s) redirect(RUTA_INGRESAR);
  if (s.rol !== rol) redirect(inicioDe(s.rol));
  return s;
}
