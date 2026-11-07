"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Indicador, useIndicador } from "@/components/krea/indicador";
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
 * La opción levantada es un `Indicador` que se desliza (D279): como cada opción es otra página y el
 * control se vuelve a montar, recuerda su caja por `label` y viaja desde la opción de la página que
 * se acaba de dejar. El indicador va en la caja que envuelve la `<ul>` (una lista solo lleva `<li>`).
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
  const { listaRef, indicadorRef } = useIndicador<HTMLDivElement>({
    activo: ':scope > ul > li > a[aria-current="page"]',
    memoria: `segmentado:${label}`,
  });
  return (
    <nav aria-label={label} className={className}>
      <div
        ref={listaRef}
        className="group/seg relative isolate inline-flex w-fit max-w-full rounded-md bg-surface-2 p-1"
      >
        <Indicador ref={indicadorRef} variante="segmentado" />
        <ul className="m-0 flex min-w-0 list-none flex-wrap gap-1 p-0">
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
                  // Cuando el indicador ya midió (`data-ind`), el fondo y la sombra son él
                  "group-data-[ind]/seg:aria-[current=page]:bg-transparent group-data-[ind]/seg:aria-[current=page]:shadow-none",
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
      </div>
    </nav>
  );
}
