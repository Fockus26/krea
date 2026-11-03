// Proxy (Next 16): comprobación rápida de sesión y rol en cada ruta protegida (D180, D181). Verifica
// la firma de la cookie sin consultar revocación (eso lo hace el DAL, cerca de los datos).
import { type NextRequest, NextResponse } from "next/server";
import { sesionDeCookie } from "@/lib/firebase/sesion-servidor";
import { accesoDeRuta, COOKIE_SESION, redireccion } from "@/lib/sesion";

export async function proxy(req: NextRequest) {
  const ruta = req.nextUrl.pathname;
  if (accesoDeRuta(ruta) === null) return NextResponse.next();
  const sesion = await sesionDeCookie(req.cookies.get(COOKIE_SESION)?.value, {
    revocadas: false,
  });
  const destino = redireccion(ruta, sesion);
  if (!destino) return NextResponse.next();
  const res = NextResponse.redirect(new URL(destino, req.nextUrl));
  // Cookie inválida o vencida: se borra para no volver a verificarla en cada request.
  if (!sesion && req.cookies.has(COOKIE_SESION))
    res.cookies.delete(COOKIE_SESION);
  return res;
}

export const config = {
  // Todo menos los archivos de Next y los estáticos con extensión (iconos, imágenes, manifest).
  matcher: ["/((?!_next/static|_next/image|api/|.*\\.[a-zA-Z0-9]+$).*)"],
};
