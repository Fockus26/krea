"use client";

import { Check } from "lucide-react";
import { useId, useState } from "react";

const THEMES = [
  ["light", "Claro"],
  ["dark", "Oscuro"],
] as const;

const ACCENTS = [
  ["azul", "Azul"],
  ["rojo", "Rojo"],
  ["verde", "Verde"],
  ["morado", "Morado"],
] as const;

type Theme = (typeof THEMES)[number][0];
type Accent = (typeof ACCENTS)[number][0];

function Choice<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: readonly (readonly [T, string])[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="text-label mb-2 w-full">{legend}</legend>
      {options.map(([key, label]) => (
        <label
          key={key}
          className="group text-button-sm inline-flex h-11 cursor-pointer items-center gap-2 rounded-md bg-surface px-4 text-text shadow-1 has-checked:bg-accent has-checked:text-on-accent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus"
        >
          <input
            type="radio"
            name={name}
            value={key}
            checked={value === key}
            onChange={() => onChange(key)}
            className="sr-only"
          />
          {/* El seleccionado lleva marca además del color */}
          <Check
            aria-hidden="true"
            strokeWidth={2}
            className="hidden size-4 group-has-checked:block"
          />
          {label}
        </label>
      ))}
    </fieldset>
  );
}

/**
 * Escenario de /componentes: aplica tema y acento a todas las familias a la vez, con
 * `data-theme`/`data-accent` en un contenedor (el mismo patrón que /tokens; D016 y D026).
 * Siempre con `data-theme` explícito: sin él, "azul" heredaría el acento de la raíz
 * (azul es la ausencia de `data-accent`, y solo los bloques de tema lo restablecen).
 */
export function Escenario({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [accent, setAccent] = useState<Accent>("azul");
  const id = useId();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-md bg-surface-2 p-4 md:flex-row md:gap-8">
        <Choice
          legend="Tema"
          name={`${id}-tema`}
          options={THEMES}
          value={theme}
          onChange={setTheme}
        />
        <Choice
          legend="Acento"
          name={`${id}-acento`}
          options={ACCENTS}
          value={accent}
          onChange={setAccent}
        />
      </div>
      <div
        data-theme={theme}
        data-accent={accent}
        className="flex flex-col gap-12 rounded-lg bg-bg p-4 text-text md:p-8"
      >
        {children}
      </div>
    </div>
  );
}
