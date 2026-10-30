import { Check, Clock, Crown, Pencil, X } from "lucide-react";
import type * as React from "react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";

/*
 * Estados de tarea y de entrega como chip (HANDOFF §2.4): siempre ícono + palabra,
 * nunca solo color. El mapa es dato puro (probado en tests/unit/status-badge.test.ts).
 */
export const STATUS_BADGES = {
  // Tarea
  borrador: { variant: "neutral", icon: Pencil, label: "Borrador" },
  abierta: { variant: "ok", icon: Clock, label: "Abierta" },
  evaluada: { variant: "acc", icon: Check, label: "Evaluada" },
  // Entrega
  entregada: { variant: "ok", icon: Check, label: "Entregada" },
  "por-entregar": { variant: "warn", icon: Clock, label: "Por entregar" },
  vencida: { variant: "err", icon: X, label: "Vencida" },
} as const satisfies Record<
  string,
  { variant: BadgeVariant; icon: React.ElementType; label: string }
>;

export type StatusKey = keyof typeof STATUS_BADGES;

export const TASK_STATUSES = ["borrador", "abierta", "evaluada"] as const;
export const SUBMISSION_STATUSES = [
  "entregada",
  "por-entregar",
  "vencida",
] as const;

export function StatusBadge({
  status,
  className,
}: {
  status: StatusKey;
  className?: string;
}) {
  const { variant, icon: Icon, label } = STATUS_BADGES[status];
  return (
    <Badge variant={variant} data-status={status} className={className}>
      <Icon aria-hidden="true" />
      {label}
    </Badge>
  );
}

/** Chip del capitán (D012): Crown + "Capitán" o "Capitana" según el género. */
export function CaptainBadge({
  femenino = false,
  className,
}: {
  femenino?: boolean;
  className?: string;
}) {
  return (
    <Badge variant="cap" className={className}>
      <Crown aria-hidden="true" />
      {femenino ? "Capitana" : "Capitán"}
    </Badge>
  );
}
