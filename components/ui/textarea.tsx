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
  /**
   * Crece con el texto (`field-sizing: content`) hasta un máximo y luego hace scroll. Sin soporte
   * del navegador, un efecto mínimo ajusta el alto.
   */
  autoGrow?: boolean;
};

/** Alto máximo del campo que crece: ~10 líneas, luego scroll. */
const ALTO_MAX_AUTOGROW = "max-h-60";

const soportaFieldSizing = () =>
  typeof CSS !== "undefined" && CSS.supports("field-sizing", "content");

/**
 * Textarea — HANDOFF §2.2: mínimo 112 px (72 `compact`), padding 12 14, contador a la derecha.
 * Mismos estados que `Input` (aria-invalid, disabled/readOnly). Controlada o no.
 */
function Textarea({
  className,
  compact,
  counter,
  success,
  autoGrow,
  onChange,
  value,
  defaultValue,
  ref,
  ...props
}: TextareaProps) {
  const field = useFieldControl();
  const interno = React.useRef<HTMLTextAreaElement | null>(null);
  const ajustar = React.useCallback(() => {
    const el = interno.current;
    if (!autoGrow || !el || soportaFieldSizing()) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [autoGrow]);
  // Fallback sin `field-sizing`: re-ajusta al cambiar el valor controlado
  // biome-ignore lint/correctness/useExhaustiveDependencies: `value` dispara el reajuste
  React.useLayoutEffect(ajustar, [ajustar, value]);
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
        ref={(el) => {
          interno.current = el;
          if (typeof ref === "function") ref(el);
          else if (ref) ref.current = el;
        }}
        id={props.id ?? field?.id}
        aria-invalid={props["aria-invalid"] ?? field?.["aria-invalid"]}
        value={value}
        defaultValue={defaultValue}
        onChange={(e) => {
          setTyped(e.currentTarget.value.length);
          onChange?.(e);
          ajustar();
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
            autoGrow && `field-sizing-content resize-none ${ALTO_MAX_AUTOGROW}`,
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
