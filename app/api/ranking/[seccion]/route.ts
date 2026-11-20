// Ranking en vivo por sondeo (D011, D190, D327): el ranking de una sección para el profe o para un
// alumno de ESA sección (lo que decían las reglas de `ranking/{seccion}`). Con `?desde=<ms>` igual a
// la versión guardada responde 204 sin cuerpo: el sondeo cada pocos segundos casi no pesa.
import type { NextRequest } from "next/server";
import { accesoRanking, ESTADO_HTTP } from "@/lib/acceso";
import { leerRanking } from "@/lib/data/ranking";
import { sesionDeHeaders } from "@/lib/data/sesion";
import { baseDeDatos } from "@/lib/db";

const sinCache = { "Cache-Control": "no-store" };

export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/ranking/[seccion]">,
) {
  const { seccion } = await ctx.params;
  try {
    const acceso = accesoRanking(await sesionDeHeaders(req.headers), seccion);
    if (acceso !== "ok")
      return Response.json(
        { error: acceso },
        { status: ESTADO_HTTP[acceso], headers: sinCache },
      );
    const db = baseDeDatos();
    if (!db)
      return Response.json(
        { error: "red" },
        { status: 503, headers: sinCache },
      );
    const r = await leerRanking(db, seccion);
    if (!r)
      return Response.json(
        { error: "sin-ranking" },
        { status: 404, headers: sinCache },
      );
    const desde = Number(req.nextUrl.searchParams.get("desde"));
    if (desde === r.actualizadoEn)
      return new Response(null, { status: 204, headers: sinCache });
    return Response.json(r, { headers: sinCache });
  } catch (e) {
    // Base caída, sin permiso o tiempo agotado: el sondeo lo cuenta como un fallo pasajero (D437)
    console.error("[api/ranking]", e instanceof Error ? e.message : e);
    return Response.json({ error: "red" }, { status: 503, headers: sinCache });
  }
}
