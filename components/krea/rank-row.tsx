import Link from "next/link";
import type * as React from "react";
import { RankDelta } from "@/components/krea/rank-delta";
import { Badge } from "@/components/ui/badge";
import { rankRowKind, rankRowLabel } from "@/lib/rank-row";
import { mostrarChipEmpate, type RankingPuesto } from "@/lib/ranking";
import { formatDecimal } from "@/lib/stepper";
import { cn } from "@/lib/utils";

export type RankRowProps = RankingPuesto & {
  nombre: string;
  puntos: number;
  /** Estudiante: su equipo. Equipo: "5 integrantes · capitán Christian Sepúlveda". */
  subtitulo?: string;
  /**
   * El avatar del estudiante (`UserAvatar size={40}`) o el logo del equipo (`TeamLogo size={40}`).
   * Una sola fila para los dos casos: solo cambia el medio y el subtítulo (D050).
   */
  media: React.ReactNode;
  /** Puestos que subió (+) o bajó (−); omitido = sin chip. */
  delta?: number;
  /** La fila del propio usuario (se combina con cualquier tipo de fila). */
  esTu?: boolean;
  /** Mientras viaja el FLIP: se eleva `scale(1.03)` + `shadow-3`. Lo apaga quien lo enciende. */
  moving?: boolean;
  /** Efecto de una sola vez: `sube` = brillo de acento, `riesgo` = temblor. */
  efecto?: "sube" | "riesgo";
  className?: string;
  /**
   * Fila interactiva (D259): `href` la vuelve un enlace (profe → ficha del alumno) y `onAbrir` un
   * botón que abre un diálogo (estudiante → tarjeta del compañero). Sin ninguno, es solo texto.
   * El nombre accesible pasa del `<li>` al enlace/botón: no se lee dos veces.
   */
  href?: string;
  onAbrir?: () => void;
  /** Duelo VS (D288): hay un empatado justo debajo; el conector se pinta en el hueco de abajo. */
  vsDespues?: boolean;
  /** Al `<li>`: es el elemento que el FLIP traslada (`useFlip().registrar(id)`). */
  ref?: React.Ref<HTMLLIElement>;
};

/*
 * Fila del ranking — HANDOFF §2.9; medidas en design/canvas/krea.css:336-343 (D050).
 * Tipos: top 10 (superficie + shadow-1, puesto en círculo), normal (11–30, sin fondo) y riesgo
 * (`--surface-2`, solo la imagen del avatar en gris y a .75: nunca la fila ni el texto, §8).
 * La fila propia suma fondo `--accent-soft` + borde interior 2 px + chip "tú".
 *
 * El `<li>` lleva el nombre accesible completo y el contenido visual va `aria-hidden`, así el
 * lector dice "Puesto 4, María Méndez, 30,5 puntos, subió 2 puestos" una vez. El `<li>` es el
 * objeto del FLIP (transform) y la caja visual va dentro: así el temblor, el brillo y la
 * elevación no pelean con el translateY del FLIP.
 */
export function RankRow({
  puesto,
  empate,
  enRiesgo,
  nombre,
  puntos,
  subtitulo,
  media,
  delta,
  esTu = false,
  moving = false,
  efecto,
  href,
  onAbrir,
  vsDespues = false,
  className,
  ref,
}: RankRowProps) {
  const kind = rankRowKind({ puesto, enRiesgo });
  const chipEmpate = mostrarChipEmpate({ puesto, empate, enRiesgo });
  const label = rankRowLabel({
    puesto,
    nombre,
    puntos,
    delta,
    empate: chipEmpate,
    esTu,
  });

  // Chip de empate o delta: a la derecha, o bajo el nombre si la fila es estrecha (D226). El
  // contenido visual va `aria-hidden`: pintarlo en dos sitios no lo repite al lector.
  const marca = chipEmpate ? (
    <Badge variant="neutral" className="h-5.5 px-2 text-xs!">
      Empate
    </Badge>
  ) : delta !== undefined ? (
    <RankDelta delta={delta} />
  ) : null;

  const interactiva = href !== undefined || onAbrir !== undefined;
  const claseToque =
    "block w-full rounded-rank text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

  const caja = (
    <div
      aria-hidden="true"
      data-slot="rank-row"
      data-kind={kind}
      data-me={esTu ? "true" : undefined}
      data-moving={moving ? "true" : undefined}
      className={cn(
        "grid min-h-15 grid-cols-[2.25rem_2.5rem_minmax(0,1fr)_auto_auto] items-center @max-fila:grid-cols-[2.25rem_2.5rem_minmax(0,1fr)_auto] gap-3 rounded-rank border border-transparent px-3 py-2",
        kind === "top" &&
          "bg-surface shadow-1 dark:border-divider dark:shadow-none",
        kind === "riesgo" && "bg-surface-2",
        esTu && "bg-accent-soft outline-2 -outline-offset-2 outline-accent",
        efecto === "sube" && "animate-glow",
        efecto === "riesgo" && "animate-shake",
      )}
    >
      <span
        className={cn(
          "text-grade-md text-center text-text-2",
          kind === "top" &&
            "mx-auto grid size-8 place-items-center rounded-pill bg-accent-soft-2 text-text",
        )}
      >
        {puesto}
      </span>

      <span
        className={cn(
          "flex",
          kind === "riesgo" && "[&_img]:opacity-75 [&_img]:grayscale",
        )}
      >
        {media}
      </span>

      <span className="min-w-0">
        <span className="flex items-center gap-1.5">
          <span className="text-button min-w-0 truncate">{nombre}</span>
          {esTu ? <Badge variant="tu">tú</Badge> : null}
        </span>
        {subtitulo || marca ? (
          <span className="flex min-w-0 items-center gap-1.5">
            {subtitulo ? (
              <span className="text-small min-w-0 truncate text-text-2">
                {subtitulo}
              </span>
            ) : null}
            {/* Fila estrecha (< 320 px, D226): el chip baja aquí y el nombre recupera el ancho */}
            {marca ? (
              <span className="hidden shrink-0 @max-fila:flex">{marca}</span>
            ) : null}
          </span>
        ) : null}
      </span>

      <span className="@max-fila:hidden">{marca}</span>

      <span
        className={cn(
          "text-grade-md min-w-13 text-right",
          kind === "riesgo" ? "text-text-2" : "text-text",
        )}
      >
        {formatDecimal(puntos)}
      </span>
    </div>
  );

  return (
    <li
      ref={ref}
      aria-label={interactiva ? undefined : label}
      className={cn(
        "@container list-none relative",
        vsDespues && "pb-6",
        className,
      )}
    >
      {href !== undefined ? (
        <Link href={href} aria-label={label} className={claseToque}>
          {caja}
        </Link>
      ) : onAbrir !== undefined ? (
        <button
          type="button"
          aria-label={label}
          aria-haspopup="dialog"
          onClick={onAbrir}
          className={cn(claseToque, "cursor-pointer")}
        >
          {caja}
        </button>
      ) : (
        caja
      )}
      {vsDespues ? (
        // Decorativo: el empate ya lo dice el nombre accesible de cada fila
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 flex h-6 items-center justify-center"
        >
          <span className="animate-vs text-small-b grid h-5.5 min-w-9 place-items-center rounded-pill bg-error px-2 text-on-error">
            VS
          </span>
        </span>
      ) : null}
    </li>
  );
}
