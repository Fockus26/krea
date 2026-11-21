// Reparto en vivo por sondeo (D465): sustituye a «Actualizar» (D424). Solo un alumno con equipo, y
// solo la huella del reparto de SU equipo actual en esa tarea (el de la sesión): ni respuestas ni
// cédulas. GET `?tarea=<id>` → `{ version }`; con `?desde=` igual a la versión responde 204 sin
// cuerpo, como el ranking y Evaluar.
import type { NextRequest } from "next/server";
import { accesoPartes, ESTADO_HTTP } from "@/lib/acceso";
import { leerVersionPartes } from "@/lib/data/partes";
import { sesionDeHeaders } from "@/lib/data/sesion";
import { baseDeDatos } from "@/lib/db";
import { zIdTarea } from "@/lib/entregas";
import { idEntrega } from "@/lib/modelo";

const sinCache = { "Cache-Control": "no-store" };

export async function GET(req: NextRequest) {
  try {
    const s = await sesionDeHeaders(req.headers);
    const acceso = accesoPartes(s);
    if (acceso !== "ok" || !s?.equipoId) {
      const error = acceso === "ok" ? "prohibido" : acceso;
      return Response.json(
        { error },
        { status: ESTADO_HTTP[error], headers: sinCache },
      );
    }
    const tarea = zIdTarea.safeParse(req.nextUrl.searchParams.get("tarea"));
    if (!tarea.success)
      return Response.json(
        { error: "invalida" },
        { status: 400, headers: sinCache },
      );
    const db = baseDeDatos();
    if (!db)
      return Response.json(
        { error: "red" },
        { status: 503, headers: sinCache },
      );
    const version = await leerVersionPartes(
      db,
      idEntrega(tarea.data, s.equipoId),
    );
    if (req.nextUrl.searchParams.get("desde") === version)
      return new Response(null, { status: 204, headers: sinCache });
    return Response.json({ version }, { headers: sinCache });
  } catch (e) {
    // Base caída o tiempo agotado: el sondeo lo cuenta como un fallo pasajero (D437)
    console.error("[api/partes]", e instanceof Error ? e.message : e);
    return Response.json({ error: "red" }, { status: 503, headers: sinCache });
  }
}
