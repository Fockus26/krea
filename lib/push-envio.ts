import "server-only";
// Envío real del aviso con `web-push` y las claves VAPID (D337). Solo servidor: la clave privada
// nunca sale de aquí. Sin las tres variables, `programarAvisoTarea` no hace nada.
import { after } from "next/server";
import { sendNotification } from "web-push";
import { avisarTareaPublicada, type Enviar } from "@/lib/data/push";
import { baseDeDatos } from "@/lib/db";
import { type ConfigPush, configPush, type TareaPublicada } from "@/lib/push";

/** Un aviso que no llega en un día ya no sirve de mucho; el servicio lo descarta. */
const TTL_SEGUNDOS = 24 * 60 * 60;
const ESPERA_MS = 10_000;

function enviador(config: ConfigPush): Enviar {
  return (destino, aviso) =>
    sendNotification(
      {
        endpoint: destino.endpoint,
        keys: { p256dh: destino.p256dh, auth: destino.auth },
      },
      JSON.stringify(aviso),
      {
        vapidDetails: {
          subject: config.subject,
          publicKey: config.publica,
          privateKey: config.privada,
        },
        TTL: TTL_SEGUNDOS,
        urgency: "normal",
        timeout: ESPERA_MS,
      },
    );
}

/**
 * Después de responder al profe (`after`, no lo retrasa): avisa a los alumnos suscritos de las
 * secciones de la tarea recién publicada. Un fallo aquí nunca deshace la publicación.
 */
export function programarAvisoTarea(tarea: TareaPublicada) {
  const config = configPush(process.env);
  if (!config) return;
  after(async () => {
    const db = baseDeDatos();
    if (!db) return;
    try {
      const r = await avisarTareaPublicada(db, tarea, enviador(config));
      if (r.fallidos > 0 || r.vencidos > 0) console.error("[avisoTarea]", r);
    } catch (e) {
      console.error("[avisoTarea]", (e as { code?: string }).code ?? "error");
    }
  });
}
