// Reparto en vivo por sondeo (D465) y borrador compartido del capitán (D547): solo un alumno con
// equipo, y solo la huella de SU equipo actual en esa tarea (el de la sesión): ni respuestas ni
// cédulas. GET `?tarea=<id>[&borrador=1]` → `{ version }`; con `?desde=` igual a la versión
// responde 204 sin cuerpo, como el ranking y Evaluar. La respuesta la arma `respuestaVersionPartes`.
import type { NextRequest } from "next/server";
import { sesionDeHeaders } from "@/lib/data/sesion";
import { respuestaVersionPartes } from "@/lib/data/version-partes";
import { baseDeDatos } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const s = await sesionDeHeaders(req.headers);
    return await respuestaVersionPartes(
      s,
      req.nextUrl.searchParams,
      baseDeDatos(),
    );
  } catch (e) {
    // Base caída o tiempo agotado: el sondeo lo cuenta como un fallo pasajero (D437)
    console.error("[api/partes]", e instanceof Error ? e.message : e);
    return Response.json(
      { error: "red" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
