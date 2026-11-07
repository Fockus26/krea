"use client";

import { Check, Minus } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Checkbox (W22, D300) — no está en el lienzo: caja de 20 con el borde de los campos (--input, ≥ 3:1)
 * y, marcada o a medias, el relleno del botón primario (--accent / --on-accent). El estado se ve
 * por el ícono (✓ o −), no solo por el color. Foco como el de los botones. El `after` amplía el
 * área táctil a 44 × 44 sin mover el diseño.
 */
function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded border-2 border-input bg-surface text-on-accent",
        "transition-[background-color,border-color] duration-fast ease-krea",
        "after:absolute after:-inset-3 after:content-['']",
        "hover:not-disabled:border-text-2",
        "data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=indeterminate]:border-accent data-[state=indeterminate]:bg-accent",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        "disabled:cursor-not-allowed disabled:border-text-dis disabled:bg-surface-3",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center"
      >
        {props.checked === "indeterminate" ? (
          <Minus aria-hidden="true" className="size-4" strokeWidth={3} />
        ) : (
          <Check aria-hidden="true" className="size-4" strokeWidth={3} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
