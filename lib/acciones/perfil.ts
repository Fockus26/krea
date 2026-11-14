"use server";
// Server Actions de Perfil (D175, D191, D192, D232, D234): avatar, apariencia y datos del profe
// al perfil, cambio de contraseña y «Crea tu contraseña». La cédula sale SIEMPRE de la sesión,
// nunca del body (ningún profe edita a otro); todo se valida con zod.
import { APIError } from "better-auth/api";
import { eq, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { headers } from "next/headers";
import { authKrea } from "@/lib/better-auth";
import { zContacto } from "@/lib/contacto";
import { zMisDatos } from "@/lib/cuentas-datos";
import { verificarSesion } from "@/lib/dal";
import { guardarContactoCon } from "@/lib/data/contacto";
import { crearPasswordPropia, guardarMisDatosCon } from "@/lib/data/cuentas";
import { baseDeDatos } from "@/lib/db";
import { ranking, usuarios } from "@/lib/db/schema";
import { emailInterno, zApariencia } from "@/lib/modelo";
import {
  type ErrorCambioPassword,
  zAvatarElegido,
  zCambioPassword,
  zCrearPassword,
} from "@/lib/perfil";
import { inicioDe, RUTA_INGRESAR } from "@/lib/sesion";

export type ResultadoPerfil = { ok: true } | { ok: false };

/**
 * Guarda el avatar en `usuarios/{cedula}` y, en la misma transacción, en su fila de
 * `ranking/{seccion}` (el ranking pinta los avatares sin leer perfiles, D174).
 */
export async function guardarAvatar(
  entrada: unknown,
): Promise<ResultadoPerfil> {
  const sesion = await verificarSesion();
  const db = baseDeDatos();
  // Con contraseña temporal solo puede crear la suya (D232)
  if (!sesion || sesion.debeCambiarPassword || !db) return { ok: false };
  const uid = sesion.uid;
  const seccion = sesion.seccion;
  try {
    const ok = await db.transaction(async (tx) => {
      // Las opciones válidas salen de la semilla guardada (D388): se lee antes de validar
      const [actual] = await tx
        .select({ avatar: usuarios.avatar })
        .from(usuarios)
        .where(eq(usuarios.cedula, uid))
        .limit(1)
        .for("update");
      if (!actual) throw new Error("sin perfil");
      const avatar = zAvatarElegido(actual.avatar.semilla, uid).safeParse(
        entrada,
      );
      if (!avatar.success) return false;
      const { estilo, semilla } = avatar.data;
      const r = await tx
        .update(usuarios)
        .set({ avatar: { estilo, semilla }, actualizadoEn: Date.now() })
        .where(eq(usuarios.cedula, uid))
        .returning({ cedula: usuarios.cedula });
      if (r.length === 0) throw new Error("sin perfil");
      // Su fila del ranking, si ya tiene una (el ranking pinta avatares sin leer perfiles)
      if (seccion)
        await tx
          .update(ranking)
          .set({
            alumnos: sql`jsonb_set(jsonb_set(${ranking.alumnos}, ARRAY[${uid}::text, 'estilo'], to_jsonb(${estilo}::text)), ARRAY[${uid}::text, 'semilla'], to_jsonb(${semilla}::text))`,
          })
          .where(
            sql`${ranking.seccion} = ${seccion} AND ${ranking.alumnos} ? ${uid}`,
          );
      return true;
    });
    if (!ok) return { ok: false };
    // La topbar, la barra lateral y el ranking vuelven a leer el perfil (D250)
    refresh();
    return { ok: true };
  } catch (e) {
    console.error("[guardarAvatar]", (e as Error).message);
    return { ok: false };
  }
}

/** Guarda tema y acento en el perfil (D015): lo aplica el shell en cualquier dispositivo. */
export async function guardarApariencia(
  entrada: unknown,
): Promise<ResultadoPerfil> {
  const sesion = await verificarSesion();
  const db = baseDeDatos();
  // Con contraseña temporal solo puede crear la suya (D232)
  if (!sesion || sesion.debeCambiarPassword || !db) return { ok: false };
  const apariencia = zApariencia.safeParse(entrada);
  if (!apariencia.success) return { ok: false };
  try {
    await db
      .update(usuarios)
      .set({ apariencia: apariencia.data, actualizadoEn: Date.now() })
      .where(eq(usuarios.cedula, sesion.uid));
    // El shell pinta tema y acento desde el perfil: ninguna ruta en caché con los de antes (D250)
    refresh();
    return { ok: true };
  } catch (e) {
    console.error("[guardarApariencia]", (e as Error).message);
    return { ok: false };
  }
}

export type ResultadoPassword =
  | { ok: true; sesionRenovada: boolean }
  | { ok: false; error: ErrorCambioPassword };

/**
 * Cambia la contraseña (D192): Better Auth comprueba la actual, la cambia, revoca las demás
 * sesiones y deja esta con un token nuevo (cookie nueva), así que `sesionRenovada` es `true`.
 */
export async function cambiarPassword(
  entrada: unknown,
): Promise<ResultadoPassword> {
  const sesion = await verificarSesion();
  const auth = authKrea();
  if (!sesion) return { ok: false, error: "sesion" };
  if (!auth) return { ok: false, error: "red" };
  const datos = zCambioPassword.safeParse(entrada);
  if (!datos.success) return { ok: false, error: "invalida" };
  try {
    await auth.api.changePassword({
      body: {
        currentPassword: datos.data.actual,
        newPassword: datos.data.nueva,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });
  } catch (e) {
    if (e instanceof APIError) {
      if (e.statusCode === 429) return { ok: false, error: "bloqueado" };
      if (e.statusCode === 400 || e.statusCode === 401)
        return { ok: false, error: "actual" };
    }
    console.error("[cambiarPassword]", (e as Error).message);
    return { ok: false, error: "red" };
  }
  // La cookie nueva ya vacía la caché del router; esto lo deja explícito (D250)
  refresh();
  return { ok: true, sesionRenovada: true };
}

/** Vuelve a entrar con la contraseña nueva (cookie nueva). Si no se puede, la página va a Ingresar. */
async function reabrirSesion(
  cedula: string,
  password: string,
  donde: string,
): Promise<boolean> {
  const auth = authKrea();
  if (!auth) return false;
  try {
    await auth.api.signInEmail({
      body: { email: emailInterno(cedula), password },
      headers: await headers(),
    });
    return true;
  } catch (e) {
    console.error(`${donde} reabrir`, (e as Error).message);
    return false;
  }
}

export type ResultadoCrearPassword =
  | { ok: true; destino: string }
  | { ok: false; error: Exclude<ErrorCambioPassword, "actual" | "bloqueado"> };

/**
 * «Crea tu contraseña» (D232): solo una sesión abierta con la contraseña temporal. No pide la
 * actual (acaba de entrar con ella); la cambia, quita la marca del perfil, revoca las sesiones y
 * reabre esta con la nueva. Devuelve a dónde ir: su inicio, o Ingresar si no se pudo reabrir.
 */
export async function crearPassword(
  entrada: unknown,
): Promise<ResultadoCrearPassword> {
  const sesion = await verificarSesion();
  const db = baseDeDatos();
  if (!sesion?.debeCambiarPassword) return { ok: false, error: "sesion" };
  if (!db) return { ok: false, error: "red" };
  const datos = zCrearPassword.safeParse(entrada);
  if (!datos.success) return { ok: false, error: "invalida" };
  try {
    await crearPasswordPropia(db, sesion.uid, datos.data.nueva, Date.now());
  } catch (e) {
    console.error("[crearPassword]", (e as Error).message);
    return { ok: false, error: "red" };
  }
  const renovada = await reabrirSesion(
    sesion.uid,
    datos.data.nueva,
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
  const db = baseDeDatos();
  if (!sesion || sesion.debeCambiarPassword || !db) return { ok: false };
  if (sesion.rol !== "profesor") return { ok: false };
  const datos = zMisDatos.safeParse(entrada);
  if (!datos.success) return { ok: false };
  try {
    const r = await guardarMisDatosCon(db, sesion.uid, datos.data, Date.now());
    if (!r.ok) return { ok: false };
    refresh();
    return { ok: true };
  } catch (e) {
    console.error("[guardarMisDatos]", (e as Error).message);
    return { ok: false };
  }
}

/**
 * El profesor guarda SU contacto para los alumnos (D378): teléfono móvil venezolano (WhatsApp) y
 * correo, ambos opcionales; vacío = borrar. La cédula sale de la sesión; el teléfono se guarda
 * normalizado con la misma función pura que valida el formulario.
 */
export async function guardarContacto(
  entrada: unknown,
): Promise<ResultadoPerfil> {
  const sesion = await verificarSesion();
  const db = baseDeDatos();
  if (!sesion || sesion.debeCambiarPassword || !db) return { ok: false };
  if (sesion.rol !== "profesor") return { ok: false };
  const datos = zContacto.safeParse(entrada);
  if (!datos.success) return { ok: false };
  try {
    const r = await guardarContactoCon(db, sesion.uid, datos.data, Date.now());
    if (!r.ok) return { ok: false };
    // El Perfil de sus alumnos vuelve a leer «Tus profesores»
    refresh();
    return { ok: true };
  } catch (e) {
    console.error("[guardarContacto]", (e as Error).message);
    return { ok: false };
  }
}
