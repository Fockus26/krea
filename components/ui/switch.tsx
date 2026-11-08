"use client";

import { Switch as SwitchPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Switch (D340) — no está en el lienzo: riel de 28 × 48 con el borde de los campos (--input, ≥ 3:1)
 * y la perilla en --text-2; encendido, el relleno del botón primario (--accent) y la perilla en
 * --on-accent. El estado se ve por la POSICIÓN de la perilla, no solo por el color. Foco como el
 * de los botones; el `after` amplía el área táctil a 44 de alto sin mover el diseño. La perilla
 * se mueve con `transform` y, con movimiento reducido, sin transición.
 */
function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-input bg-surface p-0.5",
        "transition-[background-color,border-color] duration-fast ease-krea motion-reduce:transition-none",
        "after:absolute after:-inset-x-1 after:-inset-y-2 after:content-['']",
        "hover:not-disabled:border-text-2",
        "data-[state=checked]:border-accent data-[state=checked]:bg-accent",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        "disabled:cursor-not-allowed disabled:border-text-dis disabled:bg-surface-3",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-5 rounded-full bg-text-2",
          "transition-transform duration-fast ease-krea motion-reduce:transition-none",
          "data-[state=checked]:translate-x-5 data-[state=checked]:bg-on-accent",
          "data-disabled:bg-text-dis",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
