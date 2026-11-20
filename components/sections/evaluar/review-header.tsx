import { ChevronLeft, ChevronRight, Gift, User, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { TeamLogo } from "@/components/krea/team-logo";
import { UserAvatar } from "@/components/krea/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DicebearEstilo } from "@/lib/dicebear";
import { BaseChip } from "./review-base";

/** Móvil: cada botón reparte el ancho y mide 44 px de alto; ≥ lg, el `sm` de siempre. */
const NAV_BTN = "max-lg:min-h-11 max-lg:flex-1";

/** PROVISIONAL (CONTENT_CHECKLIST fila 247): la línea del filtro sin filtros (D442). */
const SIN_FILTROS = "Por evaluar, sin filtros";

export type ReviewIdentity =
  | { tipo: "equipo"; teamId: string; tema: string }
  | { tipo: "alumno"; estilo: DicebearEstilo; seed: string; nombre: string };

/**
 * Cabecera de Evaluar entrega (HANDOFF §3; lienzo Evaluar.dc.html): eyebrow "Por evaluar ·
 * entrega 1 de 7" con Anterior / Saltar (también en móvil, a ancho completo y con área táctil de
 * 44 px, D386), la línea del filtro activo con «Cambiar» (D385),
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
  filtroTexto,
  colaHref,
  cambiar,
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
    /** "Base 15" (individual: la de esta tarea al abrir) / "Base de cada integrante". */
    base: string;
    premio?: string;
  };
  /** `null` en la primera de la cola (Anterior deshabilitado). */
  anteriorHref: string | null;
  /** `null` en la última (Saltar deshabilitado). */
  saltarHref: string | null;
  /** «Grupales · 5A» si la cola está filtrada (D385). */
  filtroTexto?: string | null;
  /** La cola filtrable con esos mismos filtros. */
  colaHref?: string;
  /** El botón «Cambiar» que abre los filtros (D442); sin él, enlace a la cola. */
  cambiar?: ReactNode;
}) {
  const TipoIcon = chips.tipo === "grupal" ? Users : User;
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-eyebrow text-text-2">{eyebrow}</p>
        <nav
          // PROVISIONAL (CONTENT_CHECKLIST 81): nombre de la navegación de la cola
          aria-label="Cola por evaluar"
          className="flex w-full gap-2 lg:w-auto"
        >
          {anteriorHref ? (
            <Button asChild variant="ghost" size="sm" className={NAV_BTN}>
              <Link href={anteriorHref}>
                <ChevronLeft aria-hidden="true" />
                Anterior
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" disabled className={NAV_BTN}>
              <ChevronLeft aria-hidden="true" />
              Anterior
            </Button>
          )}
          {saltarHref ? (
            <Button asChild variant="ghost" size="sm" className={NAV_BTN}>
              <Link href={saltarHref}>
                Saltar
                <ChevronRight aria-hidden="true" />
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" disabled className={NAV_BTN}>
              Saltar
              <ChevronRight aria-hidden="true" />
            </Button>
          )}
        </nav>
        {cambiar ? (
          // «Cambiar» abre los filtros aquí mismo (D442): la línea sale también sin filtros
          <div className="flex w-full flex-wrap items-center gap-x-2 text-small text-text-2">
            {/* PROVISIONAL (CONTENT_CHECKLIST filas 197 y 247) */}
            <span>
              Filtro:{" "}
              <span className="text-body-strong">
                {filtroTexto ?? SIN_FILTROS}
              </span>
            </span>
            {cambiar}
          </div>
        ) : filtroTexto && colaHref ? (
          <p className="flex w-full flex-wrap items-center gap-x-2 text-small text-text-2">
            {/* PROVISIONAL (CONTENT_CHECKLIST fila 197) */}
            <span>
              Filtro: <span className="text-body-strong">{filtroTexto}</span>
            </span>
            <Button asChild variant="ghost" size="sm">
              <Link href={colaHref}>Cambiar</Link>
            </Button>
          </p>
        ) : null}
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
          {/* En individual sigue en vivo la «Base de esta tarea» del formulario (D405) */}
          <BaseChip texto={chips.base} />
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
