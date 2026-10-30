import { Check, TriangleAlert } from "lucide-react";
import { GradePill } from "@/components/krea/grade-pill";
import { MeterBar } from "@/components/krea/meter-bar";
import { cardVariants } from "@/components/ui/card";
import { liveTotalInfo, METER_TEXT_CLASSES } from "@/lib/meters";
import { cn } from "@/lib/utils";

type LiveTotalProps = {
  /** Puntaje de cada pregunta de la entrega, en orden; `null` = sin puntuar. */
  scores: ReadonlyArray<number | null>;
  /** Base de evaluación del alumno, 10–20 (D006). La nota sale de `notaFinal` (D013). */
  base?: number;
  /**
   * `bar`: fila compacta (móvil; sticky a 64 px la pone la página).
   * `card`: tarjeta del aside de escritorio (eyebrow, píldora lg, barra de puntuadas, aviso).
   */
  variant?: "bar" | "card";
  /** Nivel del título de la tarjeta (eyebrow "Total en vivo"). Solo `card`. */
  headingLevel?: 2 | 3 | 4;
  className?: string;
};

/*
 * Total en vivo de evaluación — HANDOFF §2.11 y §3 "Evaluar entrega"; lienzo Evaluar.dc.html:54-57
 * (barra) y :115-123 (tarjeta) (D057). No comparte componente con `SumMeter` (§8: datos y reglas
 * distintos); solo la barra interna `MeterBar` y las clases de `lib/meters.ts`.
 * Pendiente (faltan preguntas) en warning; completo en success, con ícono + texto.
 * Un único `role="status"` atómico con la frase completa ("Total 9 de 20, nota 9. 2 de 5
 * puntuadas."); lo visible va `aria-hidden` para no leerse dos veces.
 */
export function LiveTotal({
  scores,
  base = 20,
  variant = "bar",
  headingLevel = 2,
  className,
}: LiveTotalProps) {
  const info = liveTotalInfo(scores, base);
  const tone = info.completo ? "success" : "warning";
  const live = (
    // <output> = role="status" implícito
    <output className="sr-only" aria-live="polite" aria-atomic="true">
      {info.srText}
    </output>
  );

  if (variant === "card") {
    const Heading = `h${headingLevel}` as const;
    const Icon = info.completo ? Check : TriangleAlert;
    return (
      <section
        data-slot="live-total"
        data-complete={info.completo || undefined}
        className={cn(
          cardVariants(),
          "flex flex-col gap-4 shadow-2",
          className,
        )}
      >
        <Heading className="text-eyebrow">Total en vivo</Heading>
        <div aria-hidden="true" className="flex items-center gap-4">
          {/* §3 pide 88 × 64 (fuente 32); GradePill no tiene ese tamaño: lg (44) hasta tener token */}
          <GradePill nota={info.nota} size="lg" table />
          <div className="flex flex-col gap-0.5">
            <span className="text-h2 nums">{info.display}</span>
            <span className="text-small text-text-2">{info.baseText}</span>
          </div>
        </div>
        <MeterBar pct={info.pctPuntuadas} tone="accent" />
        <p
          aria-hidden="true"
          className={cn(
            "flex items-center gap-2 text-small-b",
            METER_TEXT_CLASSES[tone],
          )}
        >
          <Icon className="size-4 shrink-0" />
          {info.pending}
        </p>
        {live}
      </section>
    );
  }

  return (
    <div
      data-slot="live-total"
      data-complete={info.completo || undefined}
      className={cn(
        "flex items-center gap-4 rounded-md bg-surface px-4 py-3 shadow-2",
        className,
      )}
    >
      <span aria-hidden="true" className="shrink-0">
        <GradePill nota={info.nota} size="md" table />
      </span>
      <div aria-hidden="true" className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-h4 whitespace-nowrap nums">{info.display}</span>
          <span
            className={cn(
              "flex items-center gap-1 text-small-b whitespace-nowrap",
              METER_TEXT_CLASSES[tone],
            )}
          >
            {info.completo ? <Check className="size-4 shrink-0" /> : null}
            {info.progress}
          </span>
        </div>
        <MeterBar pct={info.pctTotal} tone={tone} />
      </div>
      {live}
    </div>
  );
}
