// Evaluar en vivo por sondeo (D441, D443): solo profesores (el mismo control que `/api/presencia`).
// GET → `{ version, porEvaluar }`: la huella de la cola y el contador del menú. Con
// `?entrega=<id>` suma el estado de esa entrega (quién la evaluó, por nombre: nunca la cédula,
// D380). Con `?desde=` igual a la versión responde 204 sin cuerpo, como el ranking.
import { accesoPresencia } from "@/lib/acceso";
import { leerEstadoEntrega, leerVersionCola } from "@/lib/data/cola-evaluar";
import { sesionDeHeaders } from "@/lib/data/sesion";
import { leerUsuario } from "@/lib/data/usuarios";
import { baseDeDatos } from "@/lib/db";
import type { EntregaVivo, VersionEvaluar } from "@/lib/evaluar-vivo";
import { nombrePresencia, zIdEntrega } from "@/lib/presencia";

const sinCache = { "Cache-Control": "no-store" };

export async function GET(req: Request) {
  const s = await sesionDeHeaders(req.headers);
  if (accesoPresencia(s) !== "ok" || !s)
    return Response.json(
      { error: "sin-sesion" },
      { status: 401, headers: sinCache },
    );
  const db = baseDeDatos();
  if (!db)
    return Response.json({ error: "red" }, { status: 503, headers: sinCache });
  const params = new URL(req.url).searchParams;
  const pedida = params.get("entrega");
  const id = pedida === null ? null : zIdEntrega.safeParse(pedida);
  if (id && !id.success)
    return Response.json(
      { error: "invalida" },
      { status: 400, headers: sinCache },
    );

  const { version, porEvaluar } = await leerVersionCola(db);
  // La huella cubre también la entrega abierta: si no cambió nada, tampoco ella
  if (params.get("desde") === version)
    return new Response(null, { status: 204, headers: sinCache });

  const cuerpo: VersionEvaluar = { version, porEvaluar };
  if (id?.success) {
    const e = await leerEstadoEntrega(db, id.data);
    let entrega: EntregaVivo | null = null;
    if (e) {
      const autor = e.evaluadaPor ? await leerUsuario(db, e.evaluadaPor) : null;
      entrega = {
        estado: e.estado,
        evaluadaEn: e.evaluadaEn,
        por: autor ? nombrePresencia(autor) : null,
        porMi: e.evaluadaPor !== null && e.evaluadaPor === s.uid,
      };
    }
    cuerpo.entrega = entrega;
  }
  return Response.json(cuerpo, { headers: sinCache });
}
