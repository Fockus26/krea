import { barWidth, questionBar } from "@/lib/question";
import { cn } from "@/lib/utils";

type QuestionBarProps = {
  /** Puntos obtenidos; `null` = Pendiente: sin relleno, nunca 0 (D003). */
  obtenido: number | null;
  /** Puntos que vale la pregunta. */
  valor: number;
  /**
   * Oculta el texto "3,5 / 4" de al lado. Solo cuando la misma cifra ya está en texto justo
   * al lado (p. ej. el valor de la cabecera de `QuestionCardDetail`); la barra sola no dice nada.
   */
  hideText?: boolean;
  className?: string;
};

/*
 * Barra por pregunta — HANDOFF §2.11; medidas en design/canvas/krea.css:302-304.
 * Alto 8, radio 999, pista `--surface-3`, relleno `gradeColor(obtenido / valor × 20)`. La barra es
 * `aria-hidden` y siempre va con la cifra en texto. El ancho se fija por `width` y no se anima:
 * el relleno cambia con los datos, no con el movimiento (nada que reducir con reduced motion).
 */
export function QuestionBar({
  obtenido,
  valor,
  hideText = false,
  className,
}: QuestionBarProps) {
  const { fraction, color, text } = questionBar(obtenido, valor);
  return (
    <div
      data-slot="question-bar"
      className={cn("flex items-center gap-3", className)}
    >
      <div
        aria-hidden="true"
        className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-pill bg-surface-3"
      >
        {color ? (
          <i
            className="absolute inset-y-0 left-0 block rounded-pill"
            style={{ width: barWidth(fraction), backgroundColor: color }}
          />
        ) : null}
      </div>
      {hideText ? null : (
        <span className="text-small-b nums shrink-0 text-text-2">{text}</span>
      )}
    </div>
  );
}
