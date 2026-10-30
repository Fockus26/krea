import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Badge / chip — HANDOFF §2.4; medidas exactas en design/canvas/krea.css:260-275.
 * 28 de alto, padding 0 10, radio 10, 13/18 700, gap 6, ícono 16. Los tintes de ok/warn/prize
 * cambian con el tema (14 % en oscuro) porque salen de los tokens `--chip-*-bg` (D016).
 * El significado nunca va solo en el color: el llamador pone ícono + palabra.
 */
const chip =
  "inline-flex h-7 w-fit shrink-0 items-center gap-1.5 rounded-sm px-2.5 text-small-b whitespace-nowrap";

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
        tu: "inline-flex h-5.5 w-fit shrink-0 items-center gap-1.5 rounded-pill bg-accent px-2 font-body text-xs font-bold whitespace-nowrap text-on-accent",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

function Badge({
  className,
  variant = "neutral",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, type BadgeVariant, badgeVariants };
