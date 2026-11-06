import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type OpcionEnlace = {
  clave: string;
  texto: string;
  href: string;
  icono?: ReactNode;
};

/*
 * Segmentado de ENLACES (D095): mismo aspecto que `ToggleGroup` (HANDOFF §2.6), pero cada opción es
 * otra ruta. Un control que cambia de página no es un radiogroup: va en un `<nav>` con nombre, una
 * lista de enlaces y `aria-current="page"` en la opción activa (el estado no va solo en el color:
 * la activa lleva fondo de superficie y sombra, y el lector la anuncia).
 */
export function SegmentedLinks({
  label,
  actual,
  opciones,
  className,
}: {
  label: string;
  actual: string;
  opciones: readonly OpcionEnlace[];
  className?: string;
}) {
  return (
    <nav aria-label={label} className={className}>
      <ul className="m-0 inline-flex w-fit max-w-full list-none flex-wrap gap-1 rounded-md bg-surface-2 p-1">
        {opciones.map((o) => (
          <li key={o.clave}>
            <Link
              href={o.href}
              aria-current={o.clave === actual ? "page" : undefined}
              className={cn(
                "relative inline-flex h-10 items-center justify-center gap-2 rounded-nav px-4 text-button whitespace-nowrap text-text-2",
                // 40 px visibles (HANDOFF §2) y 44 de área táctil, dentro del padding del contenedor (D215)
                "after:absolute after:inset-x-0 after:-inset-y-0.5",
                "transition-[color,background-color,box-shadow] duration-fast ease-krea",
                "hover:text-text aria-[current=page]:bg-surface aria-[current=page]:text-text aria-[current=page]:shadow-1",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                "[&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
              )}
            >
              {o.icono}
              {o.texto}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
