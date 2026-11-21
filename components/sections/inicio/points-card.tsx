import { ArrowRight, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import Link from "next/link";
import { useId } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatNota } from "@/lib/grades";
import { deltaSemanaTexto, puestoTexto } from "@/lib/inicio";

/**
 * Tarjeta de puntos de Inicio (HANDOFF §3 Inicio §2). No es una `Card` con otra variante (§8):
 * fondo `--accent`, texto `--on-accent`, `--shadow-2`, radio 24 y dos círculos `--splash`
 * decorativos. El eyebrow es el h2 de la región (con estilo eyebrow), como los h2 de las demás
 * tarjetas; el puesto es texto con tamaño h3, no un encabezado.
 */
export function PointsCard({
  puntos,
  puesto,
  total,
  seccion,
  desglose,
  deltaSemana,
  rankingHref,
}: {
  puntos: number;
  puesto: number;
  total: number;
  seccion: string;
  /** `desglosePuntos(…)` de lib/inicio. */
  desglose: string;
  /** Puestos subidos (+) o bajados (−) esta semana; 0 oculta el chip. */
  deltaSemana: number;
  rankingHref: string;
}) {
  const id = useId();
  const delta = deltaSemanaTexto(deltaSemana);
  const DeltaIcon = deltaSemana < 0 ? TrendingDown : TrendingUp;
  return (
    <section
      aria-labelledby={id}
      // Claro: accent-ink = accent salvo en rojo, donde accent deja sin margen el texto (D217).
      // Oscuro: accent-ink es el tono claro para texto sobre fondo oscuro; el relleno es --accent,
      // ya oscurecido para el texto blanco (D301, D497).
      className="relative overflow-hidden rounded-lg bg-accent-ink p-6 dark:bg-accent text-on-accent shadow-2 dark:shadow-none"
    >
      <span
        aria-hidden="true"
        className="absolute -top-9 -right-7 size-40 rounded-pill bg-splash opacity-20"
      />
      <span
        aria-hidden="true"
        className="absolute top-7 right-18 size-7 rounded-pill bg-splash opacity-50"
      />
      <div className="relative flex flex-col gap-4">
        <h2 id={id} className="text-eyebrow">
          Tus puntos del ranking
        </h2>
        <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
          <p className="text-display">{formatNota(puntos)}</p>
          <p className="flex items-center gap-2 pb-2.5">
            <Trophy aria-hidden="true" className="size-6 shrink-0" />
            <span className="text-h3 nums">{puestoTexto(puesto, total)}</span>
            <span className="text-small">en {seccion}</span>
          </p>
        </div>
        <p className="text-small max-w-105">{desglose}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={rankingHref}
            className={buttonVariants(
              { variant: "ghost" },
              "bg-surface text-accent-ink",
            )}
          >
            Ver ranking
            <ArrowRight aria-hidden="true" />
          </Link>
          {delta ? (
            <Badge className="bg-on-accent/12 text-on-accent">
              <DeltaIcon aria-hidden="true" />
              {delta}
            </Badge>
          ) : null}
        </div>
      </div>
    </section>
  );
}
