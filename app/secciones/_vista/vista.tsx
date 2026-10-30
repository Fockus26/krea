import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SideNav } from "@/components/layout/side-nav";
import { TopBar } from "@/components/layout/top-bar";
import { USUARIO_ESTUDIANTE, USUARIO_PROFESOR } from "@/lib/demo/usuarios";
import type { Ancho, Rol } from "@/lib/layout";

/**
 * Vista previa de una pantalla (D066): el `AppShell` del rol con su navegación, marcando activa
 * la ruta real que tendrá la pantalla en la fase 05 (`ruta`), no la de /secciones.
 */
export function Vista({
  rol,
  ruta,
  width,
  title,
  volverHref,
  sinNavegacion = false,
  children,
}: {
  rol: Rol;
  ruta: string;
  width?: Ancho;
  /** Título de la topbar en pantallas de detalle (con `volverHref`). */
  title?: string;
  volverHref?: string;
  /** Pantallas sin la app alrededor (Ingresar, Recuperar). */
  sinNavegacion?: boolean;
  children: ReactNode;
}) {
  if (sinNavegacion) {
    return (
      <main
        id="contenido"
        tabIndex={-1}
        className="flex min-h-dvh flex-1 flex-col"
      >
        {children}
      </main>
    );
  }
  const usuario = rol === "profesor" ? USUARIO_PROFESOR : USUARIO_ESTUDIANTE;
  return (
    <AppShell
      role={rol}
      width={width}
      sidebar={
        <SideNav
          rol={rol}
          pathname={ruta}
          usuario={usuario}
          evaluarCount={rol === "profesor" ? 7 : undefined}
        />
      }
      topbar={
        <TopBar
          rol={rol}
          pathname={ruta}
          usuario={usuario}
          title={title}
          volverHref={volverHref}
        />
      }
      bottomNav={<BottomNav rol={rol} pathname={ruta} />}
    >
      {children}
    </AppShell>
  );
}
