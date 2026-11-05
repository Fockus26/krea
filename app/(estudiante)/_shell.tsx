import { cache } from "react";
import { RouteSideNav, RouteTopBar } from "@/components/layout/route-nav";
import { SincronizarApariencia } from "@/components/layout/sincronizar-apariencia";
import { alumnoActual, tareasDeSeccion } from "@/lib/datos/estudiante";
import { navUsuarioDe, titulosTopbarDe } from "@/lib/vistas-estudiante";

// Partes del shell que dependen de la sesión (D189): cada una va en su `<Suspense>` del layout
// (`cacheComponents`), con el mismo componente sin usuario como reserva.

const shell = cache(async () => {
  const { usuario, seccion } = await alumnoActual();
  const tareas = await tareasDeSeccion(seccion);
  return {
    usuario: navUsuarioDe(usuario),
    titulos: titulosTopbarDe(tareas),
    apariencia: usuario.apariencia ?? null,
  };
});

export async function SideNavSesion() {
  const { usuario } = await shell();
  return <RouteSideNav rol="estudiante" usuario={usuario} />;
}

export async function TopBarSesion() {
  const { usuario, titulos, apariencia } = await shell();
  return (
    <>
      <RouteTopBar rol="estudiante" usuario={usuario} titulos={titulos} />
      <SincronizarApariencia apariencia={apariencia} />
    </>
  );
}
