"use client";

import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Segmentado para elegir UN valor (5A/5C, tema, tipo de tarea) — HANDOFF §2.6.
 * Radix `ToggleGroup type="single"` ya publica `role="radiogroup"` en el grupo y
 * `role="radio"` + `aria-checked` en cada opción (lo verifica tests/unit/toggle-group.test.ts),
 * así que no se reescriben los roles. Lo que Radix no hace y este wrapper añade (D038):
 *  - no se puede deseleccionar: pulsar la opción activa no vacía el valor;
 *  - las flechas mueven Y seleccionan (patrón radiogroup), como Inicio/Fin.
 * Para pestañas (`tablist`) usa `Tabs variant="segmented"`.
 */

const NAV_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
]);

type NavContext = { navigating: React.RefObject<boolean> };
const NavContext = React.createContext<NavContext | null>(null);

type ToggleGroupProps = Omit<
  React.ComponentProps<typeof ToggleGroupPrimitive.Root>,
  "type" | "value" | "defaultValue" | "onValueChange"
> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** `seg-block`: reparte el ancho; bajo 400 px de ancho se ocultan los íconos. */
  block?: boolean;
};

function ToggleGroup({
  className,
  value: valueProp,
  defaultValue,
  onValueChange,
  block = false,
  onKeyDownCapture,
  ...props
}: ToggleGroupProps) {
  const [inner, setInner] = React.useState(defaultValue ?? "");
  const controlled = valueProp !== undefined;
  const value = controlled ? valueProp : inner;
  const navigating = React.useRef(false);

  const change = (next: string) => {
    if (next === "") return; // single sin vacío: la opción activa no se desmarca
    if (!controlled) setInner(next);
    onValueChange?.(next);
  };

  return (
    <NavContext.Provider value={{ navigating }}>
      <ToggleGroupPrimitive.Root
        {...props}
        type="single"
        value={value}
        onValueChange={change}
        data-slot="toggle-group"
        data-block={block || undefined}
        onKeyDownCapture={(event) => {
          onKeyDownCapture?.(event);
          if (NAV_KEYS.has(event.key)) {
            // Radix mueve el foco en un timeout; la bandera sobrevive hasta que llegue
            navigating.current = true;
            setTimeout(() => {
              navigating.current = false;
            }, 150);
          }
        }}
        className={cn(
          "group/toggle-group gap-1 rounded-md bg-surface-2 p-1",
          // `@container` (container-type: inline-size) solo en block: en un grupo de ancho propio colapsaría al padding
          block ? "@container flex w-full" : "inline-flex w-fit max-w-full",
          className,
        )}
      />
    </NavContext.Provider>
  );
}

function ToggleGroupItem({
  className,
  onFocus,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  const nav = React.useContext(NavContext);
  const ref = React.useRef<HTMLButtonElement>(null);

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      data-slot="toggle-group-item"
      onFocus={(event) => {
        onFocus?.(event);
        // Foco por flechas/Inicio/Fin → selecciona (radiogroup). Con Tab o ratón no hace nada extra.
        if (nav?.navigating.current) {
          nav.navigating.current = false;
          if (ref.current?.getAttribute("aria-checked") !== "true") {
            ref.current?.click();
          }
        }
      }}
      className={cn(
        "relative inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-nav px-4 text-button whitespace-nowrap text-text-2",
        // 40 px visibles (HANDOFF §2) y 44 de área táctil, dentro del padding del contenedor (D215)
        "after:absolute after:inset-x-0 after:-inset-y-0.5",
        "transition-[color,background-color,box-shadow] duration-fast ease-krea",
        "hover:text-text data-[state=on]:bg-surface data-[state=on]:text-text data-[state=on]:shadow-1",
        "disabled:cursor-not-allowed disabled:text-text-dis disabled:hover:text-text-dis",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        "[&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
        // seg-block
        "group-data-[block]/toggle-group:min-w-0 group-data-[block]/toggle-group:flex-1 group-data-[block]/toggle-group:px-2",
        "group-data-[block]/toggle-group:@max-seg:[&_svg]:hidden",
        className,
      )}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
