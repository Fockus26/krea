import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  RouteBottomNav,
  RouteSideNav,
  RouteTopBar,
} from "@/components/layout/route-nav";
import { TopBarAccionProvider } from "@/components/layout/top-bar-accion";
import { Toaster } from "@/components/ui/sonner";
import { titulosTopbar } from "@/lib/demo/topbar";
import { USUARIO_ESTUDIANTE } from "@/lib/demo/usuarios";
import type { Rol } from "@/lib/layout";

const ROL: Rol = "estudiante";

// Las páginas del estudiante heredan el noindex (D023: solo /ingresar se indexa)
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Shell del estudiante (fase 05): vive en el layout y persiste al navegar. Navegación por ruta
 * (D063), topbar, barra inferior y ancho por `pathname` (D128, D129), un único Toaster (D035,
 * D131). Usuario de ejemplo hasta la fase 07 (sin sesión ni cookies).
 */
export default function EstudianteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <TopBarAccionProvider>
      <AppShell
        role={ROL}
        anchoPorRuta
        sidebar={<RouteSideNav rol={ROL} usuario={USUARIO_ESTUDIANTE} />}
        topbar={
          <RouteTopBar
            rol={ROL}
            usuario={USUARIO_ESTUDIANTE}
            titulos={titulosTopbar(ROL)}
          />
        }
        bottomNav={<RouteBottomNav rol={ROL} />}
      >
        {children}
      </AppShell>
      <Toaster />
    </TopBarAccionProvider>
  );
}
