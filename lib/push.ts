// Aviso de tarea nueva por Web Push (D335–D340): lo puro, sin red ni base. Lo usan la Server
// Action, el envío (lib/data/push.ts) y el interruptor de Perfil.
import { z } from "zod";

/** Las tres variables de VAPID. Sin cualquiera de ellas no hay aviso (D337). */
export type ConfigPush = {
  publica: string;
  privada: string;
  subject: string;
};

type Entorno = Record<string, string | undefined>;

export function configPush(env: Entorno): ConfigPush | null {
  const publica = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privada = env.VAPID_PRIVATE_KEY?.trim();
  const subject = env.VAPID_SUBJECT?.trim();
  if (!publica || !privada || !subject) return null;
  return { publica, privada, subject };
}

/** La clave pública solo si el envío está configurado entero: si no, Perfil no ofrece el aviso. */
export function clavePublicaPush(env: Entorno): string | null {
  return configPush(env)?.publica ?? null;
}

const zBase64Url = z
  .string()
  .min(1)
  .max(512)
  .regex(/^[A-Za-z0-9_-]+=*$/);

/** `PushSubscription.toJSON()` del navegador. El endpoint es siempre https (lo da el servicio). */
export const zSuscripcionPush = z.object({
  endpoint: z.url({ protocol: /^https$/ }).max(2048),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({ p256dh: zBase64Url, auth: zBase64Url }),
});

export type SuscripcionPush = z.infer<typeof zSuscripcionPush>;

export const zEndpointPush = zSuscripcionPush.shape.endpoint;

/** Lo que el service worker recibe y pinta (`public/sw.js`, listener `push`). */
export type AvisoPush = {
  titulo: string;
  cuerpo: string;
  url: string;
  etiqueta: string;
};

// PROVISIONAL (CONTENT_CHECKLIST fila 171): título de la notificación
export const TITULO_AVISO_TAREA = "Nueva tarea";
const MAX_CUERPO = 120;

export function avisoTareaNueva(tarea: {
  id: string;
  titulo: string;
}): AvisoPush {
  const titulo = tarea.titulo.trim();
  return {
    titulo: TITULO_AVISO_TAREA,
    cuerpo:
      titulo.length > MAX_CUERPO
        ? `${titulo.slice(0, MAX_CUERPO - 1).trimEnd()}…`
        : titulo,
    url: `/tareas/${encodeURIComponent(tarea.id)}`,
    // Un reintento del mismo aviso reemplaza la notificación en vez de apilarla
    etiqueta: `tarea-${tarea.id}`,
  };
}

// PROVISIONAL (CONTENT_CHECKLIST fila 293): título de la notificación al capitán
export const TITULO_AVISO_PARTE = "Parte entregada";
const MAX_TITULO_TAREA_PARTE = 60;

/**
 * Aviso al capitán de que un integrante entregó su parte (D535): «Ana Pérez entregó la pregunta 2
 * de “Afiche”». Solo nombre y primer apellido, nunca la cédula. `numero` cuenta desde 1.
 */
export function avisoParteEntregada(parte: {
  tareaId: string;
  preguntaId: string;
  tituloTarea: string;
  numero: number;
  integrante: { nombres: string; apellidos: string };
}): AvisoPush {
  const primera = (s: string) => s.trim().split(/\s+/)[0] ?? "";
  const quien =
    `${primera(parte.integrante.nombres)} ${primera(parte.integrante.apellidos)}`.trim() ||
    "Un integrante";
  const t = parte.tituloTarea.trim();
  const tarea =
    t.length > MAX_TITULO_TAREA_PARTE
      ? `${t.slice(0, MAX_TITULO_TAREA_PARTE - 1).trimEnd()}…`
      : t;
  return {
    titulo: TITULO_AVISO_PARTE,
    // PROVISIONAL (CONTENT_CHECKLIST fila 294): cuerpo del aviso de parte entregada
    cuerpo: `${quien} entregó la pregunta ${parte.numero} de “${tarea}”`,
    url: `/tareas/${encodeURIComponent(parte.tareaId)}`,
    // Reentregar la misma parte reemplaza la notificación en vez de apilarla
    etiqueta: `parte-${parte.tareaId}-${parte.preguntaId}`,
  };
}

/** La tarea que se acaba de publicar, para avisar a sus secciones. */
export type TareaPublicada = {
  id: string;
  titulo: string;
  secciones: string[];
};

/**
 * Se avisa solo en la transición borrador/nueva → abierta (D336). Editar una ya publicada, guardar
 * un borrador o reintentar desde la cola un guardado que ya entró no vuelven a avisar.
 */
export function debeAvisar(
  previa: { estado: string } | null,
  nueva: { estado: string; importada?: boolean },
): boolean {
  if (nueva.estado !== "abierta" || nueva.importada) return false;
  return previa === null || previa.estado === "borrador";
}

/** El servicio de push dice que la suscripción ya no existe: se borra (D338). */
export function suscripcionVencida(statusCode: number | undefined): boolean {
  return statusCode === 404 || statusCode === 410;
}

/** Clave pública VAPID (base64url) → bytes para `pushManager.subscribe`. */
export function bytesDeClave(base64Url: string): Uint8Array<ArrayBuffer> {
  const relleno = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const b64 = (base64Url + relleno).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
