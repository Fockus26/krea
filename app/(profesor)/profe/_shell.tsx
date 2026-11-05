import { cache } from "react";
import { RouteSideNav, RouteTopBar } from "@/components/layout/route-nav";
import { SincronizarApariencia } from "@/components/layout/sincronizar-apariencia";
import { profesorActual, tareasProfe } from "@/lib/datos/profesor";
import { COLA } from "@/lib/demo/evaluar";
import { titulosEvaluarDemo } from "@/lib/demo/topbar";
import { rutaTarea } from "@/lib/tareas-profe";
import { navUsuarioDe } from "@/lib/vistas-estudiante";

// Partes del shell del profesor que dependen de la sesión (D189, W6): cada una va en su
// `<Suspense>` del layout (`cacheComponents`), con el mismo componente sin usuario como reserva.
// Evaluar (contador y títulos) sigue con la cola de ejemplo hasta W7.

const shell = cache(async () => {
  const [{ usuario }, tareas] = await Promise.all([
    profesorActual(),
    tareasProfe(),
  ]);
  return {
    usuario: usuario ? navUsuarioDe(usuario) : null,
    apariencia: usuario?.apariencia ?? null,
    titulos: {
      ...titulosEvaluarDemo(),
      // Constructor de una tarea publicada: su título; el borrador queda con «Nueva tarea» (D152)
      ...Object.fromEntries(
        tareas
          .filter((t) => t.estado !== "borrador")
          .map((t) => [rutaTarea(t.id), t.titulo]),
      ),
    },
  };
});

export async function SideNavSesion() {
  const { usuario } = await shell();
  return (
    <RouteSideNav rol="profesor" usuario={usuario} evaluarCount={COLA.length} />
  );
}

export async function TopBarSesion() {
  const { usuario, titulos, apariencia } = await shell();
  return (
    <>
      <RouteTopBar
        rol="profesor"
        usuario={usuario}
        titulos={titulos}
        salirHref="/salir"
      />
      <SincronizarApariencia apariencia={apariencia} />
    </>
  );
}
