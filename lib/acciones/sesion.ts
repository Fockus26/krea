"use server";
// Server Actions de la sesión (D180): crear la cookie tras el login y cerrarla.
import { cookies } from "next/headers";
import { z } from "zod";
import type { ErrorIngreso } from "@/lib/auth";
import { firebaseAdmin } from "@/lib/firebase/admin";
import { sesionDeCookie } from "@/lib/firebase/sesion-servidor";
import {
  COOKIE_SESION,
  inicioDe,
  loginReciente,
  SESION_MS,
  sesionDeClaims,
} from "@/lib/sesion";

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
    return { ok: true, destino: inicioDe(sesion.rol) };
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
