import { ChevronDown, ChevronUp } from "lucide-react";
import {
  type DeltaDir,
  deltaDir,
  deltaTexto,
  deltaVisible,
} from "@/lib/rank-row";
import { cn } from "@/lib/utils";

// Fondos con los tokens de chip (success 10 % claro / 14 % oscuro, error 12 %: D016); "=" sin fondo
const DELTA_CLASSES: Record<DeltaDir, string> = {
  up: "bg-chip-ok text-success",
  down: "bg-chip-err text-error",
  eq: "text-text-2",
};

type RankDeltaProps = {
  /** Puestos que subió (+) o bajó (−) desde la última vez; 0 = igual. */
  delta: number;
  className?: string;
};

/*
 * Chip de cambio de puesto — HANDOFF §2.9, krea.css:344-349. 22 de alto, radio 999, Poppins 700 12.
 * Visible: flecha + número (o "="). Accesible: "subió 2 puestos" / "bajó 1 puesto" / "sin cambios"
 * (D050); el sentido nunca va solo en el color: la flecha lo repite.
 */
export function RankDelta({ delta, className }: RankDeltaProps) {
  const dir = deltaDir(delta);
  return (
    <span
      data-slot="rank-delta"
      data-dir={dir}
      className={cn(
        "text-rank-delta inline-flex h-5.5 items-center gap-0.5 rounded-pill px-1.5 whitespace-nowrap",
        DELTA_CLASSES[dir],
        className,
      )}
    >
      {dir === "up" ? (
        <ChevronUp aria-hidden="true" className="size-3.5" />
      ) : dir === "down" ? (
        <ChevronDown aria-hidden="true" className="size-3.5" />
      ) : null}
      <span aria-hidden="true">{deltaVisible(delta)}</span>
      <span className="sr-only">{deltaTexto(delta)}</span>
    </span>
  );
}
