import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { indiceChips, indiceTitulo, preguntaAncla } from "@/lib/evaluar";
import { cn } from "@/lib/utils";

/**
 * Índice de preguntas 1…n (lienzo Extremos.dc.html, "Tarea de 10 preguntas · índice al
 * evaluar"): desde 6 preguntas, bajo el medidor. Cada chip enlaza al enunciado
 * (`#pregunta-n`); puntuada = chip `ok` con Check, la actual con anillo de acento y
 * `aria-current="step"`. El nombre accesible repite el estado ("Pregunta 7, sin puntuar,
 * actual"): nunca solo el color.
 */
export function ReviewIndex({
  scores,
  actual,
  className,
}: {
  scores: ReadonlyArray<number | null>;
  /** Pregunta con el foco (desde 0) o `null`. */
  actual: number | null;
  className?: string;
}) {
  const chips = indiceChips(scores, actual);
  return (
    <nav
      // Copy del lienzo (Extremos)
      aria-label="Ir a la pregunta"
      className={cn("flex flex-col gap-2", className)}
    >
      <p className="text-small-b text-text">{indiceTitulo(scores)}</p>
      <ul className="flex flex-wrap gap-2 max-lg:gap-4">
        {chips.map((c) => (
          <li key={c.numero}>
            <Badge
              asChild
              variant={c.puntuada ? "ok" : "neutral"}
              className={cn(
                // Chip de 28 px con 44 de área táctil; la separación evita que se pisen (D215)
                "nums relative no-underline max-lg:after:absolute max-lg:after:-inset-2",
                c.actual && "ring-2 ring-accent ring-inset",
              )}
            >
              <a
                href={`#${preguntaAncla(c.numero)}`}
                aria-label={c.label}
                aria-current={c.actual ? "step" : undefined}
              >
                {c.puntuada ? <Check aria-hidden="true" /> : null}
                {c.numero}
              </a>
            </Badge>
          </li>
        ))}
      </ul>
    </nav>
  );
}
