// Alert (HANDOFF §2.14): rol ARIA por variante. Errores `alert` (asertivo), el resto `status`.

export const ALERT_VARIANTS = ["info", "ok", "warn", "err"] as const;
export type AlertVariant = (typeof ALERT_VARIANTS)[number];

export type AlertRole = "alert" | "status";

export function alertRole(variant: AlertVariant): AlertRole {
  return variant === "err" ? "alert" : "status";
}
