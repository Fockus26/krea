import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Card — HANDOFF §2.8; medidas en design/canvas/krea.css:190-194.
 * Sombra en claro; en oscuro sin sombra y con borde 1 px (nunca ambas, §8).
 * No hay CardAction/CardFooter/CardContent: el handoff no los usa (la acción del
 * encabezado es un hijo más de la fila `CardHeader`).
 */
const cardVariants = cva("bg-surface p-4 md:p-6", {
  variants: {
    variant: {
      default:
        "rounded-md shadow-1 dark:border dark:border-divider dark:shadow-none",
      // Radio 24 solo para hero (y la tarjeta de puntos, que no es una Card, §8)
      hero: "rounded-lg shadow-1 dark:border dark:border-divider dark:shadow-none",
      flat: "rounded-md border border-divider shadow-none",
    },
  },
  defaultVariants: { variant: "default" },
});

type CardProps = React.ComponentProps<"div"> &
  VariantProps<typeof cardVariants>;

function Card({ className, variant, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  );
}

/** Fila título + acción: envuelve, gap 8 12, margen inferior 12. */
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2",
        className,
      )}
      {...props}
    />
  );
}

const TITLE_CLASS = { 2: "text-h2", 3: "text-h3", 4: "text-h4" } as const;

/** El nivel lo decide el llamador según dónde viva la tarjeta (no rompe la jerarquía). */
function CardTitle({
  level = 3,
  className,
  ...props
}: React.ComponentProps<"h3"> & { level?: 2 | 3 | 4 }) {
  const Heading = `h${level}` as const;
  return (
    <Heading
      data-slot="card-title"
      className={cn(TITLE_CLASS[level], "text-text", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-small text-text-2", className)}
      {...props}
    />
  );
}

/** Lista dentro de la tarjeta: filas de 64 px mínimo separadas por 1 px. */
function CardList({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="card-list"
      className={cn("m-0 list-none p-0", className)}
      {...props}
    />
  );
}

/**
 * Fila de la lista. Con `asChild` el hijo (un `<a>`/`Link`) es la fila interactiva:
 * hover `--surface-2`, radio 12 y anillo de foco (§2.8). El separador es del `<li>`,
 * así el hover no lo tapa.
 */
function CardListItem({
  asChild = false,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"li">, "children"> & {
  asChild?: boolean;
  children: React.ReactNode;
}) {
  const Row = asChild ? Slot.Root : "div";
  return (
    <li
      data-slot="card-list-item"
      className="border-b border-divider last:border-b-0"
      {...props}
    >
      <Row
        className={cn(
          "flex min-h-16 items-center gap-3 px-1 py-3 text-text",
          asChild &&
            "rounded-nav no-underline transition-colors duration-fast ease-krea hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
          className,
        )}
      >
        {children}
      </Row>
    </li>
  );
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardList,
  CardListItem,
  cardVariants,
};
