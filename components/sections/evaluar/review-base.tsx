"use client";

import * as React from "react";
import { NumberStepper } from "@/components/krea/number-stepper";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BASE_TAREA_AYUDA, BASE_TAREA_TITULO } from "@/lib/evaluar";
import { BASE_MAX, BASE_MIN } from "@/lib/grades";
import { STEP_DEFAULT } from "@/lib/stepper";

/*
 * El chip de base de la cabecera y el formulario son hermanos en la página (Server Component):
 * el formulario publica aquí el texto del chip con la base elegida y el chip lo lee en vivo
 * (D405). Una sola entrega se evalúa a la vez; al desmontarse el formulario se borra y el chip
 * vuelve a su texto del servidor.
 */
let chipElegido: string | null = null;
const oyentes = new Set<() => void>();

function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

function publicar(texto: string | null) {
  chipElegido = texto;
  for (const o of oyentes) o();
}

/** El formulario publica el chip de base con la elegida (`null`: el del servidor). */
export function usePublicarBaseChip(texto: string | null) {
  React.useEffect(() => {
    publicar(texto);
  }, [texto]);
  React.useEffect(() => () => publicar(null), []);
}

/** Chip de base de la cabecera: el texto del servidor o, mientras se evalúa, el de la elegida. */
export function BaseChip({ texto }: { texto: string }) {
  const elegido = React.useSyncExternalStore(
    suscribir,
    () => chipElegido,
    () => null,
  );
  return <Badge variant="base">{elegido ?? texto}</Badge>;
}

/**
 * «Base de esta tarea» de una entrega individual (D403, D405): tarjeta propia junto a las
 * preguntas (no en la barra sticky) con el `NumberStepper` 10–20 en pasos de 0,5, como la base
 * de «Editar alumno». El nombre accesible es el título visible; la ayuda va en
 * `aria-describedby`. Botones − / + de 44 px (`icon`).
 */
export function ReviewBase({
  value,
  onChange,
}: {
  value: number;
  onChange: (base: number) => void;
}) {
  const id = React.useId();
  const tituloId = `${id}-titulo`;
  const ayudaId = `${id}-ayuda`;
  return (
    <Card>
      <section aria-labelledby={tituloId} className="flex flex-col gap-2">
        <h2 id={tituloId} className="text-h3 text-text">
          {BASE_TAREA_TITULO}
        </h2>
        <p id={ayudaId} className="text-small text-text-2">
          {BASE_TAREA_AYUDA}
        </p>
        <NumberStepper
          aria-labelledby={tituloId}
          aria-describedby={ayudaId}
          value={value}
          onChange={onChange}
          min={BASE_MIN}
          max={BASE_MAX}
          step={STEP_DEFAULT}
          unit="/ 20"
        />
      </section>
    </Card>
  );
}
