// Rutas de Better Auth (D327). Por HTTP solo se abren las que usa el navegador (`rutaAuthPublica`):
// lo demás responde 404. Sin base de datos configurada responde 503 (el login muestra «no
// disponible»). El login además pasa por el límite de fallos por cuenta (`lib/limite-ingreso.ts`):
// la misma `ruta` decide qué es público y qué se limita, así que no hay otra forma de escribir la
// ruta de ingreso que llegue a Better Auth sin pasar por el límite.
import { toNextJsHandler } from "better-auth/next-js";
import { rutaAuthPublica } from "@/lib/acceso";
import { authKrea } from "@/lib/better-auth";
import { baseDeDatos } from "@/lib/db";
import { ingresarConLimite } from "@/lib/limite-ingreso";

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
  return ingresarConLimite(db, req, h.POST);
}
