import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { GRADE_PILL_SIZE_CLASSES } from "@/lib/grade-pill";
import {
  formatNota,
  GRADE_INK_CLASS,
  gradeColor,
  gradeInk,
} from "@/lib/grades";
import { puntosConSigno, REGLAS, REGLAS_TITULO } from "@/lib/ranking-vista";
import { cn } from "@/lib/utils";

/**
 * Píldora de ejemplo de la regla (HANDOFF §3 Ranking): mismo fondo `gradeColor` y tamaño sm que
 * `GradePill`, pero sin el chip «Raspado» que esa píldora añade bajo 10: aquí es una ilustración
 * de la regla «menos de 10 suma 0», no una nota.
 */
function EjemploNota({ valor }: { valor: number }) {
  return (
    <span
      style={{ backgroundColor: gradeColor(valor) }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-pill",
        GRADE_INK_CLASS[gradeInk(valor)],
        GRADE_PILL_SIZE_CLASSES.sm,
      )}
    >
      {formatNota(valor)}
    </span>
  );
}

/*
 * Aside «Cómo se calculan» (HANDOFF §3 Ranking, solo ≥ 1024; en móvil lo reemplaza el `<details>`
 * de `RankingHowTo`). Tres reglas con su ejemplo: nota ≥ 10 suma, nota < 10 suma 0 y el ajuste de
 * conducta mueve puntos, nunca la nota (D007).
 */
export function RankingRules({ className }: { className?: string }) {
  return (
    <section aria-labelledby="rk-reglas" className={className}>
      <Card className="flex flex-col gap-3">
        <CardTitle level={2} id="rk-reglas">
          {REGLAS_TITULO}
        </CardTitle>
        <ul className="text-small m-0 flex list-none flex-col gap-2 p-0">
          {REGLAS.map((r) => (
            <li key={r.clave} className="flex items-center gap-2">
              <span className="sr-only">Ejemplo: </span>
              {r.ejemplo.tipo === "nota" ? (
                <EjemploNota valor={r.ejemplo.valor} />
              ) : (
                <Badge variant="ok" className="h-6.5">
                  {puntosConSigno(r.ejemplo.valor)}
                </Badge>
              )}
              <span>{r.texto}</span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
