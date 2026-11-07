"use server";
// Server Actions de Perfil (D175, D191, D192, D232, D234): avatar, apariencia y datos del profe
// al perfil, cambio de contraseña y «Crea tu contraseña». La cédula sale SIEMPRE de la sesión,
// nunca del body (ningún profe edita a otro); todo se valida con zod.
import type { Auth } from "firebase-admin/auth";
import { FieldPath } from "firebase-admin/firestore";
import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { zMisDatos } from "@/lib/cuentas-datos";
import { verificarSesion } from "@/lib/dal";
import { firebaseAdmin } from "@/lib/firebase/admin";
import {
  crearPasswordPropia,
  guardarMisDatosCon,
} from "@/lib/firebase/cuentas";
import { destinoPassword, verificarPassword } from "@/lib/firebase/password";
import { COL, emailInterno, zApariencia } from "@/lib/modelo";
import {
  type ErrorCambioPassword,
  zAvatarElegido,
  zCambioPassword,
  zCrearPassword,
} from "@/lib/perfil";
import {
  COOKIE_SESION,
  inicioDe,
  RUTA_INGRESAR,
  SESION_MS,
} from "@/lib/sesion";

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
  // Con contraseña temporal solo puede crear la suya (D232)
  if (!sesion || sesion.debeCambiarPassword || !admin) return { ok: false };
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
  // Con contraseña temporal solo puede crear la suya (D232)
  if (!sesion || sesion.debeCambiarPassword || !admin) return { ok: false };
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

  const sesionRenovada = await reabrirSesion(
    admin.auth,
    email,
    datos.data.nueva,
    destino,
    "[cambiarPassword]",
  );
  // La cookie nueva ya vacía la caché del router; esto lo deja explícito (D250)
  refresh();
  return { ok: true, sesionRenovada };
}

/**
 * Vuelve a entrar con la contraseña nueva y deja solo esta sesión abierta (cookie nueva). Si no
 * se puede, borra la cookie: la página manda a Ingresar.
 */
async function reabrirSesion(
  auth: Auth,
  email: string,
  password: string,
  destino: { apiKey: string; emuladorHost?: string },
  donde: string,
): Promise<boolean> {
  const jar = await cookies();
  try {
    const nueva = await verificarPassword(email, password, destino);
    if (!nueva.ok) throw new Error(nueva.error);
    const cookie = await auth.createSessionCookie(nueva.idToken, {
      expiresIn: SESION_MS,
    });
    jar.set(COOKIE_SESION, cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESION_MS / 1000,
    });
    return true;
  } catch (e) {
    console.error(`${donde} reabrir`, (e as Error).message);
    jar.delete(COOKIE_SESION);
    return false;
  }
}

export type ResultadoCrearPassword =
  | { ok: true; destino: string }
  | { ok: false; error: Exclude<ErrorCambioPassword, "actual" | "bloqueado"> };

/**
 * «Crea tu contraseña» (D232): solo una sesión abierta con la contraseña temporal. No pide la
 * actual (acaba de entrar con ella); cambia en Auth, quita la marca del perfil y de las claims,
 * revoca las sesiones y reabre esta con la nueva. Devuelve a dónde ir: su inicio, o Ingresar si
 * la sesión no se pudo reabrir.
 */
export async function crearPassword(
  entrada: unknown,
): Promise<ResultadoCrearPassword> {
  const sesion = await verificarSesion();
  const admin = firebaseAdmin();
  const destino = destinoPassword(process.env);
  if (!sesion?.debeCambiarPassword) return { ok: false, error: "sesion" };
  if (!admin || !destino) return { ok: false, error: "red" };
  const datos = zCrearPassword.safeParse(entrada);
  if (!datos.success) return { ok: false, error: "invalida" };
  try {
    await crearPasswordPropia(
      admin.auth,
      admin.db,
      sesion.uid,
      datos.data.nueva,
      Date.now(),
    );
  } catch (e) {
    console.error("[crearPassword]", (e as { code?: string }).code ?? "error");
    return { ok: false, error: "red" };
  }
  const renovada = await reabrirSesion(
    admin.auth,
    emailInterno(sesion.uid),
    datos.data.nueva,
    destino,
    "[crearPassword]",
  );
  // Ninguna ruta en caché de la sesión con la temporal (D250)
  refresh();
  return {
    ok: true,
    destino: renovada ? inicioDe(sesion.rol) : RUTA_INGRESAR,
  };
}

/**
 * El profesor cambia SUS nombres y apellidos (D234; pedido 4 de César): la cédula sale de la
 * sesión, nunca del body. El alumno no puede: sus datos los edita el profe (CLAUDE.md).
 */
export async function guardarMisDatos(
  entrada: unknown,
): Promise<ResultadoPerfil> {
  const sesion = await verificarSesion();
  const admin = firebaseAdmin();
  if (!sesion || sesion.debeCambiarPassword || !admin) return { ok: false };
  if (sesion.rol !== "profesor") return { ok: false };
  const datos = zMisDatos.safeParse(entrada);
  if (!datos.success) return { ok: false };
  try {
    const r = await guardarMisDatosCon(
      admin.db,
      sesion.uid,
      datos.data,
      Date.now(),
    );
    if (!r.ok) return { ok: false };
    refresh();
    return { ok: true };
  } catch (e) {
    console.error(
      "[guardarMisDatos]",
      (e as { code?: string }).code ?? "error",
    );
    return { ok: false };
  }
}
