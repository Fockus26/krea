// Proxy (Next 16): comprobación de sesión y rol en cada ruta protegida (D180, D181). La sesión de
// Better Auth se valida contra la base (D327); el DAL vuelve a preguntar cerca de los datos.
import { type NextRequest, NextResponse } from "next/server";
import { sesionDeHeaders } from "@/lib/data/sesion";
import { accesoDeRuta, redireccion } from "@/lib/sesion";

export async function proxy(req: NextRequest) {
  const ruta = req.nextUrl.pathname;
  // Solo se redirige la navegación. Un POST es una Server Action (p. ej. `confirmarIngreso` en
  // /ingresar justo después del login): redirigirla rompe su respuesta, y cada acción ya
  // comprueba la sesión con el DAL.
  if (req.method !== "GET" && req.method !== "HEAD") return NextResponse.next();
  if (accesoDeRuta(ruta) === null) return NextResponse.next();
  const sesion = await sesionDeHeaders(req.headers);
  const destino = redireccion(ruta, sesion);
  if (!destino) return NextResponse.next();
  return NextResponse.redirect(new URL(destino, req.nextUrl));
}

export const config = {
  // Todo menos los archivos de Next, la API y los estáticos con extensión (iconos, imágenes, manifest).
  matcher: ["/((?!_next/static|_next/image|api/|.*\\.[a-zA-Z0-9]+$).*)"],
};
