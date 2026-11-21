// Suscripciones Web Push y envío del aviso de tarea nueva (D335–D340) sobre Postgres. Sin
// `server-only` para que las pruebas corran sobre PGlite; la app lo usa desde lib/acciones/push.ts
// (después de `exigirSesion("estudiante")`) y desde el `after()` de publicar una tarea. El envío
// llega inyectado (`Enviar`): las pruebas no tocan la red.
//
// Nunca se registran endpoints ni cédulas: solo conteos y códigos.
import { and, eq, inArray } from "drizzle-orm";
import { type Db, enSerie } from "@/lib/db";
import {
  equipos,
  partes,
  pushSuscripciones,
  tareas,
  usuarios,
} from "@/lib/db/schema";
import {
  type AvisoPush,
  avisoParteEntregada,
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
  return enviarAviso(
    db,
    await destinatarios(db, tarea.secciones),
    avisoTareaNueva(tarea),
    enviar,
  );
}

/** Las suscripciones de una persona (un navegador cada una). */
export async function destinosDe(db: Db, cedula: string): Promise<Destino[]> {
  return db
    .select({
      endpoint: pushSuscripciones.endpoint,
      p256dh: pushSuscripciones.p256dh,
      auth: pushSuscripciones.auth,
    })
    .from(pushSuscripciones)
    .where(eq(pushSuscripciones.cedula, cedula));
}

/**
 * Tras el commit de «entregar parte» (D535): avisa al capitán del equipo del integrante. Devuelve
 * `null` si no hay a quién (la parte ya no está entregada por este alumno, sin equipo o sin
 * capitán, el capitán es quien entrega) y, si no, el resumen del envío. Sin preferencia por tipo
 * de aviso (D536): avisa a quien ya tenga el aviso activado en algún navegador.
 */
export async function avisarParteEntregada(
  db: Db,
  entrada: { uid: string; tareaId: string; preguntaId: string },
  enviar: Enviar,
): Promise<ResumenAviso | null> {
  const { uid, tareaId, preguntaId } = entrada;
  const [[yo], [tarea], [parte]] = await enSerie([
    db
      .select({
        nombres: usuarios.nombres,
        apellidos: usuarios.apellidos,
        equipoId: usuarios.equipoId,
      })
      .from(usuarios)
      .where(eq(usuarios.cedula, uid)),
    db
      .select({ titulo: tareas.titulo, preguntas: tareas.preguntas })
      .from(tareas)
      .where(eq(tareas.id, tareaId)),
    db
      .select({ estado: partes.estado })
      .from(partes)
      .where(
        and(
          eq(partes.tareaId, tareaId),
          eq(partes.preguntaId, preguntaId),
          eq(partes.asignado, uid),
          eq(partes.estado, "entregada"),
        ),
      ),
  ]);
  if (!yo?.equipoId || !tarea || !parte) return null;
  const [equipo] = await db
    .select({ capitanId: equipos.capitanId })
    .from(equipos)
    .where(eq(equipos.id, yo.equipoId));
  const capitan = equipo?.capitanId;
  if (!capitan || capitan === uid) return null;
  const indice = tarea.preguntas.findIndex(
    (p) => (p as { id?: unknown } | null)?.id === preguntaId,
  );
  if (indice < 0) return null;
  const aviso = avisoParteEntregada({
    tareaId,
    preguntaId,
    tituloTarea: tarea.titulo,
    numero: indice + 1,
    integrante: yo,
  });
  return enviarAviso(db, await destinosDe(db, capitan), aviso, enviar);
}

async function enviarAviso(
  db: Db,
  todos: readonly Destino[],
  aviso: AvisoPush,
  enviar: Enviar,
): Promise<ResumenAviso> {
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
