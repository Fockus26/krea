"use server";
// Server Actions de «Olvidé mi contraseña» (D185–D188). Pedir el enlace responde siempre lo
// mismo y en el mismo tiempo: la búsqueda y el envío corren después de responder (`after`).
// Nunca se registran el email, el enlace ni el código: solo códigos de resultado.
import { cookies } from "next/headers";
import { after } from "next/server";
import { configBrevo, enviarCorreo } from "@/lib/correo/brevo";
import { firebaseAdmin } from "@/lib/firebase/admin";
import { destinoPassword, resetConCodigo } from "@/lib/firebase/password";
import { depsRecuperacion } from "@/lib/firebase/recuperacion";
import {
  type ErrorRestablecer,
  errorRestablecerDe,
  procesarRecuperacion,
  zOobCode,
  zPedidoEnlace,
  zRestablecer,
} from "@/lib/recuperar";
import { COOKIE_SESION } from "@/lib/sesion";
import { SITE_URL } from "@/lib/site";

export type ResultadoPedido = { ok: true } | { ok: false };

/**
 * Pide el enlace para una cédula. `{ ok: true }` exista o no la cuenta, tenga o no email, esté
 * o no en el límite y aunque el envío falle o no esté configurado (D186).
 */
export async function pedirEnlace(entrada: unknown): Promise<ResultadoPedido> {
  const pedido = zPedidoEnlace.safeParse(entrada);
  if (!pedido.success) return { ok: false };
  const { cedula } = pedido.data;

  after(async () => {
    const brevo = configBrevo(process.env);
    const admin = firebaseAdmin();
    if (!brevo || !admin) {
      console.error("[pedirEnlace] envío no configurado");
      return;
    }
    try {
      const r = await procesarRecuperacion(
        cedula,
        depsRecuperacion(admin, (c) => enviarCorreo(brevo, c), SITE_URL),
      );
      if (r === "sin-enlace" || r === "error-envio") {
        console.error("[pedirEnlace]", r);
      }
    } catch (e) {
      console.error("[pedirEnlace]", (e as { code?: string }).code ?? "error");
    }
  });

  return { ok: true };
}

export type ResultadoCodigo =
  | { ok: true }
  | { ok: false; error: "vencido" | "red" };

/** Comprueba el `oobCode` sin gastarlo (la página decide entre el formulario y «ya venció»). */
export async function comprobarCodigo(
  oobCode: unknown,
): Promise<ResultadoCodigo> {
  const codigo = zOobCode.safeParse(oobCode);
  if (!codigo.success) return { ok: false, error: "vencido" };
  const destino = destinoPassword(process.env);
  if (!destino) return { ok: false, error: "red" };
  const r = await resetConCodigo(codigo.data, null, destino);
  if (r.ok) return { ok: true };
  return { ok: false, error: r.red ? "red" : "vencido" };
}

export type ResultadoRestablecer =
  | { ok: true }
  | { ok: false; error: ErrorRestablecer };

/**
 * Guarda la contraseña nueva con el `oobCode` (lo gasta), revoca todas las sesiones de la cuenta
 * y borra la cookie de este navegador: la página manda a Ingresar con el aviso.
 */
export async function restablecerPassword(
  entrada: unknown,
): Promise<ResultadoRestablecer> {
  const datos = zRestablecer.safeParse(entrada);
  if (!datos.success) {
    const sinCodigo = !zOobCode.safeParse(
      (entrada as { oobCode?: unknown } | null)?.oobCode,
    ).success;
    return { ok: false, error: sinCodigo ? "vencido" : "invalida" };
  }
  const destino = destinoPassword(process.env);
  if (!destino) return { ok: false, error: "red" };

  const r = await resetConCodigo(
    datos.data.oobCode,
    datos.data.password,
    destino,
  );
  if (!r.ok) {
    return { ok: false, error: r.red ? "red" : errorRestablecerDe(r.mensaje) };
  }

  const admin = firebaseAdmin();
  try {
    if (!admin) throw new Error("sin admin");
    const usuario = await admin.auth.getUserByEmail(r.email);
    await admin.auth.revokeRefreshTokens(usuario.uid);
  } catch (e) {
    console.error(
      "[restablecerPassword] revocar",
      (e as { code?: string }).code ?? "error",
    );
  }
  (await cookies()).delete(COOKIE_SESION);
  return { ok: true };
}
