"use client";

import { XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { usePortalContainer } from "@/components/ui/portal-scope";
import { cn } from "@/lib/utils";

/*
 * Dialog — HANDOFF §2.13 (lienzo: design/canvas/krea.css:373-374, `.ov` y `.dialog`).
 * Movimiento §6 con las utilidades de D027; con reduced motion, solo opacidad.
 * El título siempre va (Radix avisa sin él): si el diseño no lo muestra, `sr-only`.
 */

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  container,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  const scoped = usePortalContainer();
  return (
    <DialogPrimitive.Portal
      data-slot="dialog-portal"
      container={container ?? scoped}
      {...props}
    />
  );
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

/*
 * Overlay rgb(20 18 26 / .55) del handoff: token `--scrim`, igual en los dos temas (D037).
 * Lo comparte la hoja inferior.
 */
const overlayClasses =
  "fixed inset-0 z-overlay bg-scrim data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out";

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(overlayClasses, className)}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  onOpenAutoFocus,
  onCloseAutoFocus,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  // Quién tenía el foco al abrir. Radix solo devuelve el foco a un `DialogTrigger`; los diálogos
  // controlados (abiertos desde un botón cualquiera) lo perdían en `<body>` (D506).
  const abrio = React.useRef<HTMLElement | null>(null);
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          // < 768: ancho con margen 16, alineado arriba a 96. ≥ 768: centrado (sin translate,
          // para no mezclarlo con el transform de la animación). Máx. 520; 560 con max-w-140.
          "fixed inset-x-4 top-24 z-overlay mx-auto flex max-h-[calc(100dvh-7rem)] max-w-130 flex-col gap-4 overflow-y-auto",
          "md:inset-y-0 md:my-auto md:h-fit md:max-h-[calc(100dvh-4rem)]",
          "rounded-lg bg-surface p-6 text-text shadow-3 outline-none dark:border dark:border-divider",
          "data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out",
          className,
        )}
        onOpenAutoFocus={(e) => {
          const activo = document.activeElement;
          abrio.current = activo instanceof HTMLElement ? activo : null;
          onOpenAutoFocus?.(e);
        }}
        onCloseAutoFocus={(e) => {
          onCloseAutoFocus?.(e);
          // Un diálogo que ya decidió el destino (`preventDefault`) manda; si no, vuelve al que lo abrió
          const destino = abrio.current;
          abrio.current = null;
          if (
            !e.defaultPrevented &&
            destino?.isConnected &&
            destino !== document.body
          ) {
            e.preventDefault();
            destino.focus();
          }
        }}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            {/* Centrado con la primera línea del título (24 + 12 − 18 = 18 desde arriba) */}
            <Button
              variant="ghost"
              size="sm"
              icon
              aria-label="Cerrar"
              className="absolute top-4.5 right-6"
            >
              <XIcon aria-hidden="true" />
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

/** Título + subtítulo. Deja hueco a la derecha para el botón de cerrar. */
function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1 pr-11", className)}
      {...props}
    />
  );
}

/** Acciones a la derecha, separadas 8 (Cancelar secondary, confirmar primary/danger). */
function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-wrap justify-end gap-2", className)}
      {...props}
    >
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="secondary">Cerrar</Button>
        </DialogPrimitive.Close>
      )}
      {children}
    </div>
  );
}

/** Radix lo pinta como `h2` (el diálogo es su propio documento); estilo h3 del handoff. */
function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-h3 text-text", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-small text-text-2", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  overlayClasses,
};
