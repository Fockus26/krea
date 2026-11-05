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
import { COLA } from "@/lib/demo/evaluar";
import { titulosEvaluarDemo } from "@/lib/demo/topbar";
import type { Rol } from "@/lib/layout";
import { SideNavSesion, TopBarSesion } from "./_shell";

const ROL: Rol = "profesor";

// Las páginas del profesor heredan el noindex (D023: solo /ingresar se indexa)
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Shell del profesor (fase 05): como el del estudiante (D128, D129, D131). El usuario sale de la
 * sesión (W6, como D189): barra lateral y topbar van en su `<Suspense>` (`cacheComponents`) con la
 * misma pieza sin usuario como reserva. El contador de Evaluar sigue con la cola de ejemplo
 * (`lib/demo/evaluar.ts`) hasta W7.
 */
export default function ProfesorLayout({ children }: { children: ReactNode }) {
  return (
    <TopBarAccionProvider>
      <AppShell
        role={ROL}
        anchoPorRuta
        sidebar={
          <Suspense
            fallback={
              <RouteSideNav
                rol={ROL}
                usuario={null}
                evaluarCount={COLA.length}
              />
            }
          >
            <SideNavSesion />
          </Suspense>
        }
        topbar={
          <Suspense
            fallback={
              <RouteTopBar
                rol={ROL}
                usuario={null}
                titulos={titulosEvaluarDemo()}
                salirHref="/salir"
              />
            }
          >
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
