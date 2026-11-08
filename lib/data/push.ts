// Suscripciones Web Push y envío del aviso de tarea nueva (D335–D340) sobre Postgres. Sin
// `server-only` para que las pruebas corran sobre PGlite; la app lo usa desde lib/acciones/push.ts
// (después de `exigirSesion("estudiante")`) y desde el `after()` de publicar una tarea. El envío
// llega inyectado (`Enviar`): las pruebas no tocan la red.
//
// Nunca se registran endpoints ni cédulas: solo conteos y códigos.
import { and, eq, inArray } from "drizzle-orm";
import type { Db } from "@/lib/db";
import { pushSuscripciones, usuarios } from "@/lib/db/schema";
import {
  type AvisoPush,
  avisoTareaNueva,
  type SuscripcionPush,
  suscripcionVencida,
  type TareaPublicada,
} from "@/lib/push";

/** Guarda la suscripción de este navegador. Si el navegador ya era de otra cuenta, pasa a esta. */
export async function guardarSuscripcion(
  db: Db,
  cedula: string,
  sub: SuscripcionPush,
  ahora: number,
): Promise<void> {
  const fila = {
    endpoint: sub.endpoint,
    cedula,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
    creadoEn: ahora,
  };
  await db
    .insert(pushSuscripciones)
    .values(fila)
    .onConflictDoUpdate({ target: pushSuscripciones.endpoint, set: fila });
}

/** Borra la suscripción de este navegador, solo si es de quien la pide. */
export async function borrarSuscripcion(
  db: Db,
  cedula: string,
  endpoint: string,
): Promise<void> {
  await db
    .delete(pushSuscripciones)
    .where(
      and(
        eq(pushSuscripciones.endpoint, endpoint),
        eq(pushSuscripciones.cedula, cedula),
      ),
    );
}

export type Destino = { endpoint: string; p256dh: string; auth: string };

/** Las suscripciones de los alumnos de esas secciones (varias por alumno: un navegador cada una). */
export async function destinatarios(
  db: Db,
  secciones: readonly string[],
): Promise<Destino[]> {
  if (secciones.length === 0) return [];
  return db
    .select({
      endpoint: pushSuscripciones.endpoint,
      p256dh: pushSuscripciones.p256dh,
      auth: pushSuscripciones.auth,
    })
    .from(pushSuscripciones)
    .innerJoin(usuarios, eq(usuarios.cedula, pushSuscripciones.cedula))
    .where(
      and(
        eq(usuarios.rol, "estudiante"),
        inArray(usuarios.seccion, [...secciones]),
      ),
    );
}

/** Manda un aviso a un destino; si falla, lanza con `statusCode` (lo hace `web-push`). */
export type Enviar = (destino: Destino, aviso: AvisoPush) => Promise<unknown>;

export type ResumenAviso = {
  enviados: number;
  vencidos: number;
  fallidos: number;
};

/** De a cuántos envíos a la vez (una sección son ~40 alumnos, algunos con varios navegadores). */
const LOTE = 20;

/**
 * Avisa a los alumnos de las secciones de la tarea. Las suscripciones que el servicio de push da
 * por vencidas (404/410) se borran; los demás fallos solo se cuentan.
 */
export async function avisarTareaPublicada(
  db: Db,
  tarea: TareaPublicada,
  enviar: Enviar,
): Promise<ResumenAviso> {
  const aviso = avisoTareaNueva(tarea);
  const todos = await destinatarios(db, tarea.secciones);
  const resumen: ResumenAviso = { enviados: 0, vencidos: 0, fallidos: 0 };
  const vencidos: string[] = [];
  for (let i = 0; i < todos.length; i += LOTE) {
    const lote = todos.slice(i, i + LOTE);
    const r = await Promise.allSettled(lote.map((d) => enviar(d, aviso)));
    r.forEach((x, j) => {
      if (x.status === "fulfilled") resumen.enviados++;
      else if (
        suscripcionVencida(
          (x.reason as { statusCode?: number } | null)?.statusCode,
        )
      ) {
        resumen.vencidos++;
        vencidos.push(lote[j].endpoint);
      } else resumen.fallidos++;
    });
  }
  if (vencidos.length > 0)
    await db
      .delete(pushSuscripciones)
      .where(inArray(pushSuscripciones.endpoint, vencidos));
  return resumen;
}
