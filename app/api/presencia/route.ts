// Presencia en «Editar alumno» (W14, D275, D327) y en «Evaluar entrega» (D408–D410): solo
// profesores. GET → las entradas vigentes de los alumnos; GET ?entrega=<id> → solo las de esa
// entrega. POST { accion: "marcar" | "quitar", cedula } o { accion, entrega } → la entrada propia
// (el profe sale de la sesión, el nombre de su perfil y la hora del servidor). Lo usa también
// `sendBeacon` al cerrar la pestaña.
import { accesoPresencia } from "@/lib/acceso";
import {
  leerPresencia,
  leerPresenciaEntrega,
  marcarPresencia,
  quitarPresencia,
} from "@/lib/data/presencia";
import { sesionDeHeaders } from "@/lib/data/sesion";
import { leerUsuario } from "@/lib/data/usuarios";
import { baseDeDatos } from "@/lib/db";
import {
  claveDePedido,
  NOMBRE_PRESENCIA_MAX,
  zIdEntrega,
  zPedidoPresencia,
} from "@/lib/presencia";

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
  const sinCache = { headers: { "Cache-Control": "no-store" } };
  const entrega = new URL(req.url).searchParams.get("entrega");
  if (entrega === null)
    return Response.json(
      { ahora, entradas: await leerPresencia(db, ahora) },
      sinCache,
    );
  const id = zIdEntrega.safeParse(entrega);
  if (!id.success) return Response.json({ error: "invalida" }, { status: 400 });
  return Response.json(
    { ahora, entradas: await leerPresenciaEntrega(db, id.data, ahora) },
    sinCache,
  );
}

export async function POST(req: Request) {
  const s = await profe(req);
  if (!s) return Response.json({ error: "sin-sesion" }, { status: 401 });
  const db = baseDeDatos();
  if (!db) return Response.json({ error: "red" }, { status: 503 });
  const p = zPedidoPresencia.safeParse(await req.json().catch(() => null));
  if (!p.success) return Response.json({ error: "invalida" }, { status: 400 });
  const clave = claveDePedido(p.data);
  if (p.data.accion === "quitar") {
    await quitarPresencia(db, clave, s.uid);
  } else {
    const yo = await leerUsuario(db, s.uid);
    if (!yo) return Response.json({ error: "sin-sesion" }, { status: 401 });
    const nombre = `${yo.nombres} ${yo.apellidos}`.slice(
      0,
      NOMBRE_PRESENCIA_MAX,
    );
    await marcarPresencia(db, clave, s.uid, nombre, Date.now());
  }
  return new Response(null, { status: 204 });
}
