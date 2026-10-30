import { Clock, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  GRADE_PILL_PENDING_CLASSES,
  GRADE_PILL_SIZE_CLASSES,
  type GradePillSize,
  gradePillLabel,
  gradePillState,
  showsBase,
} from "@/lib/grade-pill";
import { formatNota, gradeColor } from "@/lib/grades";
import { cn } from "@/lib/utils";

type GradePillProps = {
  /** Nota de 1 a 20; `null` = Pendiente (D003). */
  nota: number | null;
  size?: GradePillSize;
  /** Base de evaluación del alumno; si no es 20 aparece el chip `Base n` (D006). */
  base?: number;
  /** Modo tabla: el Raspado va como ícono de 16 px en lugar del chip. */
  table?: boolean;
  className?: string;
};

/*
 * Píldora de nota — HANDOFF §2.3. Fondo `gradeColor(n)` (único valor dinámico, viene de la
 * función) y número en `--grade-ink` (#111111): nunca texto de color ni sin número (D004).
 * Pendiente se pinta aparte, sin color de escala y nunca como "0".
 */
export function GradePill({
  nota,
  size = "md",
  base,
  table = false,
  className,
}: GradePillProps) {
  const state = gradePillState(nota);
  const isXl = size === "xl";

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-2", className)}>
      {nota === null ? (
        <span
          data-slot="grade-pill"
          data-state="pendiente"
          className={cn(
            "inline-flex items-center justify-center gap-1 rounded-pill border-2 border-dashed border-text-2 whitespace-nowrap text-text-2",
            GRADE_PILL_PENDING_CLASSES[size],
          )}
        >
          <Clock aria-hidden="true" className="size-3.5 shrink-0" />
          Pendiente
        </span>
      ) : (
        <span
          data-slot="grade-pill"
          data-state={state}
          style={{ backgroundColor: gradeColor(nota) }}
          className={cn(
            "relative inline-flex items-center justify-center gap-1 rounded-pill whitespace-nowrap text-grade-ink",
            GRADE_PILL_SIZE_CLASSES[size],
          )}
        >
          {isXl ? (
            <>
              <span aria-hidden="true">{formatNota(nota)}</span>
              <span className="sr-only">{gradePillLabel(nota)}</span>
            </>
          ) : (
            formatNota(nota)
          )}
        </span>
      )}

      {state === "raspado" ? (
        table ? (
          <TriangleAlert
            role="img"
            aria-label="Raspada"
            className="size-4 shrink-0 text-error"
          />
        ) : (
          <Badge variant="err">
            <TriangleAlert aria-hidden="true" />
            Raspado
          </Badge>
        )
      ) : null}

      {showsBase(base) ? (
        <Badge variant="base">Base {formatNota(base)}</Badge>
      ) : null}
    </span>
  );
}
