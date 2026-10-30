import { Trophy } from "lucide-react";
import { TeamLogo } from "@/components/krea/team-logo";
import { Card } from "@/components/ui/card";
import { eyebrowEquipo } from "@/lib/equipo";
import { formatNota } from "@/lib/grades";

export type DatosEquipo = {
  id: string;
  nombre: string;
  tema: string | null;
  logo?: string | null;
  eyebrowSeccion: string;
  /** "Tema: Repostería · 4 integrantes". */
  meta: string;
  /** "#1 de 6". */
  puesto: string;
  puntos: number;
};

/**
 * Cabecera de Mi equipo (HANDOFF §3 Mi equipo §1): card hero con un círculo `--accent-soft` de
 * 240 decorativo; fila que envuelve (gap 24): TeamLogo 112, eyebrow + `<h1>` + meta, y dos
 * tarjetas planas (mín. 120) con el puesto (Trophy) y los puntos del equipo.
 */
export function TeamHero({ equipo }: { equipo: DatosEquipo }) {
  return (
    <Card variant="hero" className="relative overflow-hidden">
      <span
        aria-hidden="true"
        className="absolute -top-20 -right-15 size-60 rounded-full bg-accent-soft"
      />
      <div className="relative flex flex-wrap items-center gap-6">
        <TeamLogo
          teamId={equipo.id}
          tema={equipo.tema ?? equipo.nombre}
          src={equipo.logo}
          size={112}
        />
        <div className="flex min-w-55 flex-1 flex-col gap-2">
          <p className="text-eyebrow text-text-2">
            {eyebrowEquipo(equipo.eyebrowSeccion)}
          </p>
          <h1 className="text-h1 text-text">{equipo.nombre}</h1>
          <p className="text-body text-text-2">{equipo.meta}</p>
        </div>
        <dl className="m-0 flex flex-wrap gap-3">
          <Card
            variant="flat"
            className="flex min-w-30 flex-col items-center gap-0.5 p-4 text-center md:p-4"
          >
            <dt className="text-small text-text-2">Puesto</dt>
            <dd className="text-h2 nums m-0 flex items-center gap-1.5 text-text">
              <Trophy
                aria-hidden="true"
                className="size-5 shrink-0 text-text"
              />
              {equipo.puesto}
            </dd>
          </Card>
          <Card
            variant="flat"
            className="flex min-w-30 flex-col items-center gap-0.5 p-4 text-center md:p-4"
          >
            <dt className="text-small text-text-2">Puntos</dt>
            <dd className="text-h2 nums m-0 text-text">
              {formatNota(equipo.puntos)}
            </dd>
          </Card>
        </dl>
      </div>
    </Card>
  );
}
