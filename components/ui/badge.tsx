import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Badge / chip — HANDOFF §2.4; medidas exactas en design/canvas/krea.css:260-275.
 * 28 de alto, padding 0 10, radio 10, 13/18 700, gap 6, ícono 16. Los tintes de ok/warn/prize
 * cambian con el tema (14 % en oscuro) porque salen de los tokens `--chip-*-bg` (D016).
 * El significado nunca va solo en el color: el llamador pone ícono + palabra.
 * El alto sale de `--chip-h` y el padding vertical lo sigue ((alto − 1lh) / 2): para otro alto se usa
 * `size`, nunca `h-*` suelto (con 22 px el padding de 28 dejaba el número bajo, D381).
 */
const chip =
  "icono-linea inline-flex h-[var(--chip-h,calc(var(--spacing)*7))] w-fit shrink-0 gap-1.5 rounded-sm px-2.5 py-[calc((var(--chip-h,calc(var(--spacing)*7))-1lh)/2)] text-small-b whitespace-nowrap";

const badgeVariants = cva(
  [
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
  ],
  {
    variants: {
      variant: {
        neutral: `${chip} bg-surface-2 text-text`,
        // Base de evaluación (Base 15): borde interior 1,5 px --text-2, sin depender del color
        base: `${chip} bg-surface text-text shadow-[inset_0_0_0_var(--w-btn-border)_var(--text-2)]`,
        cap: `${chip} bg-secondary text-on-secondary`,
        // Texto en --text, nunca en el acento (HANDOFF §8)
        acc: `${chip} bg-accent-soft-2 text-text [&_svg]:text-accent-ink`,
        ok: `${chip} bg-chip-ok text-success`,
        warn: `${chip} bg-chip-warn text-warning`,
        err: `${chip} bg-chip-err text-error`,
        prize: `${chip} bg-chip-prize text-text [&_svg]:text-warning dark:[&_svg]:text-secondary`,
        // "tú": 22 de alto, radio 999, 12 px
        tu: "icono-linea inline-flex h-5.5 w-fit shrink-0 gap-1.5 rounded-pill bg-accent px-2 py-[calc((--spacing(5.5)-1lh)/2)] font-body text-xs font-bold whitespace-nowrap text-on-accent",
      },
      size: {
        default: "",
        // 22 de alto (contadores y chips de lista) y 26 (ejemplos de reglas)
        sm: "[--chip-h:calc(var(--spacing)*5.5)]",
        md: "[--chip-h:calc(var(--spacing)*6.5)]",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "default",
    },
  },
);

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

function Badge({
  className,
  variant = "neutral",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, type BadgeVariant, badgeVariants };
