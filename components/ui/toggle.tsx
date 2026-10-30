"use client";

import { Toggle as TogglePrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Toggle suelto (botón de dos estados, `aria-pressed`). No está en el handoff: se tematiza con
 * los tokens de la opción segmentada (40 de alto, radio 12, 15 px 700) para no dejar el crudo
 * de shadcn. Si ninguna pantalla lo usa, se puede borrar (D039).
 */
function Toggle({
  className,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(
        "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-nav px-4 text-button whitespace-nowrap text-text-2",
        "transition-[color,background-color] duration-fast ease-krea",
        "hover:bg-accent-soft hover:text-text data-[state=on]:bg-accent-soft-2 data-[state=on]:text-text",
        "disabled:cursor-not-allowed disabled:bg-transparent disabled:text-text-dis",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        "[&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

export { Toggle };
