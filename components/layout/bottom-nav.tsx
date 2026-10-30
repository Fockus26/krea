import Link from "next/link";
import { NavIcon } from "@/components/layout/nav-icon";
import type { NavRoute } from "@/components/layout/nav-types";
import type { Rol } from "@/lib/layout";
import { isActive, navItems } from "@/lib/nav";

/**
 * Contenido de la barra inferior (< lg; HANDOFF §2.7): 5 columnas con píldora de ícono 56 × 32
 * y etiqueta 12/16 600. El `<nav>` con la cuadrícula de 5 columnas, el alto de 72 px y la zona
 * segura los pone `AppShell` (slot `bottomNav`). Activo: píldora --accent-soft-2 que aparece con
 * opacidad (150 ms), ícono y etiqueta --accent-ink 700; `aria-current="page"` lo anuncia.
 * Toque de 56 px de alto: sobre el mínimo de 44.
 */
export function BottomNav({ rol, pathname }: NavRoute & { rol: Rol }) {
  return (
    <>
      {navItems(rol, "inferior").map((item) => {
        const active = isActive(item, pathname);
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className="group/nav mt-1 flex h-14 flex-col items-center justify-center gap-0.5 rounded-md font-body text-xs leading-4 font-semibold text-text-2 no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus aria-[current=page]:font-bold aria-[current=page]:text-accent-ink"
          >
            <span className="relative isolate grid h-8 w-14 place-items-center rounded-pill">
              <span
                aria-hidden="true"
                className="absolute inset-0 -z-10 rounded-pill bg-accent-soft-2 opacity-0 transition-opacity duration-fast ease-krea group-aria-[current=page]/nav:opacity-100"
              />
              <NavIcon name={item.icon} className="size-6" />
            </span>
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
