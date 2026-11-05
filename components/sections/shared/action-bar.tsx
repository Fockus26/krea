import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ActionBarAltura } from "./action-bar-altura";

/**
 * Barra de acción (HANDOFF §4): entregar, guardar nota, publicar. < 1024 pegada abajo
 * (`bottom: 72px` + zona segura sobre la barra inferior; `sinBarraInferior` → 0, como el
 * constructor de tareas), fondo `--bg` 94 %, borde superior, padding 12 16 y márgenes negativos
 * iguales al padding de la página para tocar los bordes. ≥ 1024 estática, sin fondo ni borde.
 */
export function ActionBar({
  children,
  sinBarraInferior = false,
  className,
}: {
  children: ReactNode;
  sinBarraInferior?: boolean;
  className?: string;
}) {
  return (
    <div
      // El toast la detecta (`html:has([data-slot="action-bar"])`) y sube por encima (D131)
      data-slot="action-bar"
      className={cn(
        "sticky z-action-bar -mx-(--page-px) flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-divider bg-bg/94 px-4 py-3",
        "lg:static lg:mx-0 lg:border-t-0 lg:bg-transparent lg:px-0 lg:py-0",
        // Con poca altura la barra inferior no es fija: la acción baja hasta el borde (D218)
        sinBarraInferior ? "bottom-0" : "bottom-action bajo:bottom-0",
        className,
      )}
    >
      {children}
      <ActionBarAltura />
    </div>
  );
}
