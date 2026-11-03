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
import { COLA } from "@/lib/demo/evaluar";
import { titulosTopbar } from "@/lib/demo/topbar";
import { USUARIO_PROFESOR } from "@/lib/demo/usuarios";
import type { Rol } from "@/lib/layout";

const ROL: Rol = "profesor";

// Las páginas del profesor heredan el noindex (D023: solo /ingresar se indexa)
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Shell del profesor (fase 05): como el del estudiante (D128, D129, D131), con el contador de
 * Evaluar = entregas en la cola de ejemplo (`lib/demo/evaluar.ts`; fase 07: Firestore).
 */
export default function ProfesorLayout({ children }: { children: ReactNode }) {
  return (
    <TopBarAccionProvider>
      <AppShell
        role={ROL}
        anchoPorRuta
        sidebar={
          <RouteSideNav
            rol={ROL}
            usuario={USUARIO_PROFESOR}
            evaluarCount={COLA.length}
          />
        }
        topbar={
          <RouteTopBar
            rol={ROL}
            usuario={USUARIO_PROFESOR}
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
