"use client";

import { Minus, Plus } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  atMax,
  atMin,
  formatDecimal,
  parseDecimal,
  STEP_DEFAULT,
  snapToStep,
  stepValue,
} from "@/lib/stepper";
import { cn } from "@/lib/utils";

type NumberStepperProps = {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  /** Paso de − / + y de las flechas ↑/↓. 0,5 por defecto (D004). */
  step?: number;
  /** Unidad tras el botón + ("pts", "/ 20"). */
  unit?: string;
  /** Nombre accesible del grupo y del campo ("Base de evaluación"). Sin `Field` que lo etiquete. */
  label?: string;
  id?: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  /** Mensaje para el mismo `aria-describedby` que el resto de campos. */
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

/**
 * NumberStepper — HANDOFF §2.2 (base 10–20, valor de pregunta, puntos de ajuste).
 * − (secondary icono 44) · campo 96 px centrado Poppins 700 · + · unidad. Muestra con coma
 * (es-VE); al escribir acepta "17,5" o "17.5" y llama `onChange` solo con valores dentro del
 * rango; al salir (o Enter) corrige al paso y rango más cercanos. ↑/↓ suman/restan un paso.
 * `type="text"` + `inputMode="decimal"`: con coma decimal `type="number"` se rompe.
 * El campo es un `spinbutton` (valuenow/min/max/text) para lectores de pantalla.
 *
 * Controlado siempre: `value` + `onChange`. La lógica vive en `lib/stepper.ts`.
 */
function NumberStepper({
  value,
  onChange,
  min,
  max,
  step = STEP_DEFAULT,
  unit,
  label,
  id,
  disabled,
  readOnly,
  className,
  ...aria
}: NumberStepperProps) {
  const range = { min, max, step };
  const inputRef = React.useRef<HTMLInputElement>(null);
  // Mientras se escribe se muestra el texto crudo; fuera del foco, el valor formateado
  const [draft, setDraft] = React.useState<string | null>(null);
  const shown = draft ?? formatDecimal(value, step);
  const stepText = formatDecimal(step, step);
  const inactive = disabled || readOnly;

  const commit = (next: number) => {
    setDraft(null);
    if (next !== value) onChange(next);
  };

  const bump = (dir: 1 | -1) => {
    const parsed = draft === null ? null : parseDecimal(draft);
    const next = stepValue(parsed ?? value, dir, range);
    commit(next);
    // Un botón que se deshabilita en el límite sacaría el foco de la pantalla
    if (atMin(next, range) || atMax(next, range)) inputRef.current?.focus();
  };

  const settle = () => {
    if (draft === null) return;
    const parsed = parseDecimal(draft);
    commit(parsed === null ? value : snapToStep(parsed, range));
  };

  return (
    <fieldset
      aria-label={label}
      className={cn("inline-flex min-w-0 items-center gap-2", className)}
    >
      <Button
        variant="secondary"
        icon
        aria-label={`Restar ${stepText}`}
        disabled={disabled || readOnly || atMin(value, range)}
        onClick={() => bump(-1)}
      >
        <Minus aria-hidden="true" />
      </Button>
      <Input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        role="spinbutton"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={formatDecimal(value, step)}
        aria-describedby={aria["aria-describedby"]}
        aria-invalid={aria["aria-invalid"]}
        disabled={disabled}
        readOnly={readOnly}
        value={shown}
        className="w-24"
        inputClassName="text-center font-heading font-bold nums"
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => {
          const text = e.currentTarget.value;
          setDraft(text);
          const parsed = parseDecimal(text);
          if (parsed !== null && parsed >= min && parsed <= max) {
            onChange(parsed);
          }
        }}
        onBlur={settle}
        onKeyDown={(e) => {
          if (inactive) return;
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            bump(e.key === "ArrowUp" ? 1 : -1);
          } else if (e.key === "Enter") {
            settle();
          }
        }}
      />
      <Button
        variant="secondary"
        icon
        aria-label={`Sumar ${stepText}`}
        disabled={disabled || readOnly || atMax(value, range)}
        onClick={() => bump(1)}
      >
        <Plus aria-hidden="true" />
      </Button>
      {unit ? <span className="text-body text-text-2">{unit}</span> : null}
    </fieldset>
  );
}

export { NumberStepper, type NumberStepperProps };
