"use client";

import { CircleAlert } from "lucide-react";
import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { SeccionId } from "@/lib/modelo";
import { agruparPorAnio } from "@/lib/secciones";
import { seccionesTareaTexto } from "@/lib/tareas-profe";

/**
 * «Secciones» del constructor (D324): una casilla por sección del catálogo, agrupadas por año
 * (`fieldset` + `legend` «5.º año» dentro del `fieldset` «Secciones»); hace falta al menos una.
 * Una sección elegida que el catálogo ya no tiene se sigue mostrando con su código (no debería
 * pasar: solo se elimina vacía, D318). El resumen («La reciben 4B y 5A») no es región viva: las
 * casillas ya anuncian su estado. Con error, la primera casilla lleva `aria-invalid` (el foco al
 * primer inválido la encuentra) y el `fieldset`, el mensaje por `aria-describedby`.
 * PROVISIONAL de copy (CONTENT_CHECKLIST fila 168).
 */
export function TaskSections({
  secciones,
  elegidas,
  onCambio,
  disabled = false,
  error,
}: {
  /** Secciones del catálogo, ordenadas. */
  secciones: readonly SeccionId[];
  elegidas: readonly SeccionId[];
  onCambio: (codigo: SeccionId, marcada: boolean) => void;
  disabled?: boolean;
  error?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const resumenId = `${id}-resumen`;
  const grupos = agruparPorAnio([...secciones, ...elegidas]);
  const primera = grupos[0]?.secciones[0];
  return (
    <fieldset
      className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0"
      aria-describedby={error ? `${errorId} ${resumenId}` : resumenId}
    >
      <legend className="mb-1.5 text-label text-text">
        Secciones{" "}
        <span aria-hidden="true" className="text-error">
          *
        </span>
        <span className="sr-only">(obligatorio, al menos una)</span>
      </legend>
      {grupos.map((g) => (
        <fieldset key={g.numero} className="m-0 min-w-0 border-0 p-0">
          <legend className="mb-1 text-small text-text-2">{g.nombre}</legend>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {g.secciones.map((s) => {
              const casilla = `${id}-${s}`;
              return (
                <div key={s} className="flex min-h-11 items-center gap-2">
                  <Checkbox
                    id={casilla}
                    checked={elegidas.includes(s)}
                    onCheckedChange={(v) => onCambio(s, v === true)}
                    disabled={disabled}
                    aria-invalid={error && s === primera ? true : undefined}
                  />
                  <label
                    htmlFor={casilla}
                    className="nums cursor-pointer text-body text-text peer-disabled:cursor-not-allowed peer-disabled:text-text-2"
                  >
                    {s}
                  </label>
                </div>
              );
            })}
          </div>
        </fieldset>
      ))}
      <p id={resumenId} className="text-small text-text-2">
        {elegidas.length > 0
          ? `La reciben ${seccionesTareaTexto(elegidas)}.`
          : "Todavía no la recibe ninguna sección."}
      </p>
      {error ? (
        <p
          id={errorId}
          className="text-small-b flex icono-linea gap-1.5 text-error"
        >
          <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </fieldset>
  );
}
