import Link from "next/link";
import { UserAvatar } from "@/components/krea/user-avatar";
import type { NavUsuario } from "@/components/layout/nav-types";
import { Skeleton } from "@/components/ui/skeleton";
import type { Rol } from "@/lib/layout";
import { perfilHref, rolLabel } from "@/lib/nav";
import { cn } from "@/lib/utils";

/**
 * Tarjeta de usuario del pie de la barra lateral (HANDOFF §2.7, §8: idéntica en ambos roles).
 * Avatar 40, nombre 13/700 y rol 13 `--text-2`; padding 12, radio 16, fondo `--surface-2`.
 * Es un enlace al Perfil del rol (`/perfil` o `/profe/perfil`, D132); nombre y rol son su
 * nombre accesible. Con `usuario` `null` (la sesión aún no llegó, D189) es un skeleton.
 */
export function UserCard({
  usuario,
  rol,
  href,
  className,
}: {
  usuario: NavUsuario | null;
  rol: Rol;
  href?: string;
  className?: string;
}) {
  if (!usuario) {
    return (
      <div
        data-slot="user-card"
        aria-hidden="true"
        className={cn(
          "flex items-center gap-3 rounded-md bg-surface-2 p-3",
          className,
        )}
      >
        <Skeleton className="size-10 shrink-0 rounded-pill" />
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </span>
      </div>
    );
  }
  return (
    <Link
      href={href ?? perfilHref(rol)}
      data-slot="user-card"
      className={cn(
        "flex items-center gap-3 rounded-md bg-surface-2 p-3 no-underline",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        className,
      )}
    >
      <UserAvatar
        estilo={usuario.estilo}
        seed={usuario.seed}
        nombre={usuario.nombre}
        size={40}
      />
      <span className="flex min-w-0 flex-col">
        <span className="text-small-b truncate text-text">
          {usuario.nombre}
        </span>
        <span className="text-small truncate text-text-2">{rolLabel(rol)}</span>
      </span>
    </Link>
  );
}
