import { cache } from "react";
import { RouteSideNav, RouteTopBar } from "@/components/layout/route-nav";
import { SincronizarApariencia } from "@/components/layout/sincronizar-apariencia";
import { colaEvaluar, profesorActual, tareasProfe } from "@/lib/datos/profesor";
import { rutaTarea } from "@/lib/tareas-profe";
import { navUsuarioDe } from "@/lib/vistas-estudiante";

// Partes del shell del profesor que dependen de la sesión (D189, W6): cada una va en su
// `<Suspense>` del layout (`cacheComponents`), con el mismo componente sin usuario como reserva.
// El contador de Evaluar sale de la cola real (W7, D204).

const shell = cache(async () => {
  const [{ sesion, usuario }, tareas, cola] = await Promise.all([
    profesorActual(),
    tareasProfe(),
    colaEvaluar(),
  ]);
  return {
    // «Profesores» sale del claim de la sesión, el mismo que exige `exigirAdmin` (D231)
    usuario: usuario
      ? { ...navUsuarioDe(usuario), admin: sesion.admin === true }
      : null,
    apariencia: usuario?.apariencia ?? null,
    porEvaluar: cola.length,
    titulos: {
      // La topbar móvil de una entrega queda en «Evaluar entrega»: la posición («entrega i de n»)
      // depende de los filtros de la URL (D384) y la dice el eyebrow de la pantalla
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
  const { usuario, porEvaluar } = await shell();
  return (
    <RouteSideNav rol="profesor" usuario={usuario} evaluarCount={porEvaluar} />
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
