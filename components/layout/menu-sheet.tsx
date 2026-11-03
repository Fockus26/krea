"use client";

import { LogOut, Menu } from "lucide-react";
import { NavItemLink } from "@/components/layout/nav-item-link";
import type { NavRoute } from "@/components/layout/nav-types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { navItems } from "@/lib/nav";

/**
 * Menú del profesor en < lg (HANDOFF §2.7 y §2.13): botón "Menú" + hoja inferior con las
 * secciones que no caben en la barra (Tareas, Equipos, Premios) y Perfil (D132), divisor y
 * "Cerrar sesión" en --error. Patrón dialog de Radix: foco dentro, Esc cierra y el foco vuelve
 * al botón Menú. Cada enlace envuelve un `SheetClose` para que la hoja se cierre al navegar.
 * `compacto`: solo el ícono (44 × 44, "Menú" queda como nombre accesible), como el botón de los
 * lienzos; lo usa la topbar con el chip «En vivo», que a 320 no cabe con el texto (D128).
 * `onSignOut` lo cablea la fase 07 (sesión real).
 */
export function MenuSheet({
  pathname,
  onSignOut,
  compacto = false,
}: NavRoute & { onSignOut?: () => void; compacto?: boolean }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" icon={compacto}>
          <Menu aria-hidden="true" />
          <span className={compacto ? "sr-only" : "ml-2"}>Menú</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Menú</SheetTitle>
          <SheetDescription className="sr-only">
            Más secciones del panel del profesor y cierre de sesión.
          </SheetDescription>
        </SheetHeader>
        <ul className="flex flex-col gap-1">
          {navItems("profesor", "menu").map((item) => (
            <li key={item.id}>
              <SheetClose asChild>
                <NavItemLink item={item} pathname={pathname} size="sheet" />
              </SheetClose>
            </li>
          ))}
        </ul>
        <Separator className="my-2" />
        <SheetClose asChild>
          <button
            type="button"
            onClick={onSignOut}
            className="flex h-12 w-full cursor-pointer items-center gap-3 rounded-nav px-3 font-body text-base leading-6 font-semibold text-error transition-colors duration-fast ease-krea hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <LogOut aria-hidden="true" className="size-5 shrink-0" />
            Cerrar sesión
          </button>
        </SheetClose>
      </SheetContent>
    </Sheet>
  );
}
