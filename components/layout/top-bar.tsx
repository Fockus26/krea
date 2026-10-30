import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/krea/logo";
import { UserAvatar } from "@/components/krea/user-avatar";
import { MenuSheet } from "@/components/layout/menu-sheet";
import type { NavRoute, NavUsuario } from "@/components/layout/nav-types";
import { Button } from "@/components/ui/button";
import type { Rol } from "@/lib/layout";
import { PERFIL_HREF } from "@/lib/nav";

/**
 * Contenido de la barra superior (< lg; HANDOFF §2.7). El `<header>` sticky, el alto 56/64 y el
 * borde los pone `AppShell` (slot `topbar`). Izquierda: logo 88 px, o botón volver 44 + título h4
 * en pantallas de detalle (`volverHref` + `title`). Derecha: avatar 36 que enlaza a Perfil
 * (estudiante) o botón "Menú" con la hoja (profesor).
 */
export function TopBar({
  rol,
  pathname,
  usuario,
  title,
  volverHref,
  onSignOut,
}: NavRoute & {
  rol: Rol;
  usuario: NavUsuario;
  /** Título de la pantalla de detalle; solo se pinta junto a `volverHref`. */
  title?: string;
  volverHref?: string;
  onSignOut?: () => void;
}) {
  const inicio = rol === "profesor" ? "/profe" : "/";
  return (
    <>
      {volverHref ? (
        <>
          <Button asChild variant="ghost" icon>
            <Link href={volverHref} aria-label="Volver">
              <ArrowLeft aria-hidden="true" className="size-6" />
            </Link>
          </Button>
          {title ? (
            <p className="text-h4 min-w-0 flex-1 truncate text-text">{title}</p>
          ) : (
            <span className="flex-1" />
          )}
        </>
      ) : (
        <>
          <Link
            href={inicio}
            className="rounded-nav focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <Logo size="topbar" />
          </Link>
          <span className="flex-1" />
        </>
      )}
      {rol === "profesor" ? (
        <MenuSheet pathname={pathname} onSignOut={onSignOut} />
      ) : (
        <Link
          href={PERFIL_HREF}
          aria-label="Tu perfil"
          className="grid size-11 shrink-0 place-items-center rounded-pill focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <UserAvatar
            estilo={usuario.estilo}
            seed={usuario.seed}
            nombre={usuario.nombre}
            size={36}
          />
        </Link>
      )}
    </>
  );
}
