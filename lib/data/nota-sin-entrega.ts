// Poner nota sin entrega sobre Postgres (`lib/nota-sin-entrega`, D581). Sin `server-only` para que
// las pruebas lo corran sobre PGlite; la app lo usa solo desde lib/acciones/nota-sin-entrega.ts,
// después de `exigirSesion("profesor")` (el autor sale de la sesión).
//
// Bloqueos en el orden de eliminar una tarea: primero la tarea (`FOR UPDATE`, la misma fila que
// bloquea el envío del alumno, así un envío y esta nota no se cruzan) y luego la sección
// (`leerSeccion`). Cambia puntos: la entrega y el ranking se escriben en la MISMA transacción (D175).
import { and, eq } from "drizzle-orm";
import { entregaDeFila, filaDeEntrega, tareaDeFila } from "@/lib/data/filas";
import { conEntrega, escribirRanking, leerSeccion } from "@/lib/data/ranking";
import type { Db } from "@/lib/db";
import { entregas, equipos, tareas, usuarios } from "@/lib/db/schema";
import { yaEnviada } from "@/lib/entregas";
import {
  type Entrega,
  idEntrega,
  type SeccionId,
  zEntrega,
} from "@/lib/modelo";
import type {
  PonerNotaSinEntrega,
  ResultadoNotaSinEntrega,
} from "@/lib/nota-sin-entrega";

/**
 * Crea la entrega `tareaId__titularId` ya evaluada, sin respuestas ni puntaje por pregunta
 * (`puntos: null`), con la base vigente de cada integrante (D403). Individual: el alumno de una
 * sección de la tarea. Grupal: el equipo de una sección de la tarea y sus integrantes de hoy (foto
 * fija, como al enviar, D221). Si ya hay una entrega enviada o evaluada, no la pisa: se corrige
 * desde Evaluar.
 */
export async function ponerNotaSinEntregaEnTransaccion(
  db: Db,
  autorId: string,
  { tareaId, titularId, puntaje }: PonerNotaSinEntrega,
  ahora: number,
): Promise<ResultadoNotaSinEntrega> {
  return db.transaction(async (tx): Promise<ResultadoNotaSinEntrega> => {
    const [ft] = await tx
      .select()
      .from(tareas)
      .where(eq(tareas.id, tareaId))
      .for("update");
    const t = ft ? tareaDeFila(ft) : null;
    if (!t || t.estado === "borrador") return { ok: false, error: "sin-tarea" };

    let seccion: SeccionId;
    let integrantes: string[];
    if (t.tipo === "grupal") {
      const [eq0] = await tx
        .select({ seccion: equipos.seccion })
        .from(equipos)
        .where(eq(equipos.id, titularId));
      if (!eq0) return { ok: false, error: "no-existe" };
      seccion = eq0.seccion as SeccionId;
      const miembros = await tx
        .select({ cedula: usuarios.cedula })
        .from(usuarios)
        .where(
          and(eq(usuarios.equipoId, titularId), eq(usuarios.rol, "estudiante")),
        );
      integrantes = miembros.map((m) => m.cedula).sort();
    } else {
      const [u] = await tx
        .select({ rol: usuarios.rol, seccion: usuarios.seccion })
        .from(usuarios)
        .where(eq(usuarios.cedula, titularId));
      if (!u || u.rol !== "estudiante" || u.seccion === null)
        return { ok: false, error: "no-existe" };
      seccion = u.seccion as SeccionId;
      integrantes = [titularId];
    }
    if (!t.secciones.includes(seccion))
      return { ok: false, error: "no-existe" };
    if (integrantes.length === 0)
      return { ok: false, error: "sin-integrantes" };

    const datos = await leerSeccion(tx, seccion);
    const id = idEntrega(tareaId, titularId);
    const [fe] = await tx
      .select()
      .from(entregas)
      .where(eq(entregas.id, id))
      .for("update");
    if (fe) {
      const previa = entregaDeFila(fe);
      // Enviada, evaluada o una fila que no valida: no se pisa
      if (!previa || yaEnviada(previa))
        return { ok: false, error: "ya-entregada" };
    }

    // La base de esta tarea (D403): la vigente de cada integrante al poner la nota
    const bases: Record<string, number> = {};
    for (const c of integrantes) {
      const u = datos.usuarios.find((x) => x.cedula === c);
      if (u) bases[c] = u.base;
    }
    const nueva: Entrega = {
      tareaId,
      tipo: t.tipo,
      titularId,
      seccion,
      integrantes,
      estado: "evaluada",
      respuestas: {},
      enviadaPor: null,
      enviadaEn: null,
      evaluacion: {
        puntos: null,
        comentarios: {},
        puntaje,
        evaluadaPor: autorId,
        evaluadaEn: ahora,
        bases,
      },
    };
    const doc = zEntrega.safeParse(nueva);
    if (!doc.success) return { ok: false, error: "invalida" };
    const fila = filaDeEntrega(id, doc.data);
    await tx
      .insert(entregas)
      .values(fila)
      .onConflictDoUpdate({ target: entregas.id, set: fila });
    await escribirRanking(
      tx,
      seccion,
      conEntrega(datos, { id, ...doc.data }),
      ahora,
    );
    return { ok: true };
  });
}
