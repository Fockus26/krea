// Envío de correos transaccionales con la API de Brevo (D185): `POST /v3/smtp/email` con la
// cabecera `api-key`. Puro salvo `fetch`, que llega inyectado (pruebas sin red). Nunca registra
// el destinatario ni el contenido: los errores salen como códigos.

export const URL_BREVO = "https://api.brevo.com/v3/smtp/email";

/** Nombre del remitente (lienzo `design/canvas/Correo.dc.html`). */
export const REMITENTE_NOMBRE = "KREA · Escuela Creativa";

export type ConfigBrevo = { apiKey: string; remitente: string };

export type Correo = {
  para: { email: string; nombre?: string };
  asunto: string;
  html: string;
  texto: string;
};

export type ErrorEnvio = "config" | "red" | "rechazado";
export type ResultadoEnvio = { ok: true } | { ok: false; error: ErrorEnvio };

/** Entorno → clave y remitente; falta cualquiera de los dos → `null` (no se envía nada). */
export function configBrevo(
  env: Partial<Record<string, string | undefined>>,
): ConfigBrevo | null {
  const apiKey = env.BREVO_API_KEY?.trim();
  const remitente = env.BREVO_SENDER_EMAIL?.trim();
  if (!apiKey || !remitente) return null;
  return { apiKey, remitente };
}

/** Cuerpo JSON de la API (`sender`, `to`, `subject`, `htmlContent`, `textContent`). */
export function cuerpoBrevo(config: ConfigBrevo, correo: Correo) {
  return {
    sender: { name: REMITENTE_NOMBRE, email: config.remitente },
    to: [
      correo.para.nombre
        ? { email: correo.para.email, name: correo.para.nombre }
        : { email: correo.para.email },
    ],
    subject: correo.asunto,
    htmlContent: correo.html,
    textContent: correo.texto,
  };
}

export async function enviarCorreo(
  config: ConfigBrevo,
  correo: Correo,
  pedir: typeof fetch = fetch,
): Promise<ResultadoEnvio> {
  let res: Response;
  try {
    res = await pedir(URL_BREVO, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": config.apiKey,
      },
      body: JSON.stringify(cuerpoBrevo(config, correo)),
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "red" };
  }
  if (res.ok) return { ok: true };
  return { ok: false, error: res.status >= 500 ? "red" : "rechazado" };
}
