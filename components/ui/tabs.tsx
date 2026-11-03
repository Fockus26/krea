"use client";

import { Tabs as TabsPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Tabs — HANDOFF §2.6; medidas en design/canvas/krea.css:289-299. Dos presentaciones del
 * mismo patrón WAI-ARIA de pestañas (Radix: `tablist`/`tab`/`tabpanel`, ←/→, Inicio/Fin,
 * activación automática):
 *  - `line`: pestañas de línea, 44 de alto, barra de 3 px bajo la activa, scroll horizontal propio.
 *  - `segmented`: contenedor `--surface-2`; la opción activa sube a `--surface` con `shadow-1`.
 * Para elegir un valor (5A/5C, tema) usa `ToggleGroup`, que es `radiogroup`, no `tablist`.
 *
 * Indicador: cambia con opacidad 150 ms (alternativa conservadora de D039): medir el DOM para
 * deslizarlo con `transform` es frágil con scroll y cambios de ancho. Con reduced motion las
 * duraciones valen 0 (D017) y el salto es inmediato.
 */

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  variant = "line",
  block = false,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & {
  variant?: "line" | "segmented";
  /** Solo `segmented`: reparte el ancho (`seg-block`); bajo 400 px se ocultan los íconos. */
  block?: boolean;
}) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      data-block={block || undefined}
      className={cn(
        "group/tabs-list",
        variant === "line" &&
          "flex gap-6 overflow-x-auto border-b border-divider",
        variant === "segmented" &&
          "gap-1 rounded-md bg-surface-2 p-1 " +
            // `@container` solo en block: con ancho propio (w-fit) el grupo colapsaría al padding
            (block ? "@container flex w-full" : "inline-flex w-fit max-w-full"),
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap text-button text-text-2",
        "transition-[color,background-color,box-shadow] duration-fast ease-krea",
        "hover:text-text disabled:cursor-not-allowed disabled:text-text-dis disabled:hover:text-text-dis",
        "[&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
        "focus-visible:outline-2 focus-visible:outline-focus",
        // Línea: barra de 3 px sobre el borde de la lista (dentro de la caja: el scroll no la recorta)
        "group-data-[variant=line]/tabs-list:h-11 group-data-[variant=line]/tabs-list:-outline-offset-2",
        "group-data-[variant=line]/tabs-list:data-[state=active]:text-accent-ink",
        "group-data-[variant=line]/tabs-list:after:absolute group-data-[variant=line]/tabs-list:after:inset-x-0 group-data-[variant=line]/tabs-list:after:bottom-0",
        "group-data-[variant=line]/tabs-list:after:h-0.75 group-data-[variant=line]/tabs-list:after:rounded-t-xs group-data-[variant=line]/tabs-list:after:bg-accent",
        "group-data-[variant=line]/tabs-list:after:opacity-0 group-data-[variant=line]/tabs-list:after:transition-opacity group-data-[variant=line]/tabs-list:after:duration-fast",
        "group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100",
        // Segmentado
        "group-data-[variant=segmented]/tabs-list:h-10 group-data-[variant=segmented]/tabs-list:gap-2 group-data-[variant=segmented]/tabs-list:rounded-nav group-data-[variant=segmented]/tabs-list:px-4",
        "group-data-[variant=segmented]/tabs-list:outline-offset-2",
        "group-data-[variant=segmented]/tabs-list:data-[state=active]:bg-surface group-data-[variant=segmented]/tabs-list:data-[state=active]:text-text group-data-[variant=segmented]/tabs-list:data-[state=active]:shadow-1",
        // seg-block: reparte el ancho y, por debajo de 400 px (25 rem) del contenedor, solo texto
        "group-data-[block]/tabs-list:min-w-0 group-data-[block]/tabs-list:flex-1 group-data-[block]/tabs-list:justify-center group-data-[block]/tabs-list:px-2",
        "group-data-[block]/tabs-list:@max-seg:[&_svg]:hidden",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "flex-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus data-[state=active]:animate-fade-in",
        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
