// Lo que responde `/api/partes/version` (D465, D547), fuera del archivo de la ruta para probarlo
// sobre PGlite. Solo un alumno con equipo, y solo la huella de SU equipo actual en esa tarea (el de
// la sesión): ni respuestas ni cédulas. Con `?borrador=1` la huella suma la versión del borrador
// compartido del capitán. Con `?desde=` igual a la versión, 204 sin cuerpo.
import { accesoPartes, ESTADO_HTTP } from "@/lib/acceso";
import { huellaConBorrador } from "@/lib/borrador-grupal";
import { leerVersionBorrador } from "@/lib/data/borrador-grupal";
import { leerVersionPartes } from "@/lib/data/partes";
import type { Tx } from "@/lib/db";
import { zIdTarea } from "@/lib/entregas";
import { idEntrega } from "@/lib/modelo";
import type { Sesion } from "@/lib/sesion";

const sinCache = { "Cache-Control": "no-store" };

export async function respuestaVersionPartes(
  s: Sesion | null,
  params: URLSearchParams,
  db: Tx | null,
): Promise<Response> {
  const acceso = accesoPartes(s);
  if (acceso !== "ok" || !s?.equipoId) {
    const error = acceso === "ok" ? "prohibido" : acceso;
    return Response.json(
      { error },
      { status: ESTADO_HTTP[error], headers: sinCache },
    );
  }
  const tarea = zIdTarea.safeParse(params.get("tarea"));
  if (!tarea.success)
    return Response.json(
      { error: "invalida" },
      { status: 400, headers: sinCache },
    );
  if (!db)
    return Response.json({ error: "red" }, { status: 503, headers: sinCache });
  const entregaId = idEntrega(tarea.data, s.equipoId);
  const partes = await leerVersionPartes(db, entregaId);
  const version =
    params.get("borrador") === "1"
      ? huellaConBorrador(partes, await leerVersionBorrador(db, entregaId))
      : partes;
  if (params.get("desde") === version)
    return new Response(null, { status: 204, headers: sinCache });
  return Response.json({ version }, { headers: sinCache });
}
