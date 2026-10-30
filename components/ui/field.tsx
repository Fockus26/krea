"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/*
 * Field — etiqueta + control + ayuda + mensaje de error/éxito (HANDOFF §2.2).
 * Cablea solo `id`/`htmlFor`, `aria-describedby` (ayuda + mensaje) y `aria-invalid`: el control
 * (Input, Textarea, SelectTrigger, PasswordInput…) lee el contexto con `useFieldControl()`.
 * Lo que el llamador pase explícito al control gana sobre el contexto.
 */
type FieldControl = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  success: boolean;
};

const FieldContext = React.createContext<FieldControl | null>(null);

/** Props que el `Field` aporta al control; `null` si el control va suelto. */
function useFieldControl() {
  return React.useContext(FieldContext);
}

/** Une ids para `aria-describedby` ignorando los vacíos. */
function joinIds(...ids: unknown[]) {
  const unidos = ids.filter((id) => typeof id === "string" && id).join(" ");
  return unidos || undefined;
}

type FieldProps = Omit<React.ComponentProps<"div">, "children"> & {
  label: React.ReactNode;
  children: React.ReactNode;
  /** Texto de ayuda bajo el control (13/18, `--text-2`). */
  help?: React.ReactNode;
  /** Mensaje de error: borde rojo en el control, ícono y texto. Gana sobre `success`. */
  error?: React.ReactNode;
  /** Mensaje de éxito: borde verde en el control, check y texto. */
  success?: React.ReactNode;
  /** `id` del control (si no, se genera). */
  controlId?: string;
  /**
   * El error/éxito se anuncia al aparecer (`role="alert"` / `role="status"`). Ponlo en `false`
   * para errores que aparecen mientras la persona escribe en el propio campo: se leerán al
   * volver a enfocarlo por `aria-describedby` y no se anunciarán dos veces.
   */
  announce?: boolean;
};

function Field({
  label,
  children,
  help,
  error,
  success,
  controlId,
  announce = true,
  className,
  ...props
}: FieldProps) {
  const generated = React.useId();
  const id = controlId ?? generated;
  const helpId = `${id}-help`;
  const messageId = `${id}-msg`;
  const hasError = Boolean(error);
  const hasSuccess = !hasError && Boolean(success);
  const hasMessage = hasError || hasSuccess;

  const control: FieldControl = {
    id,
    "aria-describedby": joinIds(help && helpId, hasMessage && messageId),
    "aria-invalid": hasError ? true : undefined,
    success: hasSuccess,
  };

  return (
    <div
      data-slot="field"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    >
      <Label htmlFor={id}>{label}</Label>
      <FieldContext.Provider value={control}>{children}</FieldContext.Provider>
      {help ? (
        <p id={helpId} className="text-small text-text-2">
          {help}
        </p>
      ) : null}
      {hasError ? (
        <p
          id={messageId}
          role={announce ? "alert" : undefined}
          className="text-small-b flex items-start gap-1.5 text-error"
        >
          <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
      {hasSuccess ? (
        <p
          id={messageId}
          role={announce ? "status" : undefined}
          className="text-small-b flex items-center gap-1.5 text-success"
        >
          <CircleCheck aria-hidden="true" className="size-4 shrink-0" />
          <span>{success}</span>
        </p>
      ) : null}
    </div>
  );
}

export { Field, type FieldProps, joinIds, useFieldControl };
