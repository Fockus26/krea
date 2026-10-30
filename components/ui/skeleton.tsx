import { cn } from "@/lib/utils";

/*
 * Skeleton — HANDOFF §2.14. Bloque decorativo (`aria-hidden`): el contenedor que los agrupa
 * lleva `aria-busy="true"` + `aria-label` ("Cargando notas"). Pulso quieto con reduced motion (D027).
 * Radio 10 por defecto; pasa `rounded-*` con el de la pieza real.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-skeleton rounded-sm bg-surface-3", className)}
      {...props}
    />
  );
}

export { Skeleton };
