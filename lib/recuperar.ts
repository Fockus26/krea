// «Olvidé mi contraseña» (fase 07, D185–D188): lógica pura del pedido del enlace y de la
// contraseña nueva. Sin Firebase: el servidor (lib/acciones/recuperar.ts) inyecta lecturas,
// límite, generador del enlace y envío, y las pruebas usan dobles.
import { z } from "zod";
import { PASSWORD_MIN, validarPassword } from "@/lib/auth";
import type { Correo, ResultadoEnvio } from "@/lib/correo/brevo";
import { correoRestablecer, primerNombre } from "@/lib/correo/restablecer";
import { type Apariencia, zCedula, zInstante } from "@/lib/modelo";

/* ---------- Pedido del enlace ---------- */

export const zPedidoEnlace = z.object({ cedula: zCedula });

/** Límite por cédula (D187): un envío cada `REENVIO_SEGUNDOS` y como mucho 3 por hora. */
export const LIMITE_RECUPERAR = {
  separacionMs: 60_000,
  ventanaMs: 60 * 60_000,
  maximo: 3,
} as const;

/** `recuperaciones/{cedula}`: instantes de los últimos envíos (solo el servidor, D187). */
export const zRecuperacion = z.object({ envios: z.array(zInstante).max(20) });
export type Recuperacion = z.infer<typeof zRecuperacion>;

/**
 * ¿Se puede enviar ahora? Devuelve los envíos que quedan en la ventana con el nuevo al final,
 * o `null` si el límite lo impide.
 */
export function reservarEnvio(
  envios: readonly number[],
  ahora: number,
  limite: typeof LIMITE_RECUPERAR = LIMITE_RECUPERAR,
): number[] | null {
  const vigentes = envios.filter(
    (t) => t <= ahora && ahora - t < limite.ventanaMs,
  );
  if (vigentes.length >= limite.maximo) return null;
  const ultimo = Math.max(-Infinity, ...vigentes);
  if (ahora - ultimo < limite.separacionMs) return null;
  return [...vigentes, ahora];
}

/**
 * Código de Better Auth → enlace de la app (`/recuperar/nueva?mode=resetPassword&oobCode=…`,
 * HANDOFF §5c; el parámetro conserva el nombre de Firebase). Sin código → `null`.
 */
export function enlaceRestablecer(
  codigo: string | null,
  sitio: URL,
): string | null {
  if (!codigo) return null;
  const url = new URL("/recuperar/nueva", sitio);
  url.searchParams.set("mode", "resetPassword");
  url.searchParams.set("oobCode", codigo);
  return url.toString();
}

/** Lo que el correo toma del perfil: el nombre y la apariencia (nunca el email ni la cédula). */
export type PerfilCorreo = {
  nombres: string | null;
  apariencia: Apariencia | null;
};

export type DepsRecuperacion = {
  /** Email real de `privados/{cedula}`; `null` si no hay documento o no hay email. */
  leerEmail: (cedula: string) => Promise<string | null>;
  /** `usuarios.nombres` y `usuarios.apariencia` (acento y tema del correo, D342/D343). */
  leerPerfil: (cedula: string) => Promise<PerfilCorreo>;
  /** Transacción sobre `recuperaciones/{cedula}`: `false` si el límite lo impide. */
  reservar: (cedula: string, ahora: number) => Promise<boolean>;
  /** `auth.generatePasswordResetLink(emailInterno(cedula))`. */
  /** Código de un solo uso para restablecer; `null` si la cuenta no existe. */
  generarCodigo: (cedula: string) => Promise<string | null>;
  enviar: (correo: Correo) => Promise<ResultadoEnvio>;
  sitio: URL;
  ahora: () => number;
};

/** Qué pasó (solo para el registro del servidor y las pruebas; el usuario nunca lo ve). */
export type ResultadoRecuperacion =
  | "enviado"
  | "sin-email"
  | "limite"
  | "sin-enlace"
  | "error-envio";

/**
 * Busca el email, aplica el límite, genera el enlace y envía el correo. Corre después de
 * responder (`after`, D186): ni el resultado ni la duración llegan al navegador.
 */
export async function procesarRecuperacion(
  cedula: string,
  deps: DepsRecuperacion,
): Promise<ResultadoRecuperacion> {
  const email = await deps.leerEmail(cedula);
  if (!email) return "sin-email";
  if (!(await deps.reservar(cedula, deps.ahora()))) return "limite";
  const [perfil, codigo] = await Promise.all([
    deps.leerPerfil(cedula),
    deps.generarCodigo(cedula),
  ]);
  const enlace = enlaceRestablecer(codigo, deps.sitio);
  if (!enlace) return "sin-enlace";
  const nombre = primerNombre(perfil.nombres);
  const correo = correoRestablecer({
    nombre,
    cedula,
    enlace,
    apariencia: perfil.apariencia,
  });
  const r = await deps.enviar({
    para: nombre ? { email, nombre } : { email },
    ...correo,
  });
  return r.ok ? "enviado" : "error-envio";
}

/* ---------- Contraseña nueva ---------- */

export const zOobCode = z.string().trim().min(1).max(2048);

export const zRestablecer = z.object({
  oobCode: zOobCode,
  password: z
    .string()
    .max(4096)
    .refine((pw) => validarPassword(pw).estado === "ok", "Contraseña corta"),
});

export type ErrorRestablecer = "vencido" | "invalida" | "bloqueado" | "red";

/**
 * Error de `/reset-password` de Better Auth → error de la app (D188, D327). `status` es el HTTP y
 * `codigo` su `code` (`INVALID_TOKEN`, `PASSWORD_TOO_SHORT`…). Lo desconocido: vencido.
 */
export function errorRestablecerDe(
  status: number | undefined,
  codigo: string | undefined,
): ErrorRestablecer {
  if (status === 429) return "bloqueado";
  if (codigo?.startsWith("PASSWORD_TOO")) return "invalida";
  return "vencido";
}

/** PLACEHOLDER de copy (CONTENT_CHECKLIST fila 125): errores de «Guardar contraseña». */
export const ERROR_RESTABLECER: Record<
  Exclude<ErrorRestablecer, "vencido">,
  string
> = {
  invalida: `La contraseña nueva necesita al menos ${PASSWORD_MIN} caracteres.`,
  bloqueado: "Demasiados intentos. Espera unos minutos y vuelve a intentar.",
  red: "No pudimos guardar la contraseña. Revisa tu internet y vuelve a intentar.",
};

/* ---------- Copy (PLACEHOLDER, CONTENT_CHECKLIST fila 125) ---------- */

/** «Revisa tu correo» sin revelar si la cédula tiene cuenta ni a qué correo va (D186). */
export const ENVIADO_GENERICO =
  "Si esa cédula tiene un correo registrado, te enviamos un enlace.";

/** `/ingresar?aviso=password-nueva` tras guardar la contraseña nueva. */
export const AVISO_PASSWORD_NUEVA = "password-nueva";
export const AVISO_PASSWORD_NUEVA_TEXTO =
  "Listo: tu contraseña cambió. Entra con la nueva.";

/** Pedir el enlace falló en la red (la Server Action no respondió). */
export const ERROR_PEDIR_ENLACE =
  "No pudimos conectarnos. Revisa tu internet y vuelve a intentar.";
