"use client";

import { CircleAlert } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { SeccionId } from "@/lib/modelo";
import { agruparPorAnio } from "@/lib/secciones";
import { elegidasTexto, seccionesTareaTexto } from "@/lib/tareas-profe";
import { cn } from "@/lib/utils";

/**
 * «Secciones» del constructor (D324; rediseño D356): una fila de ancho completo con un grupo por
 * año (título, contador «n elegidas» y la acción «Todas» / «Quitar todas» si tiene más de una) y
 * cada sección como chip de 44 px en una fila que envuelve. El chip es la etiqueta de su casilla
 * (sigue siendo un `checkbox` con su nombre); elegido se ve por el ✓ de la casilla, el borde del
 * acento y el texto en negrita, no solo por el color. Hace falta al menos una. Una sección elegida
 * que el catálogo ya no tiene se sigue mostrando con su código (no debería pasar: solo se elimina
 * vacía, D318). El resumen («La reciben 4B y 5A») no es región viva: las casillas ya anuncian su
 * estado. Con error, la primera casilla lleva `aria-invalid` (el foco al primer inválido la
 * encuentra), los chips sin elegir se bordean de rojo y el `fieldset` lleva el mensaje por
 * `aria-describedby`. PROVISIONAL de copy (CONTENT_CHECKLIST filas 168 y 179).
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
      {grupos.map((g) => {
        const tituloId = `${id}-anio-${g.numero}`;
        const n = g.secciones.filter((s) => elegidas.includes(s)).length;
        const todas = n === g.secciones.length;
        return (
          // biome-ignore lint/a11y/useSemanticElements: el título del año comparte fila con «Todas»; en un <legend> ese botón y el contador entrarían en el nombre del grupo
          <div
            key={g.numero}
            role="group"
            aria-labelledby={tituloId}
            className="flex min-w-0 flex-col gap-3 rounded-md border border-divider p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <p className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                <span id={tituloId} className="text-small-b text-text">
                  {g.nombre}
                </span>
                <span className="nums text-small text-text-2">
                  {elegidasTexto(n)}
                </span>
              </p>
              {g.secciones.length > 1 && !disabled ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="-mr-2"
                  onClick={() => {
                    for (const s of g.secciones) {
                      if (elegidas.includes(s) === todas) onCambio(s, !todas);
                    }
                  }}
                >
                  {todas ? (
                    "Quitar todas"
                  ) : (
                    <>
                      <span className="sr-only">Elegir </span>Todas
                    </>
                  )}
                  <span className="sr-only"> las secciones de {g.nombre}</span>
                </Button>
              ) : null}
            </div>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {g.secciones.map((s) => {
                const casilla = `${id}-${s}`;
                const marcada = elegidas.includes(s);
                return (
                  <li key={s}>
                    <label
                      htmlFor={casilla}
                      className={cn(
                        "relative flex min-h-11 items-center gap-2 rounded-nav border-2 px-4 text-text",
                        "transition-[background-color,border-color] duration-fast ease-krea",
                        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
                        marcada
                          ? "border-accent-ink bg-accent-soft text-body-strong"
                          : cn(
                              "bg-surface text-body",
                              error ? "border-error" : "border-input",
                            ),
                        disabled
                          ? "cursor-not-allowed border-dashed"
                          : cn(
                              "cursor-pointer",
                              !marcada && "hover:bg-accent-soft",
                            ),
                      )}
                    >
                      <Checkbox
                        id={casilla}
                        checked={marcada}
                        onCheckedChange={(v) => onCambio(s, v === true)}
                        disabled={disabled}
                        aria-invalid={error && s === primera ? true : undefined}
                        // El chip entero es el área táctil y lleva el anillo de foco
                        className="after:hidden focus-visible:outline-0"
                      />
                      <span className="nums texto-cap">{s}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
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
