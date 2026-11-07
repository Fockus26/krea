import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/*
 * Button — HANDOFF §2.1; medidas exactas en design/canvas/krea.css:203-226.
 * Los estados interactivos van con `not-disabled:not-aria-disabled:` para que un botón
 * deshabilitado (o un enlace con aria-disabled) no reaccione a hover ni a activo.
 */
const buttonCva = cva(
  [
    "inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap no-underline select-none",
    "transition-[translate,background-color,box-shadow,color] duration-fast ease-krea",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
    "[&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
    // Un botón ocupado (aria-busy) no es un botón deshabilitado: conserva los colores de su variante (D285)
    "not-aria-busy:disabled:cursor-not-allowed not-aria-busy:disabled:bg-surface-3 not-aria-busy:disabled:text-text-dis not-aria-busy:disabled:shadow-none",
    "not-aria-busy:aria-disabled:cursor-not-allowed not-aria-busy:aria-disabled:bg-surface-3 not-aria-busy:aria-disabled:text-text-dis not-aria-busy:aria-disabled:shadow-none",
    "aria-busy:cursor-progress",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-accent text-on-accent shadow-btn-primary",
          "hover:not-disabled:not-aria-disabled:bg-accent-hover",
          "active:not-disabled:not-aria-disabled:translate-y-btn active:not-disabled:not-aria-disabled:shadow-none",
        ],
        secondary: [
          "bg-surface text-accent-ink shadow-btn-outline",
          "hover:not-disabled:not-aria-disabled:bg-accent-soft",
          "active:not-disabled:not-aria-disabled:translate-y-px active:not-disabled:not-aria-disabled:bg-accent-soft-2",
          "not-aria-busy:disabled:bg-transparent not-aria-busy:disabled:shadow-btn-outline-dis not-aria-busy:aria-disabled:bg-transparent not-aria-busy:aria-disabled:shadow-btn-outline-dis",
        ],
        ghost: [
          "bg-transparent text-accent-ink",
          "hover:not-disabled:not-aria-disabled:bg-accent-soft",
          // Lámina de componentes: deshabilitado sin fondo, solo texto --text-dis
          "not-aria-busy:disabled:bg-transparent not-aria-busy:aria-disabled:bg-transparent",
        ],
        // Eliminar sin fondo (D297): el rojo de error es suyo, no del acento; hover con el tinte de los avisos y activo con el del chip
        "ghost-danger": [
          "bg-transparent text-error",
          "hover:not-disabled:not-aria-disabled:bg-alert-err",
          "active:not-disabled:not-aria-disabled:translate-y-px active:not-disabled:not-aria-disabled:bg-chip-err",
          "not-aria-busy:disabled:bg-transparent not-aria-busy:aria-disabled:bg-transparent",
        ],
        // Hover y activo de danger salen de la lámina (Componentes.dc.html), no de §2.1
        danger: [
          "bg-error text-on-error",
          "hover:not-disabled:not-aria-disabled:brightness-92",
          "active:not-disabled:not-aria-disabled:translate-y-px",
        ],
      },
      size: {
        // HANDOFF §2: 36 px solo en filas densas de escritorio; por debajo de 1024, 44 (D215)
        sm: "h-9 rounded-nav px-3.5 text-button-sm max-lg:h-11",
        md: "h-11 rounded-md px-5 text-button",
        lg: "h-13 rounded-md px-6 text-button-lg",
      },
      icon: { true: "px-0", false: "" },
      block: { true: "w-full", false: "" },
    },
    compoundVariants: [
      // ghost: padding 0 12 solo en md (sm y lg conservan el suyo, como el lienzo)
      {
        variant: ["ghost", "ghost-danger"],
        size: "md",
        icon: false,
        className: "px-3",
      },
      { icon: true, size: "sm", className: "w-9 max-lg:w-11" },
      { icon: true, size: "md", className: "w-11" },
      { icon: true, size: "lg", className: "w-13" },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
      icon: false,
      block: false,
    },
  },
);

/** Clases del botón ya fusionadas con `cn` (los compuestos pisan padding/ancho del tamaño). */
function buttonVariants(
  options?: VariantProps<typeof buttonCva>,
  className?: string,
) {
  return cn(buttonCva(options), className);
}

type ButtonBaseProps = Omit<React.ComponentProps<"button">, "disabled"> &
  VariantProps<typeof buttonCva> & {
    disabled?: boolean;
  };

type ButtonProps =
  | (ButtonBaseProps & {
      asChild?: false;
      /** Cargando: `aria-busy`, spinner y `loadingLabel`; no dispara `onClick`. */
      loading?: boolean;
      /** Etiqueta en gerundio mientras carga ("Entrando…"). Sin ella, solo el spinner. */
      loadingLabel?: React.ReactNode;
    })
  | (ButtonBaseProps & {
      /** Pinta el hijo (un `<a>` o `Link`) con los estilos del botón. Sin `loading` (D028). */
      asChild: true;
      loading?: never;
      loadingLabel?: never;
    });

function Button(props: ButtonProps) {
  const {
    className,
    variant,
    size,
    icon,
    block,
    asChild = false,
    loading = false,
    loadingLabel,
    disabled,
    children,
    onClick,
    type,
    ...rest
  } = props;
  const classes = buttonVariants({ variant, size, icon, block }, className);
  const data = {
    "data-slot": "button",
    "data-variant": variant ?? "primary",
    "data-size": size ?? "md",
  };

  if (asChild) {
    return (
      <Slot.Root
        {...data}
        className={classes}
        aria-disabled={disabled || undefined}
        onClick={onClick}
        {...rest}
      >
        {children}
      </Slot.Root>
    );
  }

  // Cargando: sin onClick y sin submit (evita el doble envío) pero conserva el foco,
  // a diferencia de `disabled`. Sin funciones nuevas: el botón sigue siendo de servidor.
  return (
    <button
      {...data}
      type={loading ? "button" : (type ?? "button")}
      className={classes}
      disabled={disabled}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      onClick={loading ? undefined : onClick}
      {...rest}
    >
      {/* Las dos capas ocupan la misma celda: el ancho es el de la mayor y no salta al cargar */}
      <span className="grid">
        <span
          className={cn(
            "col-start-1 row-start-1 icono-linea inline-flex justify-center gap-2",
            loading && "invisible",
          )}
        >
          {children}
        </span>
        <span
          aria-hidden={!loading || undefined}
          className={cn(
            "col-start-1 row-start-1 inline-flex items-center justify-center gap-2",
            !loading && "invisible",
          )}
        >
          <Spinner />
          {loadingLabel}
        </span>
      </span>
    </button>
  );
}

export { Button, type ButtonProps, buttonVariants };
