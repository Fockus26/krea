"use client";

import { CircleAlert, Image as ImageIcon, Trash2, Type } from "lucide-react";
import { NumberStepper } from "@/components/krea/number-stepper";
import { Button } from "@/components/ui/button";
import { cardVariants } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  type ErroresPregunta,
  type FormatoPregunta,
  type PreguntaBorrador,
  VALOR_MAX,
  VALOR_MIN,
  VALOR_PASO,
} from "@/lib/tareas-profe";
import { cn } from "@/lib/utils";

/** Ids del DOM de una pregunta: el constructor los usa para mover el foco al añadir/eliminar. */
export const preguntaDomId = (id: string) => ({
  titulo: `pregunta-${id}-titulo`,
  enunciado: `pregunta-${id}-enunciado`,
  error: `pregunta-${id}-error`,
});

function MensajeError({ id, children }: { id: string; children: string }) {
  return (
    <p id={id} className="text-small-b flex items-start gap-1.5 text-error">
      <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/*
 * Tarjeta de una pregunta del constructor (HANDOFF §3 Constructor; lienzo Constructor `.q`):
 * número + "Pregunta n" (`h3`, nombra el enunciado) + eliminar ghost `--error`; enunciado;
 * Formato Texto/Imagen (radiogroup) y Valor (stepper 0,5–20 paso 0,5; sin valor = `null`, D103).
 * Los errores salen tras intentar publicar y no se anuncian en cada tecla (D071): se leen por
 * `aria-describedby` al enfocar el campo.
 */
export function QuestionEditor({
  pregunta,
  numero,
  errores,
  puedeEliminar,
  onCambio,
  onEliminar,
}: {
  pregunta: PreguntaBorrador;
  numero: number;
  errores?: ErroresPregunta;
  /** Falso con una sola pregunta (mínimo 1). */
  puedeEliminar: boolean;
  onCambio: (cambios: Partial<Omit<PreguntaBorrador, "id">>) => void;
  onEliminar: () => void;
}) {
  const ids = preguntaDomId(pregunta.id);
  const errEnunciado = `${ids.error}-enunciado`;
  const errValor = `${ids.error}-valor`;
  const labelValor = `pregunta-${pregunta.id}-valor`;

  return (
    <li className={cn(cardVariants(), "flex flex-col gap-3")}>
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-sm bg-accent-soft-2 text-score text-text"
        >
          {numero}
        </span>
        <h3
          id={ids.titulo}
          className="text-h4 min-w-0 flex-1 self-center text-text"
        >
          Pregunta {numero}
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon
          disabled={!puedeEliminar}
          aria-label={`Eliminar la pregunta ${numero}`}
          onClick={onEliminar}
          className="text-error"
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        <Textarea
          id={ids.enunciado}
          compact
          rows={2}
          aria-labelledby={ids.titulo}
          aria-invalid={errores?.enunciado ? true : undefined}
          aria-describedby={errores?.enunciado ? errEnunciado : undefined}
          value={pregunta.enunciado}
          onChange={(e) => onCambio({ enunciado: e.currentTarget.value })}
        />
        {errores?.enunciado ? (
          <MensajeError id={errEnunciado}>{errores.enunciado}</MensajeError>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-label text-text" aria-hidden="true">
            Formato de respuesta
          </span>
          <ToggleGroup
            aria-label={`Formato de la pregunta ${numero}`}
            value={pregunta.formato}
            onValueChange={(v) => onCambio({ formato: v as FormatoPregunta })}
          >
            <ToggleGroupItem value="texto">
              <Type aria-hidden="true" />
              Texto
            </ToggleGroupItem>
            <ToggleGroupItem value="imagen">
              <ImageIcon aria-hidden="true" />
              Imagen
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="flex flex-col gap-1.5">
          <span id={labelValor} className="text-label text-text">
            Valor
            <span className="sr-only"> de la pregunta {numero}</span>
          </span>
          <NumberStepper
            aria-labelledby={labelValor}
            value={pregunta.valor}
            onChange={(v) => onCambio({ valor: v })}
            min={VALOR_MIN}
            max={VALOR_MAX}
            step={VALOR_PASO}
            unit="pts"
            emptyText="Sin valor"
            aria-invalid={errores?.valor ? true : undefined}
            aria-describedby={errores?.valor ? errValor : undefined}
          />
        </div>
      </div>
      {errores?.valor ? (
        <MensajeError id={errValor}>{errores.valor}</MensajeError>
      ) : null}
    </li>
  );
}
