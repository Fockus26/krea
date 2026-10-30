import { type QuestionVariant, questionValueText } from "@/lib/question";
import { cn } from "@/lib/utils";

type QuestionHeaderProps = {
  /** Número de la pregunta (1, 2, 3…). */
  numero: number;
  enunciado: string;
  /** Puntos que vale la pregunta. */
  valor: number;
  /** Define el texto del valor: "3,5 / 4" · "vale 4" · "4 pts" (§2.16). */
  variant: QuestionVariant;
  /** Solo en `detalle`: puntos obtenidos; `null` = Pendiente (D003). */
  obtenido?: number | null;
  /** Nivel del encabezado del enunciado; lo decide el llamador según dónde viva. */
  level?: 2 | 3 | 4;
  /** `id` del enunciado: el `aria-labelledby` del ScorePicker o del campo de respuesta. */
  titleId?: string;
  className?: string;
};

/*
 * Cabecera compartida por las tres tarjetas de pregunta — HANDOFF §2.16; medidas en
 * design/canvas/krea.css:439-442. Es lo ÚNICO que comparten (§8): los cuerpos son distintos.
 */
export function QuestionHeader({
  numero,
  enunciado,
  valor,
  variant,
  obtenido,
  level = 4,
  titleId,
  className,
}: QuestionHeaderProps) {
  const Heading = `h${level}` as const;
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <span
        data-slot="question-number"
        className="grid size-8 shrink-0 place-items-center rounded-sm bg-accent-soft-2 font-heading text-[0.9375rem] leading-none font-bold text-text"
      >
        <span className="sr-only">Pregunta </span>
        {numero}
      </span>
      <Heading id={titleId} className="text-h4 min-w-0 flex-1 text-text">
        {enunciado}
      </Heading>
      <span
        data-slot="question-value"
        className="nums shrink-0 font-heading text-sm leading-5 font-bold whitespace-nowrap text-text-2"
      >
        {questionValueText(variant, valor, obtenido)}
      </span>
    </div>
  );
}
