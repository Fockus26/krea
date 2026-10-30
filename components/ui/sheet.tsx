"use client";

import { XIcon } from "lucide-react";
import { Dialog as SheetPrimitive } from "radix-ui";
import type * as React from "react";

import { Button } from "@/components/ui/button";
import { overlayClasses } from "@/components/ui/dialog";
import { usePortalContainer } from "@/components/ui/portal-scope";
import { cn } from "@/lib/utils";

/*
 * Sheet — solo la hoja inferior de HANDOFF §2.13 (lienzo: Componentes.dc.html, "Navegación
 * abierta en móvil"). `side` se conserva como prop pero solo admite "bottom": es lo único
 * que tiene diseño (D036). Movimiento §6: sube 250 / baja 200; con reduced motion, opacidad.
 */

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({
  container,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  const scoped = usePortalContainer();
  return (
    <SheetPrimitive.Portal
      data-slot="sheet-portal"
      container={container ?? scoped}
      {...props}
    />
  );
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(overlayClasses, className)}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = "bottom",
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  /** Solo la hoja inferior tiene diseño (D036). */
  side?: "bottom";
  showCloseButton?: boolean;
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          // radio 24 24 0 0 · padding 8 16 24 (+ zona segura inferior)
          "fixed inset-x-0 bottom-0 z-overlay flex max-h-[90dvh] flex-col overflow-y-auto",
          "rounded-t-lg bg-surface px-4 pt-2 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-text shadow-3 outline-none",
          "dark:border-t dark:border-divider",
          "data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out",
          className,
        )}
        {...props}
      >
        {/* Asa 40 × 4, decorativa */}
        <div
          aria-hidden="true"
          className="mx-auto mt-1 mb-3 h-1 w-10 shrink-0 rounded-pill bg-surface-3"
        />
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close data-slot="sheet-close" asChild>
            {/* En la fila del título: 8 + 4 + 4 + 12 = 28 desde arriba */}
            <Button
              variant="ghost"
              size="sm"
              icon
              aria-label="Cerrar"
              className="absolute top-7 right-4"
            >
              <XIcon aria-hidden="true" />
            </Button>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

/** Fila del título (alto del botón de cerrar, 36) con hueco a la derecha para él. */
function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn(
        "mb-2 flex min-h-9 flex-col justify-center gap-0.5 pr-11",
        className,
      )}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-4 flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-h3 text-text", className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-small text-text-2", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
