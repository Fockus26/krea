import { ChevronLeft, ChevronRight, Gift, User, Users } from "lucide-react";
import Link from "next/link";
import { TeamLogo } from "@/components/krea/team-logo";
import { UserAvatar } from "@/components/krea/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DicebearEstilo } from "@/lib/dicebear";

export type ReviewIdentity =
  | { tipo: "equipo"; teamId: string; tema: string }
  | { tipo: "alumno"; estilo: DicebearEstilo; seed: string; nombre: string };

/**
 * Cabecera de Evaluar entrega (HANDOFF §3; lienzo Evaluar.dc.html): eyebrow "Por evaluar ·
 * entrega 1 de 7" con Anterior / Saltar (solo ≥ 1024; en móvil la topbar dice la posición),
 * TeamLogo o avatar 56 decorativos junto al `<h1>` (alumno o equipo), la línea "{tarea} ·
 * entregó …" y chips de tipo, sección, base y premio (ícono + palabra, nunca solo color).
 * El `<h1>` lleva `tabIndex={-1}`: al guardar, el foco vuelve aquí con la entrega siguiente.
 */
export function ReviewHeader({
  eyebrow,
  titulo,
  tituloId,
  identidad,
  linea,
  chips,
  anteriorHref,
  saltarHref,
}: {
  eyebrow: string;
  titulo: string;
  tituloId: string;
  identidad: ReviewIdentity;
  linea: string;
  chips: {
    tipo: "individual" | "grupal";
    /** "Grupal · 4 integrantes". */
    tipoTexto: string;
    /** "Sección 5A". */
    seccion: string;
    /** "Base 20 · todos". */
    base: string;
    premio?: string;
  };
  /** `null` en la primera de la cola (Anterior deshabilitado). */
  anteriorHref: string | null;
  /** `null` en la última (Saltar deshabilitado). */
  saltarHref: string | null;
}) {
  const TipoIcon = chips.tipo === "grupal" ? Users : User;
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-eyebrow text-text-2">{eyebrow}</p>
        <nav
          // PROVISIONAL (CONTENT_CHECKLIST 81): nombre de la navegación de la cola
          aria-label="Cola por evaluar"
          className="flex gap-2 max-lg:hidden"
        >
          {anteriorHref ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={anteriorHref}>
                <ChevronLeft aria-hidden="true" />
                Anterior
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" disabled>
              <ChevronLeft aria-hidden="true" />
              Anterior
            </Button>
          )}
          {saltarHref ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={saltarHref}>
                Saltar
                <ChevronRight aria-hidden="true" />
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" disabled>
              Saltar
              <ChevronRight aria-hidden="true" />
            </Button>
          )}
        </nav>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {identidad.tipo === "equipo" ? (
          <TeamLogo teamId={identidad.teamId} tema={identidad.tema} size={56} />
        ) : (
          <UserAvatar
            estilo={identidad.estilo}
            seed={identidad.seed}
            nombre={identidad.nombre}
            size={56}
          />
        )}
        {/* mín. 220 antes de envolver (lienzo) */}
        <div className="flex min-w-[min(--spacing(55),100%)] flex-1 flex-col gap-1">
          <h1 id={tituloId} tabIndex={-1} className="text-h1 text-text">
            {titulo}
          </h1>
          <p className="text-body text-text-2">{linea}</p>
        </div>
      </div>

      <ul className="flex flex-wrap gap-2">
        <li>
          <Badge variant="neutral">
            <TipoIcon aria-hidden="true" />
            {chips.tipoTexto}
          </Badge>
        </li>
        <li>
          <Badge variant="neutral">{chips.seccion}</Badge>
        </li>
        <li>
          <Badge variant="base">{chips.base}</Badge>
        </li>
        {chips.premio ? (
          <li>
            <Badge variant="prize">
              <Gift aria-hidden="true" />
              {chips.premio}
            </Badge>
          </li>
        ) : null}
      </ul>
    </header>
  );
}
