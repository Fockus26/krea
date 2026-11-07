import { Crown } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { TeamLogo } from "@/components/krea/team-logo";
import { UserAvatar } from "@/components/krea/user-avatar";
import type { DicebearEstilo } from "@/lib/dicebear";
import { conectoresVsPodio, podiumLabel } from "@/lib/rank-row";
import { formatDecimal } from "@/lib/stepper";
import { cn } from "@/lib/utils";

type PodiumBase = {
  id: string;
  /** Puesto de competencia (`rankCompetition`): en un empate, dos entradas pueden traer 2. */
  puesto: number;
  nombre: string;
  puntos: number;
  /**
   * Columna interactiva (D259, solo estudiantes): `href` → enlace (profe), `onAbrir` → botón que
   * abre la tarjeta del compañero. El nombre accesible pasa del `<li>` al enlace/botón.
   */
  href?: string;
  onAbrir?: () => void;
};

export type PodiumEntrada = PodiumBase &
  (
    | { tipo: "estudiante"; estilo: DicebearEstilo; seed: string }
    | { tipo: "equipo"; teamId: string; tema: string; src?: string | null }
  );

type PodiumProps = {
  /** Las primeras 3 filas del ranking, en orden de puesto (se usan solo las 3 primeras). */
  entradas: readonly PodiumEntrada[];
  /** Nombre de la lista para el lector: "Podio de estudiantes". */
  label: string;
  className?: string;
};

// Orden visual 2-1-3 con el DOM en 1-2-3 (el lector recorre del 1.º al 3.º)
const ORDEN_VISUAL = ["order-2", "order-1", "order-3"] as const;

// Escalón por puesto (tope 3): color, número y alto (120/144, 88/104, 64/76)
const ESCALON: Record<1 | 2 | 3, string> = {
  1: "bg-accent text-on-accent text-pod-step-1 h-30 md:h-36",
  2: "bg-accent-soft-2 text-accent-ink text-pod-step h-22 md:h-26",
  3: "bg-accent-soft text-accent-ink text-pod-step h-16 md:h-19",
};

/*
 * Podio — HANDOFF §2.10; medidas en design/canvas/krea.css:326-335 (D052). `<ol>` de 3 columnas.
 * El escalón sigue el puesto de competencia (dos 2.º → dos escalones iguales); el lugar visual,
 * la posición en la lista. Con menos de 3 entradas quedan huecos a los lados, sin inventar filas.
 * Cada `<li>` lleva el nombre accesible y su contenido visual va `aria-hidden` (igual que RankRow).
 * La corona (Crown 32) va solo sobre los 1.º: `--warning` en claro, `--secondary` en oscuro.
 * Celebra (D258): la corona se balancea, un destello recorre cada escalón y los avatares rebotan
 * al montar (`animate-pop` corre una vez al insertarse, no en cada `onSnapshot`). Con reduced
 * motion todo queda quieto.
 */
export function Podium({ entradas, label, className }: PodiumProps) {
  const lista = entradas.slice(0, 3);
  const vs = conectoresVsPodio(lista.map((e) => e.puesto));
  return (
    <ol
      aria-label={label}
      data-slot="podium"
      className={cn(
        "grid grid-cols-3 items-end gap-2 pt-8 md:gap-4",
        className,
      )}
    >
      {lista.map((e, i) => {
        const nivel = Math.min(e.puesto, 3) as 1 | 2 | 3;
        const primero = nivel === 1;
        const size = primero ? 80 : 64;
        const interactiva = e.href !== undefined || e.onAbrir !== undefined;
        const claseToque =
          "block w-full rounded-pod-step outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";
        const columna = (
          <div
            aria-hidden="true"
            className="flex min-w-0 flex-col items-center gap-2 text-center"
          >
            {primero ? (
              <Crown
                aria-hidden="true"
                strokeWidth={2}
                className="animate-balanceo absolute -top-8 left-1/2 size-8 -translate-x-1/2 text-warning dark:text-secondary"
              />
            ) : null}
            <span className="animate-pop flex">
              {e.tipo === "estudiante" ? (
                <UserAvatar
                  estilo={e.estilo}
                  seed={e.seed}
                  nombre={e.nombre}
                  size={size}
                  ring={primero}
                />
              ) : (
                <TeamLogo
                  teamId={e.teamId}
                  tema={e.tema}
                  src={e.src}
                  size={size}
                />
              )}
            </span>
            <span className="text-pod-name max-w-full truncate">
              {e.nombre}
            </span>
            <span className="text-pod-pts">{formatDecimal(e.puntos)}</span>
            <span
              style={
                {
                  "--brillo-retardo": `${i * 700}ms`,
                } as React.CSSProperties
              }
              className={cn(
                "brillo-podio flex w-full justify-center rounded-pod-step pt-2.5",
                ESCALON[nivel],
              )}
            >
              {e.puesto}
            </span>
          </div>
        );
        return (
          <li
            key={e.id}
            aria-label={interactiva ? undefined : podiumLabel(e)}
            data-puesto={e.puesto}
            className={cn("relative list-none min-w-0", ORDEN_VISUAL[i])}
          >
            {e.href !== undefined ? (
              <Link
                href={e.href}
                aria-label={podiumLabel(e)}
                className={claseToque}
              >
                {columna}
              </Link>
            ) : e.onAbrir !== undefined ? (
              <button
                type="button"
                aria-label={podiumLabel(e)}
                aria-haspopup="dialog"
                onClick={e.onAbrir}
                className={cn(claseToque, "cursor-pointer")}
              >
                {columna}
              </button>
            ) : (
              columna
            )}
            {vs[i] ? (
              // Decorativo (D289): el empate ya lo dice el nombre accesible de cada columna
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-10 right-0 z-10 translate-x-1/2"
              >
                <span className="animate-vs text-small-b grid h-5.5 min-w-9 place-items-center rounded-pill bg-error px-2 text-on-error">
                  VS
                </span>
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
