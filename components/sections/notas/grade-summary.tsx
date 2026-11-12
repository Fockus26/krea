import { ChevronUp, User, Users } from "lucide-react";
import { GradePill } from "@/components/krea/grade-pill";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatNota, puntosRanking } from "@/lib/grades";
import {
  alertaBaseTexto,
  aporteTexto,
  formulaBaseTexto,
  NO_PARTICIPASTE,
  PUNTAJE_EQUIPO,
  puntajeTexto,
} from "@/lib/notas";

/**
 * Resumen del Detalle de nota (HANDOFF §3 Detalle): tarjeta hero con padding 24; eyebrow tipo +
 * fecha, el `<h1>` de la página, `GradePill xl` con la nota final y un `<dl>` (mín. 220):
 * Puntaje, Base + fórmula si la base no es 20, y lo que aporta al ranking (`--success` + ChevronUp;
 * si es menor de 10, "0 pts" en `--text-2`: el chip Raspado ya lo pinta la píldora). Con base,
 * alerta info. La píldora no repite el chip Base: va en el `<dl>` junto a su fórmula.
 * `noParticipo` (D367): el profe lo marcó «No participó» en la grupal; la nota es 1 fija, sin
 * base (sin fórmula ni alerta de base), el puntaje se rotula «del equipo» y una alerta lo explica.
 */
export function GradeSummary({
  tipo,
  eyebrow,
  titulo,
  puntaje,
  base,
  final,
  noParticipo = false,
}: {
  tipo: "individual" | "grupal";
  eyebrow: string;
  titulo: string;
  /** Sobre 20, sin escalar. */
  puntaje: number;
  base: number;
  /** Con la base aplicada (D013). */
  final: number;
  noParticipo?: boolean;
}) {
  const Icon = tipo === "grupal" ? Users : User;
  const conBase = base !== 20 && !noParticipo;
  const suma = puntosRanking(final) > 0;
  return (
    <Card variant="hero" className="flex flex-col gap-4 p-6 md:p-6">
      <div className="flex flex-col gap-2">
        <p className="text-eyebrow flex icono-linea gap-1.5 text-text-2">
          <Icon aria-hidden="true" className="size-4 shrink-0" />
          {eyebrow}
        </p>
        <h1 className="text-h1 text-text">{titulo}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <GradePill nota={final} size="xl" />
        <dl className="m-0 flex min-w-[min(--spacing(55),100%)] flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-x-3">
            <dt className="text-body text-text-2">
              {noParticipo ? PUNTAJE_EQUIPO : "Puntaje"}
            </dt>
            <dd className="text-h3 nums m-0 text-text">
              {puntajeTexto(puntaje)}
            </dd>
          </div>
          {conBase ? (
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <dt>
                <Badge variant="base">Base {formatNota(base)}</Badge>
              </dt>
              <dd className="text-small-b nums m-0 text-text">
                {formulaBaseTexto(puntaje, base, final)}
              </dd>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-x-3">
            <dt className="text-body text-text-2">Aporta al ranking</dt>
            {suma ? (
              <dd className="text-h4 nums m-0 flex icono-linea gap-1 text-success">
                <ChevronUp aria-hidden="true" className="size-4 shrink-0" />
                {aporteTexto(final)}
              </dd>
            ) : (
              <dd className="text-h4 nums m-0 text-text-2">
                {aporteTexto(final)}
              </dd>
            )}
          </div>
        </dl>
      </div>
      {noParticipo ? (
        <Alert variant="info">
          <AlertDescription>{NO_PARTICIPASTE}</AlertDescription>
        </Alert>
      ) : conBase ? (
        <Alert variant="info">
          <AlertDescription>{alertaBaseTexto(base)}</AlertDescription>
        </Alert>
      ) : null}
    </Card>
  );
}
