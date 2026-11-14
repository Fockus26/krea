import Link from "next/link";
import { Logo } from "@/components/krea/logo";
import { NavItemLink } from "@/components/layout/nav-item-link";
import type { NavRoute, NavUsuario } from "@/components/layout/nav-types";
import { UserCard } from "@/components/layout/user-card";
import { Badge } from "@/components/ui/badge";
import type { Rol } from "@/lib/layout";
import { counterLabel, navItems } from "@/lib/nav";
import { tiposTransicion } from "@/lib/transicion";

/**
 * Contenido de la barra lateral (≥ lg; HANDOFF §2.7): logo, ítems del rol y tarjeta de usuario.
 * El `<nav aria-label="Principal">` lo pone `AppShell` (slot `sidebar`): aquí solo hay una lista.
 * `evaluarCount` pinta el contador de Evaluar (profesor) con texto accesible "n por evaluar".
 */
export function SideNav({
  rol,
  pathname,
  usuario,
  evaluarCount,
}: NavRoute & {
  rol: Rol;
  /** `null` mientras llega la sesión (D189): la tarjeta se pinta como skeleton. */
  usuario: NavUsuario | null;
  evaluarCount?: number | null;
}) {
  const inicio = rol === "profesor" ? "/profe" : "/";
  const countText = counterLabel(evaluarCount);
  return (
    <div className="flex min-h-full flex-col gap-1">
      <Link
        href={inicio}
        transitionTypes={tiposTransicion(rol, pathname, inicio)}
        className="mb-6 block w-fit rounded-nav px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <Logo size="lateral" />
      </Link>
      <ul className="flex flex-col gap-1">
        {navItems(rol, "lateral", { admin: usuario?.admin }).map((item) => (
          <li key={item.id}>
            <NavItemLink
              item={item}
              rol={rol}
              pathname={pathname}
              size="side"
              trailing={
                item.id === "evaluar" && countText ? (
                  <Badge variant="acc" size="sm" className="px-2 text-xs">
                    <span aria-hidden="true" className="nums">
                      {evaluarCount}
                    </span>
                    <span className="sr-only">{countText}</span>
                  </Badge>
                ) : undefined
              }
            />
          </li>
        ))}
      </ul>
      <UserCard usuario={usuario} rol={rol} className="mt-auto" />
    </div>
  );
}
