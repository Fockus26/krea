// Presencia en «Editar alumno» (W14, D275, D327): solo profesores. GET → las entradas vigentes;
// POST { accion: "marcar" | "quitar", cedula } → la entrada propia (el profe sale de la sesión, el
// nombre de su perfil y la hora del servidor). Lo usa también `sendBeacon` al cerrar la pestaña.
import { z } from "zod";
import { accesoPresencia } from "@/lib/acceso";
import {
  leerPresencia,
  marcarPresencia,
  quitarPresencia,
} from "@/lib/data/presencia";
import { sesionDeHeaders } from "@/lib/data/sesion";
import { leerUsuario } from "@/lib/data/usuarios";
import { baseDeDatos } from "@/lib/db";
import { zCedula } from "@/lib/modelo";
import { NOMBRE_PRESENCIA_MAX } from "@/lib/presencia";

const zPedido = z.object({
  accion: z.enum(["marcar", "quitar"]),
  cedula: zCedula,
});

async function profe(req: Request) {
  const s = await sesionDeHeaders(req.headers);
  return accesoPresencia(s) === "ok" ? s : null;
}

export async function GET(req: Request) {
  const s = await profe(req);
  if (!s) return Response.json({ error: "sin-sesion" }, { status: 401 });
  const db = baseDeDatos();
  if (!db) return Response.json({ error: "red" }, { status: 503 });
  const ahora = Date.now();
  return Response.json(
    { ahora, entradas: await leerPresencia(db, ahora) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: Request) {
  const s = await profe(req);
  if (!s) return Response.json({ error: "sin-sesion" }, { status: 401 });
  const db = baseDeDatos();
  if (!db) return Response.json({ error: "red" }, { status: 503 });
  const p = zPedido.safeParse(await req.json().catch(() => null));
  if (!p.success) return Response.json({ error: "invalida" }, { status: 400 });
  if (p.data.accion === "quitar") {
    await quitarPresencia(db, p.data.cedula, s.uid);
  } else {
    const yo = await leerUsuario(db, s.uid);
    if (!yo) return Response.json({ error: "sin-sesion" }, { status: 401 });
    const nombre = `${yo.nombres} ${yo.apellidos}`.slice(
      0,
      NOMBRE_PRESENCIA_MAX,
    );
    await marcarPresencia(db, p.data.cedula, s.uid, nombre, Date.now());
  }
  return new Response(null, { status: 204 });
}
