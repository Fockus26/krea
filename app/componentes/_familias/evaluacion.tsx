"use client";

import * as React from "react";
import { LiveTotal } from "@/components/krea/live-total";
import { ScorePicker } from "@/components/krea/score-picker";
import { SumMeter } from "@/components/krea/sum-meter";
import { Familia, Muestra } from "./familia";

// Textos de ejemplo PROVISIONALES (CONTENT_CHECKLIST 46): enunciados de las preguntas y notas
// de la lámina. Los textos de los componentes van en las filas 44–45.

/** Lo que no se puede forzar desde la página (hover, foco) se dice con texto. */
function Nota({ children }: { children: React.ReactNode }) {
  return <p className="text-small text-text-2">{children}</p>;
}

/** Una pregunta con su título (el que nombra el grupo) y su ScorePicker. */
function PickerDemo({
  titulo,
  max,
  start = null,
  disabled,
}: {
  titulo: string;
  max: number;
  start?: number | null;
  disabled?: boolean;
}) {
  const id = React.useId();
  const [valor, setValor] = React.useState<number | null>(start);
  return (
    <div className="flex max-w-xl flex-col gap-2">
      <p id={id} className="text-label">
        {titulo}
      </p>
      <ScorePicker
        labelledBy={id}
        max={max}
        value={valor}
        onChange={setValor}
        disabled={disabled}
      />
    </div>
  );
}

const ENTREGA = [
  { titulo: "1. ¿Qué vende el emprendimiento? · vale 6", max: 6 },
  { titulo: "2. ¿Por qué eligieron esos colores? · vale 4", max: 4 },
  { titulo: "3. Sube el logo del equipo · vale 2", max: 2 },
  { titulo: "4. Presenta la lámina final · vale 8", max: 8 },
] as const;

/** Evaluación en miniatura: los ScorePicker mueven el total en vivo en sus dos presentaciones. */
function EvaluarDemo() {
  const ids = React.useId();
  const [scores, setScores] = React.useState<(number | null)[]>([
    4.5,
    3,
    null,
    null,
  ]);
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <ol className="flex min-w-0 flex-1 flex-col gap-5">
        {ENTREGA.map((p, i) => (
          <li key={p.titulo} className="flex flex-col gap-2">
            <p id={`${ids}-${i}`} className="text-label">
              {p.titulo}
            </p>
            <ScorePicker
              labelledBy={`${ids}-${i}`}
              max={p.max}
              value={scores[i] ?? null}
              onChange={(v) =>
                setScores((s) => s.map((x, j) => (j === i ? v : x)))
              }
            />
          </li>
        ))}
      </ol>
      <div className="flex flex-col gap-4 lg:w-(--w-side-col) lg:shrink-0">
        <LiveTotal scores={scores} base={15} />
        <LiveTotal scores={scores} base={15} variant="card" headingLevel={4} />
      </div>
    </div>
  );
}

export function Evaluacion() {
  return (
    <Familia
      id="evaluacion"
      title="Evaluación y puntaje"
      description="ScorePicker, SumMeter y total en vivo. Con el foco en un puntaje, las flechas recorren y eligen, y las teclas 0–9 y la coma escriben el valor (3 , 5 → 3,5)."
    >
      <Muestra title="ScorePicker · hasta 6: un botón por paso de 0,5">
        <PickerDemo titulo="Pregunta que vale 2 · sin puntuar" max={2} />
        <PickerDemo
          titulo="Pregunta que vale 4 · con 3,5"
          max={4}
          start={3.5}
        />
        <PickerDemo titulo="Pregunta que vale 6 · con 6" max={6} start={6} />
        <PickerDemo
          titulo="Pregunta que vale 6 · deshabilitada con 2"
          max={6}
          start={2}
          disabled
        />
        <PickerDemo
          titulo="Pregunta que vale 4 · deshabilitada sin puntuar"
          max={4}
          disabled
        />
        <Nota>
          El botón del valor máximo lleva borde de 1,5 px. Hover y foco no se
          pueden forzar: pasa el puntero o pulsa Tab.
        </Nota>
      </Muestra>

      <Muestra title="ScorePicker · más de 6: stepper + atajos">
        <PickerDemo titulo="Pregunta que vale 8 · sin puntuar" max={8} />
        <PickerDemo
          titulo="Pregunta que vale 20 · con 16,5"
          max={20}
          start={16.5}
        />
        <PickerDemo
          titulo="Pregunta que vale 7 · atajos al paso (0 · 2 · 3,5 · 5,5 · 7)"
          max={7}
          start={3.5}
        />
        <PickerDemo
          titulo="Pregunta que vale 20 · deshabilitada con 12"
          max={20}
          start={12}
          disabled
        />
        <Nota>
          En el campo se escribe normal; con el foco en −, + o un atajo, las
          teclas 0–9 y la coma también fijan el puntaje.
        </Nota>
      </Muestra>

      <Muestra title="SumMeter · barra (constructor, móvil)">
        <div className="flex max-w-xl flex-col gap-3">
          <SumMeter sum={14} />
          <SumMeter sum={19.5} />
          <SumMeter sum={22} />
          <SumMeter sum={20} />
        </div>
      </Muestra>

      <Muestra title="SumMeter · tarjeta «Suma de valores» (constructor, escritorio)">
        <div className="grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
          <SumMeter sum={14} variant="card" headingLevel={4} />
          <SumMeter sum={22} variant="card" headingLevel={4} />
          <SumMeter sum={20} variant="card" headingLevel={4} />
        </div>
      </Muestra>

      <Muestra title="Total en vivo · barra (evaluar, móvil)">
        <div className="flex max-w-xl flex-col gap-3">
          <LiveTotal scores={[null, null, null, null, null]} />
          <LiveTotal scores={[4, 5, null, null, null]} />
          <LiveTotal scores={[6, 4, 3.5, 5]} />
          <LiveTotal scores={[6, 4, 3.5, 5]} base={15} />
        </div>
      </Muestra>

      <Muestra title="Total en vivo · tarjeta (evaluar, escritorio)">
        <div className="grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
          <LiveTotal
            scores={[4, 5, null, null, null]}
            variant="card"
            headingLevel={4}
          />
          <LiveTotal scores={[6, 4, 3.5, 5]} variant="card" headingLevel={4} />
          <LiveTotal
            scores={[6, 4, 3.5, 5, null]}
            base={15}
            variant="card"
            headingLevel={4}
          />
        </div>
        <Nota>
          Base 20 y Base 15: la nota sale de notaFinal (18,5 × 15 / 20 = 13,9).
        </Nota>
      </Muestra>

      <Muestra title="Interactivo · evaluar una entrega con Base 15">
        <EvaluarDemo />
      </Muestra>
    </Familia>
  );
}
