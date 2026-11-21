"use client";

import type * as React from "react";
import { NumberStepper } from "@/components/krea/number-stepper";
import {
  PUNTOS_MAX,
  PUNTOS_MIN,
  PUNTOS_PASO,
  puntosValueText,
} from "@/lib/puntos";

type Props = Omit<
  React.ComponentProps<typeof NumberStepper>,
  "min" | "max" | "step" | "unit" | "startAt" | "formatValueText"
>;

/**
 * Stepper de puntos ± (−20 a +20, pasos de 0,5; D119). Desde «sin valor» el NumberStepper parte de
 * 0 (`startAt`), no de `min` (que sería −20): el primer + da +0,5 y el primer − da −0,5 (D518).
 * El lector anuncia «más 2 puntos» / «menos 1,5 puntos». Lo usan «Nuevo ajuste» y el diálogo
 * «Editar opciones» (D377).
 */
export function PuntosStepper(props: Props) {
  return (
    <NumberStepper
      {...props}
      min={PUNTOS_MIN}
      max={PUNTOS_MAX}
      step={PUNTOS_PASO}
      unit="pts"
      startAt={0}
      formatValueText={puntosValueText}
    />
  );
}
