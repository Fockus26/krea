import type { ReactNode } from "react";
import { type Ancho, containerClass, type Rol } from "@/lib/layout";

// Esqueleto de la app (HANDOFF §2.7 y §4): barra lateral ≥ lg; topbar y barra inferior < lg.
// Sin contenido de navegación todavía (ítems, íconos y tarjeta de usuario llegan con las fases
// 03–04): cada slot vacío no pinta su landmark. El `<main id="contenido">` es el destino del
// skip link del layout raíz. No hay <footer>: el diseño no tiene pie.
type AppShellProps = {
  role: Rol;
  width?: Ancho;
  sidebar?: ReactNode;
  topbar?: ReactNode;
  bottomNav?: ReactNode;
  children: ReactNode;
};

export function AppShell({
  role,
  width = "default",
  sidebar,
  topbar,
  bottomNav,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-dvh lg:flex" data-role={role}>
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
          <header className="h-topbar sticky top-0 z-topbar flex items-center gap-3 border-b border-divider bg-topbar px-(--page-px) lg:hidden">
            {topbar}
          </header>
        ) : null}
        <main
          id="contenido"
          tabIndex={-1}
          className={`${containerClass(role, width)} page-pad page-stack flex-1`}
        >
          {children}
        </main>
        {/* En flujo y sticky: reserva sola los 72 px + zona segura al final del contenido */}
        {bottomNav ? (
          <nav
            aria-label="Principal"
            className="h-bnav shadow-bnav sticky bottom-0 z-topbar grid grid-cols-5 border-t border-divider bg-surface px-1 lg:hidden"
          >
            {bottomNav}
          </nav>
        ) : null}
      </div>
    </div>
  );
}
