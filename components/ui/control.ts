import { cn } from "@/lib/utils";

/*
 * Aspecto común de Input, Textarea y SelectTrigger — HANDOFF §2.2, design/canvas/krea.css:230-245.
 * El estado sale de atributos del control (aria-invalid, disabled, readOnly), no de clases sueltas.
 */
export type ControlState = "idle" | "error" | "success" | "locked";

/** Deshabilitado/solo lectura gana sobre error y éxito: un campo bloqueado no se corrige. */
export function controlState({
  invalid,
  success,
  locked,
}: {
  invalid?: boolean;
  success?: boolean;
  locked?: boolean;
}): ControlState {
  if (locked) return "locked";
  if (invalid) return "error";
  if (success) return "success";
  return "idle";
}

/** `aria-invalid` admite true | "true" | "grammar" | "spelling"; solo "false"/ausente es válido. */
export function isInvalid(value: React.AriaAttributes["aria-invalid"]) {
  return value !== undefined && value !== false && value !== "false";
}

// Caja: 48 de alto, radio 10 (rounded-sm), padding 14, borde 1 (§2.2). El foco no usa outline
// global: borde y halo cambian a la vez, así el foco no depende solo del color.
const BASE =
  "flex h-12 w-full items-center gap-2 rounded-sm border bg-surface px-3.5 text-body text-text transition-[border-color,box-shadow] duration-fast ease-krea";

const STATE: Record<ControlState, string> = {
  idle: "border-input hover:border-text-2",
  success: "border-success hover:border-text-2",
  // borde 2 + padding 13: el contenido no se mueve
  error: "border-2 border-error px-3.25",
  // borde punteado + candado (el icono lo pone el componente): no depende del color
  locked:
    "cursor-not-allowed border-dashed border-input bg-surface-2 text-text-2",
};

const FOCUS: Record<"within" | "visible", Record<ControlState, string>> = {
  within: {
    idle: "focus-within:border-accent-ink focus-within:ring-3 focus-within:ring-accent/28",
    success:
      "focus-within:border-accent-ink focus-within:ring-3 focus-within:ring-accent/28",
    error: "focus-within:ring-3 focus-within:ring-accent/28",
    locked: "focus-within:border-accent-ink",
  },
  visible: {
    idle: "outline-none focus-visible:border-accent-ink focus-visible:ring-3 focus-visible:ring-accent/28 data-[state=open]:border-accent-ink data-[state=open]:ring-3 data-[state=open]:ring-accent/28",
    success:
      "outline-none focus-visible:border-accent-ink focus-visible:ring-3 focus-visible:ring-accent/28 data-[state=open]:border-accent-ink data-[state=open]:ring-3 data-[state=open]:ring-accent/28",
    error:
      "outline-none focus-visible:ring-3 focus-visible:ring-accent/28 data-[state=open]:ring-3 data-[state=open]:ring-accent/28",
    locked: "outline-none",
  },
};

/**
 * Clases de la caja de un campo. `focus: "within"` para un contenedor con el `<input>` dentro;
 * `"visible"` cuando la propia caja es el elemento enfocable (textarea, trigger del Select).
 */
export function controlClasses(
  state: ControlState,
  focus: "within" | "visible",
  className?: string,
) {
  return cn(BASE, STATE[state], FOCUS[focus][state], className);
}
