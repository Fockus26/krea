"use client";

import * as React from "react";
import { NumberStepper } from "@/components/krea/number-stepper";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  isScoreKey,
  pushScoreKey,
  SCORE_STEP,
  type ScoreBuffer,
  scoreLabel,
  scoreMode,
  scoreOptions,
  scoreShortcuts,
  scoreText,
} from "@/lib/score";
import { cn } from "@/lib/utils";

type ScorePickerProps = {
  /** Puntaje elegido; `null` = sin puntuar (Pendiente, D003): ningún botón marcado. */
  value: number | null;
  onChange: (value: number) => void;
  /** Valor de la pregunta (0,5–20 en pasos de 0,5). ≤ 6 → botones; > 6 → stepper + atajos. */
  max: number;
  /** id del título de la pregunta (lo pinta `QuestionCard`): nombra el grupo. */
  labelledBy: string;
  disabled?: boolean;
  className?: string;
};

/*
 * Botones de puntaje — HANDOFF §2.12; medidas en design/canvas/krea.css:311-317 (D054–D055;
 * el stepper sin puntuar es D103: campo vacío, ya no 0 + "Sin puntuar").
 * ≤ 6: `ToggleGroup` single (ya es `radiogroup`, sin deseleccionar y con flechas que
 * seleccionan, D038) con un radio por paso de 0,5. > 6: `NumberStepper` + 5 atajos ghost sm.
 * En los dos modos, con el foco dentro del widget, las teclas 0–9 y `,` escriben el puntaje
 * (búfer de `lib/score.ts`); en el campo del stepper no se interceptan: ahí ya se escribe.
 * Ctrl/Cmd/Alt + tecla pasan de largo (Ctrl+Enter = guardar, lo maneja la página).
 */
function ScorePicker({
  value,
  onChange,
  max,
  labelledBy,
  disabled = false,
  className,
}: ScorePickerProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const buffer = React.useRef<ScoreBuffer>(null);
  const typed = React.useRef(false);
  const mode = scoreMode(max);

  const focusChecked = React.useCallback((v: number) => {
    const root = rootRef.current;
    if (!root?.contains(document.activeElement)) return;
    root
      .querySelector<HTMLButtonElement>(`[data-score="${String(v)}"]`)
      ?.focus();
  }, []);

  // Patrón radiogroup: el foco sigue al radio marcado cuando el valor llega por teclado
  React.useEffect(() => {
    if (!typed.current) return;
    typed.current = false;
    if (value !== null) focusChecked(value);
  }, [value, focusChecked]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (disabled || event.ctrlKey || event.metaKey || event.altKey) return;
    if (!isScoreKey(event.key)) return;
    const target = event.target as HTMLElement;
    if (target.closest("input, textarea, [contenteditable='true']")) return;
    event.preventDefault();
    const r = pushScoreKey(buffer.current, event.key, max, event.timeStamp);
    buffer.current = r.buffer;
    if (r.value === null) return;
    if (r.value === value) {
      if (mode === "buttons") focusChecked(r.value);
      return;
    }
    typed.current = mode === "buttons";
    onChange(r.value);
  };

  if (mode === "stepper") {
    const shortcuts = scoreShortcuts(max);
    return (
      // biome-ignore lint/a11y/noStaticElementInteractions: recoge las teclas 0–9 y `,` de sus botones (−, +, atajos)
      <div
        ref={rootRef}
        onKeyDown={onKeyDown}
        className={cn("flex min-w-0 flex-col gap-1", className)}
      >
        {/* El stepper admite `null` y `aria-labelledby` (D103): campo vacío y "Sin puntuar"
            en su `aria-valuetext`, nombrado por el enunciado como el radiogroup */}
        <NumberStepper
          value={value}
          onChange={onChange}
          min={0}
          max={max}
          step={SCORE_STEP}
          aria-labelledby={labelledBy}
          unit={`/ ${scoreText(max)}`}
          disabled={disabled}
        />
        {/* PROVISIONAL (CONTENT_CHECKLIST 44): nombre del grupo de atajos */}
        <fieldset
          aria-label="Atajos de puntaje"
          className="flex min-w-0 flex-wrap gap-2"
        >
          {shortcuts.map((v) => (
            <Button
              key={v}
              type="button"
              variant="ghost"
              size="sm"
              aria-label={scoreLabel(v)}
              data-score={String(v)}
              disabled={disabled}
              onClick={() => onChange(v)}
              className="nums"
            >
              {scoreText(v)}
            </Button>
          ))}
        </fieldset>
      </div>
    );
  }

  const options = scoreOptions(max);
  const top = options.at(-1);
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: recoge las teclas 0–9 y `,` de sus radios
    <div ref={rootRef} onKeyDown={onKeyDown} className={className}>
      <ToggleGroup
        aria-labelledby={labelledBy}
        value={value === null ? "" : String(value)}
        onValueChange={(v) => onChange(Number(v))}
        disabled={disabled}
        className="flex w-full flex-wrap gap-1.5 rounded-none bg-transparent p-0"
      >
        {options.map((v) => (
          <ToggleGroupItem
            key={v}
            value={String(v)}
            aria-label={scoreLabel(v)}
            data-score={String(v)}
            data-max={v === top || undefined}
            className={cn(
              // 44 × 44 mín., padding 0 8, radio 12, borde 1 px --input, Poppins 700 15/20 tabular
              "h-11 min-w-11 rounded-nav border border-input bg-surface px-2 text-score text-text",
              "hover:text-text hover:not-disabled:not-data-[state=on]:bg-surface-2",
              // El valor máximo, borde 1,5 px (.max); el token es el mismo del botón secondary
              "data-max:border-(length:--w-score-max)",
              // Elegido: --accent + --on-accent + anillo `0 0 0 2px surface, 0 0 0 4px accent`
              "data-[state=on]:border-accent data-[state=on]:bg-accent data-[state=on]:text-on-accent data-[state=on]:shadow-none",
              "data-[state=on]:ring-2 data-[state=on]:ring-accent data-[state=on]:ring-offset-2 data-[state=on]:ring-offset-surface",
              // El anillo de foco no puede taparse con el de elegido: se separa 2 px más
              "data-[state=on]:focus-visible:outline-offset-4",
              "disabled:border-divider disabled:bg-surface",
              "disabled:data-[state=on]:border-text-dis disabled:data-[state=on]:bg-surface-3 disabled:data-[state=on]:text-text-2 disabled:data-[state=on]:ring-text-dis",
            )}
          >
            {scoreText(v)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

export { ScorePicker, type ScorePickerProps };
