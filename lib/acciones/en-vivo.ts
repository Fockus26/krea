"use server";
// Token para las lecturas en vivo (D190): si el SDK del navegador perdió la sesión de Firebase
// de esta cuenta (otra pestaña cerró sesión, la contraseña cambió), el ranking pide un token
// personalizado para SU uid. Da lo mismo que ya da la cookie: leer lo que las reglas le dejan.
import { verificarSesion } from "@/lib/dal";
import { firebaseAdmin } from "@/lib/firebase/admin";

export async function tokenEnVivo(): Promise<string | null> {
  const sesion = await verificarSesion();
  const admin = firebaseAdmin();
  if (!sesion || !admin) return null;
  try {
    // Sin claims extra: el token de ID trae los de la cuenta (rol, sección, equipo)
    return await admin.auth.createCustomToken(sesion.uid);
  } catch (e) {
    console.error("[tokenEnVivo]", (e as { code?: string }).code ?? "error");
    return null;
  }
}
