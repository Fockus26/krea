// Rutas de Better Auth (D327): /api/auth/sign-in/email, /sign-out, /get-session… Sin base de datos
// configurada responde 503 (el login muestra «no disponible»).
import { toNextJsHandler } from "better-auth/next-js";
import { authKrea } from "@/lib/better-auth";

const noDisponible = () =>
  Response.json({ message: "no disponible" }, { status: 503 });

function manejador() {
  const auth = authKrea();
  return auth ? toNextJsHandler(auth) : null;
}

export async function GET(req: Request) {
  const h = manejador();
  return h ? h.GET(req) : noDisponible();
}

export async function POST(req: Request) {
  const h = manejador();
  return h ? h.POST(req) : noDisponible();
}
