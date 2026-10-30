"use client";

import { TriangleAlert } from "lucide-react";
import { useId } from "react";
import { RankRow, type RankRowProps } from "@/components/krea/rank-row";
import { useFlip } from "@/components/krea/use-flip";
import { RIESGO_SEPARADOR, splitRiesgo } from "@/lib/rank-row";
import { cn } from "@/lib/utils";

export type RankListFila = Omit<RankRowProps, "ref" | "className"> & {
  /** Clave estable de la fila (alumno o equipo): el FLIP la sigue al reordenar. */
  id: string;
};

type RankListProps = {
  /** Ya ordenadas y con puestos (`rankCompetition`); las filas en riesgo van al final. */
  filas: readonly RankListFila[];
  /** Nombre de la lista para el lector: "Ranking de estudiantes". */
  label: string;
  className?: string;
};

/*
 * Lista del ranking con separador de riesgo — HANDOFF §2.9 (D051).
 * Dos `<ol>` (principal y zona de riesgo) con el separador entre ambos como un `<p>` que da el
 * nombre a la segunda lista (`aria-labelledby`): el lector cuenta bien las filas de cada una y el
 * separador no es un `<li>` de más. Reordena con FLIP (`useFlip`) al cambiar el orden de `filas`.
 */
export function RankList({ filas, label, className }: RankListProps) {
  const riesgoId = useId();
  const { registrar } = useFlip<HTMLLIElement>();
  const { principal, riesgo } = splitRiesgo(filas);

  const pintar = (lista: readonly RankListFila[]) =>
    lista.map(({ id, ...fila }) => (
      <RankRow key={id} ref={registrar(id)} {...fila} />
    ));

  return (
    <div data-slot="rank-list" className={cn("flex flex-col", className)}>
      {principal.length > 0 ? (
        <ol aria-label={label} className="flex flex-col gap-1">
          {pintar(principal)}
        </ol>
      ) : null}
      {riesgo.length > 0 ? (
        <>
          <p
            id={riesgoId}
            className={cn(
              "text-eyebrow flex items-center gap-2 text-error after:h-0 after:flex-1 after:border-t-2 after:border-dashed after:border-current after:opacity-50 after:content-['']",
              principal.length > 0 ? "mt-5 mb-2" : "mb-2",
            )}
          >
            <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
            {RIESGO_SEPARADOR}
          </p>
          <ol aria-labelledby={riesgoId} className="flex flex-col gap-1">
            {pintar(riesgo)}
          </ol>
        </>
      ) : null}
    </div>
  );
}
