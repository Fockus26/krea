import Link from "next/link";
import type * as React from "react";
import type { ReactNode } from "react";
import { NavIcon } from "@/components/layout/nav-icon";
import { isActive, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

/*
 * Ítem de la barra lateral y de la hoja Menú (HANDOFF §2.7 / §2.13): mismo aspecto, distinta
 * altura (44 / 48). El activo lleva `aria-current="page"`, peso 700 y fondo --accent-soft-2:
 * el fondo es una capa que cambia de opacidad en 150 ms (§6, no se desliza); con reduced
 * motion `--d-fast` vale 0 y el cambio es inmediato.
 */
const SIZES = {
  side: "h-11",
  sheet: "h-12",
} as const;

type NavItemLinkProps = Omit<
  React.ComponentProps<typeof Link>,
  "href" | "children"
> & {
  item: NavItem;
  pathname: string | null;
  size: keyof typeof SIZES;
  /** Contador a la derecha (solo Evaluar en la lateral). */
  trailing?: ReactNode;
  className?: string;
};

export function NavItemLink({
  item,
  pathname,
  size,
  trailing,
  className,
  ...rest
}: NavItemLinkProps) {
  const active = isActive(item, pathname);
  return (
    <Link
      {...rest}
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group/nav relative isolate flex items-center gap-3 rounded-nav px-3 text-nav text-text-2 no-underline",
        "transition-colors duration-fast ease-krea hover:bg-surface-2 hover:text-text",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        "aria-[current=page]:font-bold aria-[current=page]:text-text",
        SIZES[size],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 rounded-nav bg-accent-soft-2 opacity-0 transition-opacity duration-fast ease-krea group-aria-[current=page]/nav:opacity-100"
      />
      <NavIcon
        name={item.icon}
        className="size-5 shrink-0 group-aria-[current=page]/nav:text-accent-ink"
      />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {trailing}
    </Link>
  );
}
