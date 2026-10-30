import { Crown } from "lucide-react";
import { TeamLogo } from "@/components/krea/team-logo";
import { UserAvatar } from "@/components/krea/user-avatar";
import type { DicebearEstilo } from "@/lib/dicebear";
import { podiumLabel } from "@/lib/rank-row";
import { formatDecimal } from "@/lib/stepper";
import { cn } from "@/lib/utils";

type PodiumBase = {
  id: string;
  /** Puesto de competencia (`rankCompetition`): en un empate, dos entradas pueden traer 2. */
  puesto: number;
  nombre: string;
  puntos: number;
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
 */
export function Podium({ entradas, label, className }: PodiumProps) {
  const lista = entradas.slice(0, 3);
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
        return (
          <li
            key={e.id}
            aria-label={podiumLabel(e)}
            data-puesto={e.puesto}
            className={cn("relative list-none min-w-0", ORDEN_VISUAL[i])}
          >
            <div
              aria-hidden="true"
              className="flex min-w-0 flex-col items-center gap-2 text-center"
            >
              {primero ? (
                <Crown
                  aria-hidden="true"
                  strokeWidth={2}
                  className="absolute -top-8 left-1/2 size-8 -translate-x-1/2 text-warning dark:text-secondary"
                />
              ) : null}
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
              <span className="text-pod-name max-w-full truncate">
                {e.nombre}
              </span>
              <span className="text-pod-pts">{formatDecimal(e.puntos)}</span>
              <span
                className={cn(
                  "flex w-full justify-center rounded-pod-step pt-2.5",
                  ESCALON[nivel],
                )}
              >
                {e.puesto}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
