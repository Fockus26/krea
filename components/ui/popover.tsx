"use client";

import { Popover as PopoverPrimitive } from "radix-ui";
import type * as React from "react";
import { usePortalContainer } from "@/components/ui/portal-scope";
import { cn } from "@/lib/utils";

/*
 * Popover — panel flotante anclado (estilo shadcn sobre Radix Popover). Mismo panel que el menú de
 * HANDOFF §2.13 (radio 16, borde 1, --shadow-3, padding 6, crece desde el ancla). Lo usa el combobox
 * «¿A quién?» de Ajustes de puntos (D118) con `PopoverAnchor` en lugar de `PopoverTrigger`: el foco
 * se queda en el input (el llamador previene `onOpenAutoFocus`/`onCloseAutoFocus`).
 * Radix no modal: no atrapa el foco ni oculta el resto a los lectores; Esc y clic fuera lo cierran.
 * Respeta el contenedor de `PortalScope` (D034) para heredar tema y acento en /componentes.
 */

function Popover(props: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger(
  props: React.ComponentProps<typeof PopoverPrimitive.Trigger>,
) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverAnchor(
  props: React.ComponentProps<typeof PopoverPrimitive.Anchor>,
) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

function PopoverContent({
  className,
  align = "start",
  sideOffset = 4,
  container,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> & {
  container?: React.ComponentProps<typeof PopoverPrimitive.Portal>["container"];
}) {
  const scoped = usePortalContainer();
  return (
    <PopoverPrimitive.Portal container={container ?? scoped}>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-popover max-h-(--radix-popover-content-available-height) w-72 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-md border border-divider bg-surface p-1.5 text-text shadow-3 outline-none",
          "origin-trigger data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger };
