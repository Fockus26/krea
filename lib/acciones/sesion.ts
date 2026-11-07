"use server";
// Server Actions de la sesión (D180): crear la cookie tras el login y cerrarla, y la sesión de las
// pantallas de error (D213).
import { cookies } from "next/headers";
import { z } from "zod";
import type { NavUsuario } from "@/components/layout/nav-types";
import type { ErrorIngreso } from "@/lib/auth";
import { verificarSesion } from "@/lib/dal";
import { firebaseAdmin } from "@/lib/firebase/admin";
import { sesionDeCookie } from "@/lib/firebase/sesion-servidor";
import { COL, type RolUsuario, zUsuario } from "@/lib/modelo";
import {
  COOKIE_SESION,
  destinoDe,
  loginReciente,
  SESION_MS,
  sesionDeClaims,
} from "@/lib/sesion";
import { navUsuarioDe } from "@/lib/vistas-estudiante";

export type ResultadoIngreso =
  | { ok: true; destino: string }
  | { ok: false; error: ErrorIngreso };

const zIdToken = z.string().min(1).max(8192);

/**
 * Cambia el idToken de un login recién hecho en el navegador por la cookie de sesión httpOnly.
 * Una cuenta sin rol válido (claims) no entra: «credenciales», sin decir por qué.
 */
export async function iniciarSesion(
  idToken: unknown,
): Promise<ResultadoIngreso> {
  const token = zIdToken.safeParse(idToken);
  if (!token.success) return { ok: false, error: "credenciales" };
  const admin = firebaseAdmin();
  if (!admin) return { ok: false, error: "no-disponible" };

  try {
    const t = await admin.auth.verifyIdToken(token.data, true);
    const sesion = sesionDeClaims(t.uid, t);
    if (!sesion || !loginReciente(t.auth_time, Date.now())) {
      return { ok: false, error: "credenciales" };
    }
    const cookie = await admin.auth.createSessionCookie(token.data, {
      expiresIn: SESION_MS,
    });
    (await cookies()).set(COOKIE_SESION, cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESION_MS / 1000,
    });
    // Con contraseña temporal, a «Crea tu contraseña» (D232)
    return { ok: true, destino: destinoDe(sesion) };
  } catch (e) {
    console.error("[iniciarSesion]", (e as { code?: string }).code ?? "error");
    return { ok: false, error: "credenciales" };
  }
}

/** Borra la cookie y revoca los tokens de la cuenta (cierra la sesión en todos sus equipos). */
export async function cerrarSesion(): Promise<void> {
  const jar = await cookies();
  const sesion = await sesionDeCookie(jar.get(COOKIE_SESION)?.value, {
    revocadas: false,
  });
  jar.delete(COOKIE_SESION);
  const admin = firebaseAdmin();
  if (sesion && admin) {
    try {
      await admin.auth.revokeRefreshTokens(sesion.uid);
    } catch (e) {
      console.error("[cerrarSesion]", (e as { code?: string }).code ?? "error");
    }
  }
}

/** Sesión de las pantallas 404/500 (D160 → D213): rol + usuario de la cabecera, o `null`. */
export type SesionPantalla = {
  rol: RolUsuario;
  usuario: NavUsuario | null;
} | null;

/**
 * Sesión real para la cabecera del 404 y el 500 (D213). La llaman el 404 (servidor, dentro de
 * `<Suspense>`) y el 500 (cliente, al montar). Solo lee el perfil de la propia sesión. Sin cookie
 * válida → `null` («Iniciar sesión»); si el perfil no se puede leer, el rol sin usuario.
 */
export async function sesionDePantalla(): Promise<SesionPantalla> {
  const sesion = await verificarSesion();
  if (!sesion) return null;
  const admin = firebaseAdmin();
  if (!admin) return { rol: sesion.rol, usuario: null };
  try {
    const snap = await admin.db.collection(COL.usuarios).doc(sesion.uid).get();
    const u = zUsuario.safeParse(snap.data());
    return {
      rol: sesion.rol,
      usuario: u.success ? navUsuarioDe(u.data) : null,
    };
  } catch (e) {
    console.error(
      "[sesionDePantalla]",
      (e as { code?: string }).code ?? "error",
    );
    return { rol: sesion.rol, usuario: null };
  }
}
