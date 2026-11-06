"use server";
// Server Actions de Perfil (D175, D191, D192): avatar y apariencia al perfil, y cambio de
// contraseña. La cédula sale SIEMPRE de la sesión, nunca del body; todo se valida con zod.
import { FieldPath } from "firebase-admin/firestore";
import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { verificarSesion } from "@/lib/dal";
import { firebaseAdmin } from "@/lib/firebase/admin";
import { destinoPassword, verificarPassword } from "@/lib/firebase/password";
import { COL, emailInterno, zApariencia } from "@/lib/modelo";
import {
  type ErrorCambioPassword,
  zAvatarElegido,
  zCambioPassword,
} from "@/lib/perfil";
import { COOKIE_SESION, SESION_MS } from "@/lib/sesion";

export type ResultadoPerfil = { ok: true } | { ok: false };

/**
 * Guarda el avatar en `usuarios/{cedula}` y, en la misma transacción, en su fila de
 * `ranking/{seccion}` (el ranking pinta los avatares sin leer perfiles, D174).
 */
export async function guardarAvatar(
  entrada: unknown,
): Promise<ResultadoPerfil> {
  const sesion = await verificarSesion();
  const admin = firebaseAdmin();
  if (!sesion || !admin) return { ok: false };
  const avatar = zAvatarElegido(sesion.uid).safeParse(entrada);
  if (!avatar.success) return { ok: false };
  const { estilo, semilla } = avatar.data;
  const db = admin.db;
  const refUsuario = db.collection(COL.usuarios).doc(sesion.uid);
  try {
    await db.runTransaction(async (tx) => {
      const ranking = sesion.seccion
        ? await tx.get(db.collection(COL.ranking).doc(sesion.seccion))
        : null;
      const usuario = await tx.get(refUsuario);
      if (!usuario.exists) throw new Error("sin perfil");
      tx.update(refUsuario, {
        avatar: { estilo, semilla },
        actualizadoEn: Date.now(),
      });
      const fila = ranking?.exists
        ? ranking.get(new FieldPath("alumnos", sesion.uid))
        : undefined;
      if (ranking && fila) {
        tx.update(
          ranking.ref,
          new FieldPath("alumnos", sesion.uid, "estilo"),
          estilo,
          new FieldPath("alumnos", sesion.uid, "semilla"),
          semilla,
        );
      }
    });
    // La topbar, la barra lateral y el ranking vuelven a leer el perfil (D250)
    refresh();
    return { ok: true };
  } catch (e) {
    console.error("[guardarAvatar]", (e as { code?: string }).code ?? "error");
    return { ok: false };
  }
}

/** Guarda tema y acento en el perfil (D015): lo aplica el shell en cualquier dispositivo. */
export async function guardarApariencia(
  entrada: unknown,
): Promise<ResultadoPerfil> {
  const sesion = await verificarSesion();
  const admin = firebaseAdmin();
  if (!sesion || !admin) return { ok: false };
  const apariencia = zApariencia.safeParse(entrada);
  if (!apariencia.success) return { ok: false };
  try {
    await admin.db
      .collection(COL.usuarios)
      .doc(sesion.uid)
      .update({ apariencia: apariencia.data, actualizadoEn: Date.now() });
    // El shell pinta tema y acento desde el perfil: ninguna ruta en caché con los de antes (D250)
    refresh();
    return { ok: true };
  } catch (e) {
    console.error(
      "[guardarApariencia]",
      (e as { code?: string }).code ?? "error",
    );
    return { ok: false };
  }
}

export type ResultadoPassword =
  | { ok: true; sesionRenovada: boolean }
  | { ok: false; error: ErrorCambioPassword };

/**
 * Cambia la contraseña (D192): comprueba la actual (REST de Identity Toolkit), cambia con el
 * Admin SDK, revoca TODAS las sesiones y vuelve a abrir solo esta con la nueva. Si no se pudo
 * reabrir, `sesionRenovada: false` y la página manda a Ingresar.
 */
export async function cambiarPassword(
  entrada: unknown,
): Promise<ResultadoPassword> {
  const sesion = await verificarSesion();
  const admin = firebaseAdmin();
  const destino = destinoPassword(process.env);
  if (!sesion) return { ok: false, error: "sesion" };
  if (!admin || !destino) return { ok: false, error: "red" };
  const datos = zCambioPassword.safeParse(entrada);
  if (!datos.success) return { ok: false, error: "invalida" };
  const email = emailInterno(sesion.uid);

  const actual = await verificarPassword(email, datos.data.actual, destino);
  if (!actual.ok) {
    return {
      ok: false,
      error: actual.error === "credenciales" ? "actual" : actual.error,
    };
  }

  try {
    await admin.auth.updateUser(sesion.uid, { password: datos.data.nueva });
    await admin.auth.revokeRefreshTokens(sesion.uid);
  } catch (e) {
    console.error(
      "[cambiarPassword]",
      (e as { code?: string }).code ?? "error",
    );
    return { ok: false, error: "red" };
  }

  const jar = await cookies();
  try {
    const nueva = await verificarPassword(email, datos.data.nueva, destino);
    if (!nueva.ok) throw new Error(nueva.error);
    const cookie = await admin.auth.createSessionCookie(nueva.idToken, {
      expiresIn: SESION_MS,
    });
    jar.set(COOKIE_SESION, cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESION_MS / 1000,
    });
    return { ok: true, sesionRenovada: true };
  } catch (e) {
    console.error("[cambiarPassword] reabrir", (e as Error).message);
    jar.delete(COOKIE_SESION);
    return { ok: true, sesionRenovada: false };
  }
}
