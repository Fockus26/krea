// Ranking en vivo por sondeo (D011, D190, D327): el ranking de una sección para el profe o para un
// alumno de ESA sección (lo que decían las reglas de `ranking/{seccion}`). Con `?desde=<ms>` igual a
// la versión guardada responde 204 sin cuerpo: el sondeo cada pocos segundos casi no pesa. Al
// alumno, las filas con el id público y nunca la cédula de sus compañeros (D494); al profe, con
// la cédula (enlaza cada fila a Alumnos).
import type { NextRequest } from "next/server";
import { accesoRanking, ESTADO_HTTP } from "@/lib/acceso";
import { leerRanking } from "@/lib/data/ranking";
import { sesionDeHeaders } from "@/lib/data/sesion";
import { idPublico } from "@/lib/datos/id-publico";
import { baseDeDatos } from "@/lib/db";
import { rankingPublico } from "@/lib/id-publico";

const sinCache = { "Cache-Control": "no-store" };

export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/ranking/[seccion]">,
) {
  const { seccion } = await ctx.params;
  try {
    const sesion = await sesionDeHeaders(req.headers);
    const acceso = accesoRanking(sesion, seccion);
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
    return Response.json(
      sesion?.rol === "profesor" ? r : rankingPublico(r, idPublico),
      { headers: sinCache },
    );
  } catch (e) {
    // Base caída, sin permiso o tiempo agotado: el sondeo lo cuenta como un fallo pasajero (D437)
    console.error("[api/ranking]", e instanceof Error ? e.message : e);
    return Response.json({ error: "red" }, { status: 503, headers: sinCache });
  }
}
