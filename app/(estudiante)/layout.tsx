import type { Metadata } from "next";
import { type ReactNode, Suspense } from "react";
import { OfflineBanner } from "@/components/estados/offline-banner";
import { AppShell } from "@/components/layout/AppShell";
import {
  RouteBottomNav,
  RouteSideNav,
  RouteTopBar,
} from "@/components/layout/route-nav";
import { TopBarAccionProvider } from "@/components/layout/top-bar-accion";
import { Toaster } from "@/components/ui/sonner";
import type { Rol } from "@/lib/layout";
import { SideNavSesion, TopBarSesion } from "./_shell";

const ROL: Rol = "estudiante";

// Las páginas del estudiante heredan el noindex (D023: solo /ingresar se indexa)
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Shell del estudiante (fase 05): vive en el layout y persiste al navegar. Navegación por ruta
 * (D063), topbar, barra inferior y ancho por `pathname` (D128, D129), un único Toaster (D035,
 * D131). El usuario sale de la sesión (D189): barra lateral y topbar van en su `<Suspense>`
 * (`cacheComponents`) con la misma pieza sin usuario como reserva.
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
        sidebar={
          <Suspense fallback={<RouteSideNav rol={ROL} usuario={null} />}>
            <SideNavSesion />
          </Suspense>
        }
        topbar={
          <Suspense fallback={<RouteTopBar rol={ROL} usuario={null} />}>
            <TopBarSesion />
          </Suspense>
        }
        bottomNav={<RouteBottomNav rol={ROL} />}
      >
        {children}
      </AppShell>
      <OfflineBanner rol={ROL} />
      <Toaster />
    </TopBarAccionProvider>
  );
}
