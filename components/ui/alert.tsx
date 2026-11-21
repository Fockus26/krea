import { cva } from "class-variance-authority";
import {
  CircleCheck,
  Info,
  type LucideIcon,
  OctagonAlert,
  TriangleAlert,
} from "lucide-react";
import type * as React from "react";
import { type AlertRole, type AlertVariant, alertRole } from "@/lib/alert";
import { cn } from "@/lib/utils";

/*
 * Alert — HANDOFF §2.14; medidas y colores en design/canvas/krea.css:360-365.
 * El estado nunca va solo por color: cada variante lleva su ícono.
 * 15/22 no existe como rol tipográfico (D017): medida suelta en rem, pendiente de token.
 */
const alertVariants = cva(
  "flex icono-linea gap-3 rounded-md px-4 py-3 text-callout text-text",
  {
    variants: {
      variant: {
        info: "bg-accent-soft",
        ok: "bg-alert-ok",
        warn: "bg-alert-warn",
        // Borde interior 1,5 px error (--w-btn-border, el mismo grosor del lienzo)
        err: "bg-alert-err shadow-[inset_0_0_0_var(--w-btn-border)_var(--error)]",
      },
    },
    defaultVariants: { variant: "info" },
  },
);

const ICONS: Record<AlertVariant, LucideIcon> = {
  info: Info,
  ok: CircleCheck,
  warn: TriangleAlert,
  err: OctagonAlert,
};

const ICON_COLOR: Record<AlertVariant, string> = {
  info: "text-accent-ink",
  ok: "text-success",
  warn: "text-warning",
  err: "text-error",
};

function Alert({
  variant = "info",
  role,
  icon,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "role"> & {
  variant?: AlertVariant;
  /** Ícono propio (p. ej. tendencia ↑/↓); por defecto el de la variante. */
  icon?: LucideIcon;
  /** Por defecto `alert` en `err` y `status` en el resto (§2.14). */
  role?: AlertRole;
}) {
  const Icon = icon ?? ICONS[variant];
  return (
    <div
      data-slot="alert"
      data-variant={variant}
      role={role ?? alertRole(variant)}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon
        aria-hidden="true"
        className={cn("size-5 shrink-0", ICON_COLOR[variant])}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="alert-title"
      className={cn("font-bold", className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="alert-description" className={className} {...props} />;
}

export { Alert, AlertTitle, AlertDescription, alertVariants };
