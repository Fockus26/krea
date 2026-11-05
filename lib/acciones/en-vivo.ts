"use server";
// Token para las lecturas en vivo (D190): si el SDK del navegador perdió la sesión de Firebase
// de esta cuenta (otra pestaña cerró sesión, la contraseña cambió), el ranking pide un token
// personalizado para SU uid. Da lo mismo que ya da la cookie: leer lo que las reglas le dejan.
import { verificarSesion } from "@/lib/dal";
import { firebaseAdmin } from "@/lib/firebase/admin";

/** `sin-sesion`: la cookie venció o se revocó (p. ej. el profe la movió de equipo, D210). */
export type ResultadoTokenEnVivo =
  | { ok: true; token: string }
  | { ok: false; error: "sin-sesion" | "red" };

export async function tokenEnVivo(): Promise<ResultadoTokenEnVivo> {
  const sesion = await verificarSesion();
  if (!sesion) return { ok: false, error: "sin-sesion" };
  const admin = firebaseAdmin();
  if (!admin) return { ok: false, error: "red" };
  try {
    // Sin claims extra: el token de ID trae los de la cuenta (rol, sección, equipo)
    return { ok: true, token: await admin.auth.createCustomToken(sesion.uid) };
  } catch (e) {
    console.error("[tokenEnVivo]", (e as { code?: string }).code ?? "error");
    return { ok: false, error: "red" };
  }
}
