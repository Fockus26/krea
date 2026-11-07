import { MoveHorizontal } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Table — HANDOFF §2.15; medidas en design/canvas/krea.css:419-428.
 * El contenedor desplazable es una región con nombre y enfocable (el teclado puede desplazarla).
 * `position: relative` es obligatorio: un `sr-only` dentro (absoluto) se saldría y crearía scroll
 * horizontal de página a 320 px (§8). El `<th>` sticky pega respecto a este contenedor.
 */
function Table({
  label,
  hint = true,
  className,
  containerClassName,
  ...props
}: Omit<React.ComponentProps<"table">, "aria-label"> & {
  /** Nombre accesible de la región desplazable (obligatorio). */
  label: string;
  /** Pista "Desliza la tabla…" bajo la tabla en < 1024 (§2.15). */
  hint?: boolean;
  containerClassName?: string;
}) {
  return (
    <>
      <section
        data-slot="table-container"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: región desplazable enfocable por teclado (§2.15)
        tabIndex={0}
        aria-label={label}
        className={cn(
          "relative w-full overflow-x-auto rounded-md bg-surface shadow-1 dark:border dark:border-divider dark:shadow-none",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
          containerClassName,
        )}
      >
        <table
          data-slot="table"
          className={cn(
            "w-full min-w-190 border-separate border-spacing-0 text-sm",
            className,
          )}
          {...props}
        />
      </section>
      {hint ? (
        <p
          data-slot="table-hint"
          className="mt-2 flex icono-linea gap-2 text-small text-text-2 lg:hidden"
        >
          <MoveHorizontal aria-hidden="true" className="size-4 shrink-0" />
          Desliza la tabla para ver más columnas
        </p>
      ) : null}
    </>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={className} {...props} />;
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child_td]:border-b-0", className)}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "transition-colors duration-fast ease-krea hover:bg-surface-2",
        className,
      )}
      {...props}
    />
  );
}

/** `numeric`: alineada a la derecha con cifras tabulares (puedes pisar con `text-center`). */
function TableHead({
  numeric = false,
  className,
  ...props
}: React.ComponentProps<"th"> & { numeric?: boolean }) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "sticky top-0 z-table-head h-11 border-b border-divider bg-surface px-3 text-left align-middle text-eyebrow tracking-[0.06em] whitespace-nowrap text-text-2 first:pl-4 last:pr-4",
        numeric && "nums text-right",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({
  numeric = false,
  className,
  ...props
}: React.ComponentProps<"td"> & { numeric?: boolean }) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "h-15 border-b border-divider px-3 py-2 align-middle first:pl-4 last:pr-4",
        numeric && "nums text-right",
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-small text-text-2", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
