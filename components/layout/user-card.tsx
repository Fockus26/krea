import Link from "next/link";
import { UserAvatar } from "@/components/krea/user-avatar";
import type { NavUsuario } from "@/components/layout/nav-types";
import type { Rol } from "@/lib/layout";
import { PERFIL_HREF, rolLabel } from "@/lib/nav";
import { cn } from "@/lib/utils";

/**
 * Tarjeta de usuario del pie de la barra lateral (HANDOFF §2.7, §8: idéntica en ambos roles).
 * Avatar 40, nombre 13/700 y rol 13 `--text-2`; padding 12, radio 16, fondo `--surface-2`.
 * Es un enlace a Perfil; nombre y rol son su nombre accesible.
 */
export function UserCard({
  usuario,
  rol,
  href = PERFIL_HREF,
  className,
}: {
  usuario: NavUsuario;
  rol: Rol;
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
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
