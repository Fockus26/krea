import type { ReactNode } from "react";

/**
 * Grupo de Ingresar y Recuperar (fase 05, D134): pantallas sin la app alrededor (sin navegación
 * ni Toaster: los errores salen en línea). Solo pone el `<main id="contenido">` al que apunta el
 * enlace "Saltar al contenido"; el marco de dos columnas es `AuthLayout`, que pinta cada página.
 * No fija `robots`: cada página decide (`/ingresar` se indexa, D023; el resto no).
 */
export default function AuthGrupoLayout({ children }: { children: ReactNode }) {
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
