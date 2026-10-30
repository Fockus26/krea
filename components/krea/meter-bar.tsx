import { METER_FILL_CLASSES, type MeterTone } from "@/lib/meters";
import { cn } from "@/lib/utils";

type MeterBarProps = {
  /** Relleno en % (0–100); el llamador lo calcula con `percent`. */
  pct: number;
  tone: MeterTone | "accent";
  className?: string;
};

/*
 * Barra interna de los medidores (krea.css:301-306: `.bar`, `.meter .bar`): pista `--surface-3`,
 * alto 10, radio 999. Es lo único que comparten `SumMeter` y `LiveTotal` (§8: no se unifican).
 * Siempre `aria-hidden`: el número y el mensaje van en texto al lado.
 * El ancho es el único valor dinámico (como el color de `GradePill`) y no se anima.
 */
export function MeterBar({ pct, tone, className }: MeterBarProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative h-2.5 min-w-0 overflow-hidden rounded-pill bg-surface-3",
        className,
      )}
    >
      <span
        className={cn(
          "absolute inset-y-0 left-0 rounded-pill",
          METER_FILL_CLASSES[tone],
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
