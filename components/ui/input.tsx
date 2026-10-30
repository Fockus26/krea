"use client";

import { CircleAlert, Lock } from "lucide-react";
import type * as React from "react";
import {
  controlClasses,
  controlState,
  isInvalid,
} from "@/components/ui/control";
import { joinIds, useFieldControl } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type InputProps = Omit<React.ComponentProps<"input">, "className"> & {
  /** Ícono líder (20 px, `--text-2`). Decorativo: ponle `aria-hidden`. */
  leading?: React.ReactNode;
  /** Elemento final: botón ojo, unidad, contador… Va después del ícono de estado. */
  trailing?: React.ReactNode;
  /** Éxito: borde `--success`. Dentro de un `Field` lo pone su prop `success`. */
  success?: boolean;
  /** Clases de la caja (ancho, márgenes). */
  className?: string;
  /** Clases del `<input>` interior (alineación, tipografía de cifras). */
  inputClassName?: string;
};

/**
 * Input — HANDOFF §2.2. La caja de 48 px (borde, ícono líder, elemento final) es un envoltorio
 * `div`; `ref` y todos los atributos nativos van al `<input>`. Estados por atributos del control:
 * `aria-invalid` (borde 2 `--error` + ícono de alerta), `disabled`/`readOnly` (fondo `--surface-2`,
 * borde punteado y candado). Controlado o no, funciona igual que un `<input>`.
 */
function Input({
  leading,
  trailing,
  success,
  className,
  inputClassName,
  ...props
}: InputProps) {
  const field = useFieldControl();
  const invalid = isInvalid(props["aria-invalid"] ?? field?.["aria-invalid"]);
  const locked = Boolean(props.disabled || props.readOnly);
  const state = controlState({
    invalid,
    success: success ?? field?.success,
    locked,
  });

  return (
    <div
      data-slot="input-group"
      data-state={state}
      className={controlClasses(state, "within", className)}
    >
      {leading ? (
        <span className="flex shrink-0 text-text-2 [&_svg]:size-5">
          {leading}
        </span>
      ) : null}
      <input
        data-slot="input"
        {...props}
        id={props.id ?? field?.id}
        aria-invalid={props["aria-invalid"] ?? field?.["aria-invalid"]}
        aria-describedby={joinIds(
          props["aria-describedby"],
          field?.["aria-describedby"],
        )}
        className={cn(
          "h-full min-w-0 flex-1 bg-transparent text-inherit outline-none placeholder:text-text-2 read-only:cursor-not-allowed disabled:cursor-not-allowed",
          inputClassName,
        )}
      />
      {state === "error" ? (
        <CircleAlert
          aria-hidden="true"
          className="size-5 shrink-0 text-error"
        />
      ) : null}
      {state === "locked" ? (
        <Lock aria-hidden="true" className="size-5 shrink-0 text-text-2" />
      ) : null}
      {trailing ? (
        <span className="flex shrink-0 items-center text-text-2 [&_svg]:size-5">
          {trailing}
        </span>
      ) : null}
    </div>
  );
}

export { Input, type InputProps };
