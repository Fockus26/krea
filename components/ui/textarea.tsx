"use client";

import * as React from "react";
import {
  controlClasses,
  controlState,
  isInvalid,
} from "@/components/ui/control";
import { joinIds, useFieldControl } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type TextareaProps = React.ComponentProps<"textarea"> & {
  /** Alto mínimo 72 (tarjetas de evaluación) en vez de 112. */
  compact?: boolean;
  /** Contador bajo el campo, a la derecha ("128 / 600"). Necesita `maxLength`. */
  counter?: boolean;
  /** Éxito: borde `--success`. Dentro de un `Field` lo pone su prop `success`. */
  success?: boolean;
};

/**
 * Textarea — HANDOFF §2.2: mínimo 112 px (72 `compact`), padding 12 14, contador a la derecha.
 * Mismos estados que `Input` (aria-invalid, disabled/readOnly). Controlada o no.
 */
function Textarea({
  className,
  compact,
  counter,
  success,
  onChange,
  value,
  defaultValue,
  ...props
}: TextareaProps) {
  const field = useFieldControl();
  const counterId = React.useId();
  const [typed, setTyped] = React.useState(String(defaultValue ?? "").length);
  const invalid = isInvalid(props["aria-invalid"] ?? field?.["aria-invalid"]);
  const state = controlState({
    invalid,
    success: success ?? field?.success,
    locked: Boolean(props.disabled || props.readOnly),
  });
  const length = value !== undefined ? String(value).length : typed;
  const showCounter = counter && props.maxLength !== undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <textarea
        data-slot="textarea"
        {...props}
        id={props.id ?? field?.id}
        aria-invalid={props["aria-invalid"] ?? field?.["aria-invalid"]}
        value={value}
        defaultValue={defaultValue}
        onChange={(e) => {
          setTyped(e.currentTarget.value.length);
          onChange?.(e);
        }}
        aria-describedby={joinIds(
          props["aria-describedby"],
          field?.["aria-describedby"],
          showCounter && counterId,
        )}
        className={controlClasses(
          state,
          "visible",
          cn(
            "h-auto resize-y items-start py-3 placeholder:text-text-2",
            compact ? "min-h-18" : "min-h-28",
            // con el borde de 2 px el contenido no debe moverse tampoco en vertical
            state === "error" && "py-2.75",
            className,
          ),
        )}
      />
      {showCounter ? (
        <p id={counterId} className="text-small nums text-right text-text-2">
          {length} / {props.maxLength}
        </p>
      ) : null}
    </div>
  );
}

export { Textarea, type TextareaProps };
