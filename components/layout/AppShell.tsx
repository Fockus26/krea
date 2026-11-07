import type { ReactNode } from "react";
import { RouteMain } from "@/components/layout/route-nav";
import { type Ancho, mainClass, type Rol } from "@/lib/layout";

// Esqueleto de la app (HANDOFF §2.7 y §4): barra lateral ≥ lg; topbar y barra inferior < lg.
// Cada slot vacío no pinta su landmark. El `<main id="contenido">` es el destino del skip link
// del layout raíz. No hay <footer>: el diseño no tiene pie.
// En un layout de grupo (fase 05) el shell no sabe qué página monta: `anchoPorRuta` elige el
// ancho por `pathname` en el cliente (`RouteMain`, D129) en lugar de `width`; y si la ruta no
// lleva barra inferior, `RouteBottomNav` deja `[data-sin-barra-inferior]` y el `<nav>` se esconde
// (D131).
type AppShellProps = {
  role: Rol;
  width?: Ancho;
  /** Ancho según la ruta (layouts de grupo); ignora `width`. */
  anchoPorRuta?: boolean;
  sidebar?: ReactNode;
  topbar?: ReactNode;
  bottomNav?: ReactNode;
  children: ReactNode;
};

export function AppShell({
  role,
  width = "default",
  anchoPorRuta = false,
  sidebar,
  topbar,
  bottomNav,
  children,
}: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row" data-role={role}>
      {sidebar ? (
        <div className="hidden shrink-0 self-start lg:sticky lg:top-0 lg:block">
          <nav
            aria-label="Principal"
            className="h-screen-side w-side overflow-y-auto border-r border-divider bg-surface px-4 py-6"
          >
            {sidebar}
          </nav>
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        {topbar ? (
          <header className="@container h-topbar sticky top-0 z-topbar flex items-center gap-3 border-b border-divider bg-topbar px-(--page-px) bajo:static lg:hidden">
            {topbar}
          </header>
        ) : null}
        {anchoPorRuta ? (
          <RouteMain rol={role}>{children}</RouteMain>
        ) : (
          <main id="contenido" tabIndex={-1} className={mainClass(role, width)}>
            {children}
          </main>
        )}
        {/* En flujo y sticky: reserva sola los 72 px + zona segura al final del contenido */}
        {bottomNav ? (
          <nav
            aria-label="Principal"
            className="h-bnav shadow-bnav sticky bottom-0 z-topbar grid grid-cols-5 border-t border-divider bg-surface px-1 has-data-sin-barra-inferior:hidden bajo:static lg:hidden"
          >
            {bottomNav}
          </nav>
        ) : null}
      </div>
    </div>
  );
}
