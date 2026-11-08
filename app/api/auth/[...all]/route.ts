// Rutas de Better Auth (D327). Por HTTP solo se abren las que usa el navegador (`rutaAuthPublica`):
// lo demás responde 404. Sin base de datos configurada responde 503 (el login muestra «no
// disponible»). El login además pasa por el límite de fallos por cuenta (`lib/data/intentos.ts`).
import { toNextJsHandler } from "better-auth/next-js";
import { rutaAuthPublica } from "@/lib/acceso";
import { authKrea } from "@/lib/better-auth";
import {
  cuentaBloqueada,
  limpiarFallos,
  registrarFallo,
} from "@/lib/data/intentos";
import { baseDeDatos } from "@/lib/db";

const RUTA_INGRESO = "/api/auth/sign-in/email";

const noDisponible = () =>
  Response.json({ message: "no disponible" }, { status: 503 });
const noExiste = () => new Response(null, { status: 404 });

function manejador() {
  const auth = authKrea();
  return auth ? toNextJsHandler(auth) : null;
}

export async function GET(req: Request) {
  if (!rutaAuthPublica("GET", new URL(req.url).pathname)) return noExiste();
  const h = manejador();
  return h ? h.GET(req) : noDisponible();
}

export async function POST(req: Request) {
  const ruta = new URL(req.url).pathname.replace(/\/+$/, "");
  if (!rutaAuthPublica("POST", ruta)) return noExiste();
  const h = manejador();
  const db = baseDeDatos();
  if (!h || !db) return noDisponible();
  if (ruta !== RUTA_INGRESO) return h.POST(req);

  const cuerpo: unknown = await req
    .clone()
    .json()
    .catch(() => null);
  const email =
    cuerpo && typeof cuerpo === "object" && "email" in cuerpo
      ? String(cuerpo.email ?? "")
      : "";
  if (!email) return h.POST(req);
  if (await cuentaBloqueada(db, email, Date.now()))
    return Response.json(
      { code: "TOO_MANY_REQUESTS", message: "Demasiados intentos" },
      { status: 429 },
    );
  const res = await h.POST(req);
  if (res.status === 401) await registrarFallo(db, email, Date.now());
  else if (res.ok) await limpiarFallos(db, email);
  return res;
}
