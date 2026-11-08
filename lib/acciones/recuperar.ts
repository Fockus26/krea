"use server";
// Server Actions de «Olvidé mi contraseña» (D185–D188, D327). Pedir el enlace responde siempre lo
// mismo y en el mismo tiempo: la búsqueda y el envío corren después de responder (`after`).
// Nunca se registran el email, el enlace ni el código: solo códigos de resultado.
import { APIError } from "better-auth/api";
import { after } from "next/server";
import { authKrea, tokenRecuperacion } from "@/lib/better-auth";
import { configBrevo, enviarCorreo } from "@/lib/correo/brevo";
import { baseDeDatos } from "@/lib/db";
import { codigoVigente, depsRecuperacion } from "@/lib/data/recuperacion";
import { emailInterno } from "@/lib/modelo";
import {
  type ErrorRestablecer,
  errorRestablecerDe,
  procesarRecuperacion,
  zOobCode,
  zPedidoEnlace,
  zRestablecer,
} from "@/lib/recuperar";
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
    const db = baseDeDatos();
    if (!brevo || !db) {
      console.error("[pedirEnlace] envío no configurado");
      return;
    }
    try {
      const r = await procesarRecuperacion(
        cedula,
        depsRecuperacion(
          db,
          (c) => tokenRecuperacion(c, emailInterno(c)),
          (c) => enviarCorreo(brevo, c),
          SITE_URL,
        ),
      );
      if (r === "sin-enlace" || r === "error-envio") {
        console.error("[pedirEnlace]", r);
      }
    } catch (e) {
      console.error("[pedirEnlace]", (e as Error).message);
    }
  });

  return { ok: true };
}

export type ResultadoCodigo =
  | { ok: true }
  | { ok: false; error: "vencido" | "red" };

/** Comprueba el código sin gastarlo (la página decide entre el formulario y «ya venció»). */
export async function comprobarCodigo(
  oobCode: unknown,
): Promise<ResultadoCodigo> {
  const codigo = zOobCode.safeParse(oobCode);
  if (!codigo.success) return { ok: false, error: "vencido" };
  const db = baseDeDatos();
  if (!db) return { ok: false, error: "red" };
  try {
    return (await codigoVigente(db, codigo.data))
      ? { ok: true }
      : { ok: false, error: "vencido" };
  } catch {
    return { ok: false, error: "red" };
  }
}

export type ResultadoRestablecer =
  | { ok: true }
  | { ok: false; error: ErrorRestablecer };

/**
 * Guarda la contraseña nueva con el código (lo gasta). Better Auth revoca todas las sesiones de la
 * cuenta (`revokeSessionsOnPasswordReset`): la página manda a Ingresar con el aviso.
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
  const auth = authKrea();
  if (!auth) return { ok: false, error: "red" };
  try {
    await auth.api.resetPassword({
      body: { token: datos.data.oobCode, newPassword: datos.data.password },
    });
    return { ok: true };
  } catch (e) {
    if (e instanceof APIError) {
      const codigo = (e.body as { code?: string } | undefined)?.code;
      return {
        ok: false,
        error: errorRestablecerDe(e.statusCode, codigo),
      };
    }
    console.error("[restablecerPassword]", (e as Error).message);
    return { ok: false, error: "red" };
  }
}
