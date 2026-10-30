import { Check, type LucideIcon, TriangleAlert, X } from "lucide-react";
import { MeterBar } from "@/components/krea/meter-bar";
import { cardVariants } from "@/components/ui/card";
import {
  METER_TEXT_CLASSES,
  SUM_STATE_TONE,
  type SumState,
  sumMeterInfo,
} from "@/lib/meters";
import { cn } from "@/lib/utils";

const ICONS: Record<SumState, LucideIcon> = {
  under: TriangleAlert,
  over: X,
  exact: Check,
};

type SumMeterProps = {
  /** Suma de los valores de las preguntas. Tiene que dar exactamente 20 (D004). */
  sum: number;
  /**
   * `bar`: fila compacta (§2.11; móvil, sticky la pone la página).
   * `card`: tarjeta "Suma de valores" del aside del constructor (§3 Constructor).
   */
  variant?: "bar" | "card";
  /** Nivel del título de la tarjeta (eyebrow). Solo `card`. */
  headingLevel?: 2 | 3 | 4;
  className?: string;
};

/*
 * Medidor de la suma del constructor — HANDOFF §2.11; krea.css:304-310 (D056).
 * Estados: faltan (warning + TriangleAlert) · se pasó (error + X, barra 100 %) · exacta
 * (success + Check). El estado va en ícono + texto, no solo en color.
 * `role="status"` (atómico): el lector lee una frase completa ("Suma de valores: 14 de 20.
 * Faltan 6.") solo cuando cambia el contenido, no en cada render; lo visible va `aria-hidden`
 * para no leerse dos veces en modo lectura.
 */
export function SumMeter({
  sum,
  variant = "bar",
  headingLevel = 2,
  className,
}: SumMeterProps) {
  const info = sumMeterInfo(sum);
  const tone = SUM_STATE_TONE[info.state];
  const Icon = ICONS[info.state];
  const live = (
    // <output> = role="status" implícito
    <output className="sr-only" aria-live="polite" aria-atomic="true">
      {info.srText}
    </output>
  );

  if (variant === "card") {
    const Heading = `h${headingLevel}` as const;
    const [sumText, targetText] = info.display.split(" / ");
    return (
      <section
        data-slot="sum-meter"
        data-state={info.state}
        className={cn(
          cardVariants(),
          "flex flex-col gap-4 shadow-2",
          className,
        )}
      >
        {/* PROVISIONAL (CONTENT_CHECKLIST 45): título de la tarjeta, del lienzo */}
        <Heading className="text-eyebrow">Suma de valores</Heading>
        <div aria-hidden="true" className="flex items-baseline gap-2">
          <span className={cn("text-display", METER_TEXT_CLASSES[tone])}>
            {sumText}
          </span>
          <span className="text-h3 nums text-text-2">/ {targetText}</span>
        </div>
        <MeterBar pct={info.pct} tone={tone} />
        <p
          aria-hidden="true"
          className={cn(
            "flex items-center gap-2 text-small-b",
            METER_TEXT_CLASSES[tone],
          )}
        >
          <Icon className="size-4 shrink-0" />
          {info.message}
        </p>
        {live}
      </section>
    );
  }

  return (
    <div
      data-slot="sum-meter"
      data-state={info.state}
      className={cn(
        "flex items-center gap-4 rounded-md bg-surface px-4 py-3 shadow-2",
        className,
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn("size-5 shrink-0", METER_TEXT_CLASSES[tone])}
      />
      <span aria-hidden="true" className="text-h4 whitespace-nowrap nums">
        {info.display}
      </span>
      <MeterBar pct={info.pct} tone={tone} className="flex-1" />
      <span
        aria-hidden="true"
        className={cn(
          "text-small-b whitespace-nowrap",
          METER_TEXT_CLASSES[tone],
        )}
      >
        {info.message}
      </span>
      {live}
    </div>
  );
}
