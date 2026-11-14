"use client";

import * as React from "react";
import { NumberStepper } from "@/components/krea/number-stepper";
import { PUNTOS_MAX, PUNTOS_MIN, PUNTOS_PASO } from "@/lib/puntos";

type Props = Omit<
  React.ComponentProps<typeof NumberStepper>,
  "min" | "max" | "step" | "unit"
>;

/**
 * Stepper de puntos ± (−20 a +20, pasos de 0,5; D119). Desde «sin valor» el NumberStepper parte de
 * `min` en las dos direcciones (D103), que aquí sería −20: con la dirección del último −/+ (o ↑/↓)
 * parte de ±0,5. Lo usan «Nuevo ajuste» y el diálogo «Editar opciones» (D377).
 */
export function PuntosStepper({ value, onChange, ...props }: Props) {
  const direccion = React.useRef<1 | -1 | null>(null);
  return (
    // Solo lee qué botón del stepper se pulsó (los botones son del NumberStepper)
    <div
      className="contents"
      onClickCapture={(e) => {
        const b = (e.target as Element).closest("button");
        const nombre = b?.getAttribute("aria-label") ?? "";
        direccion.current = nombre.startsWith("Sumar")
          ? 1
          : nombre.startsWith("Restar")
            ? -1
            : null;
      }}
      onKeyDownCapture={(e) => {
        direccion.current =
          e.key === "ArrowUp" ? 1 : e.key === "ArrowDown" ? -1 : null;
      }}
    >
      <NumberStepper
        {...props}
        value={value}
        min={PUNTOS_MIN}
        max={PUNTOS_MAX}
        step={PUNTOS_PASO}
        unit="pts"
        onChange={(n) => {
          const dir = direccion.current;
          direccion.current = null;
          onChange(
            value === null && n === PUNTOS_MIN && dir !== null
              ? dir * PUNTOS_PASO
              : n,
          );
        }}
      />
    </div>
  );
}
