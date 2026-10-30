import { Users } from "lucide-react";
import Link from "next/link";
import {
  AvatarStack,
  type AvatarStackItem,
} from "@/components/krea/avatar-stack";
import { EmptyState } from "@/components/krea/empty-state";
import { TeamLogo } from "@/components/krea/team-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export type ResumenEquipo = {
  id: string;
  nombre: string;
  /** Tema o, si no hay, el nombre: de ahí sale la inicial del logo. */
  tema: string | null;
  logo?: string | null;
  /** "#1 de 6 · 19 pts". */
  chip: string;
  /** "Tema: Repostería · 4 integrantes". */
  meta: string;
  integrantes: readonly AvatarStackItem[];
  capitan: { etiqueta: string; quien: string };
};

/**
 * "Mi equipo" de Inicio (HANDOFF §3 Inicio §5): h2 + chip acc; TeamLogo 64 + nombre (tamaño h3)
 * + meta; pila de avatares + capitán + "Ver equipo". La fila de abajo envuelve a 320.
 * Sin equipo: "Todavía no tienes equipo" (lienzo Vacíos).
 */
export function TeamSummary({
  equipo,
  equipoHref,
}: {
  equipo: ResumenEquipo | null;
  equipoHref: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle level={2}>Mi equipo</CardTitle>
        {equipo ? (
          <Badge variant="acc" className="nums">
            {equipo.chip}
          </Badge>
        ) : null}
      </CardHeader>
      {equipo ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <TeamLogo
              teamId={equipo.id}
              tema={equipo.tema ?? equipo.nombre}
              src={equipo.logo}
              size={64}
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-h3 text-text">{equipo.nombre}</h3>
              <p className="text-small text-text-2">{equipo.meta}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <AvatarStack items={equipo.integrantes} size={36} />
              <span className="text-small text-text-2">
                {equipo.capitan.etiqueta}{" "}
                <strong className="text-text">{equipo.capitan.quien}</strong>
              </span>
            </div>
            <Button asChild variant="secondary" size="sm">
              <Link href={equipoHref}>Ver equipo</Link>
            </Button>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="Todavía no tienes equipo"
          description="Tu profe te asignará uno en clase. Mientras, tus notas individuales sí suman al ranking."
        />
      )}
    </Card>
  );
}
