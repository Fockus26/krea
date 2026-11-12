"use client";

import { useId } from "react";
import { Card, CardList } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  INTEGRANTES_TITULO,
  NO_PARTICIPO_AYUDA,
  NO_PARTICIPO_CASILLA,
  NO_PARTICIPO_ESTADO,
} from "@/lib/evaluar-datos";

/**
 * «Integrantes» de Evaluar entrega en una grupal (D366): cada integrante de la entrega con una
 * casilla «No participó» (Checkbox para selección en lista, D300). Marcado se ve por el ✓ de la
 * casilla y por «Queda con 1» junto al nombre, no solo por el color. El nombre accesible de cada
 * casilla es «No participó» + el nombre, así cada una se distingue con lector de pantalla.
 */
export function ReviewMembers({
  integrantes,
  marcados,
  onCambio,
}: {
  integrantes: ReadonlyArray<{ cedula: string; nombre: string }>;
  marcados: readonly string[];
  onCambio: (cedula: string, marcado: boolean) => void;
}) {
  const base = useId();
  const tituloId = `${base}-titulo`;
  const ayudaId = `${base}-ayuda`;
  return (
    <Card>
      <section aria-labelledby={tituloId} className="flex flex-col gap-2">
        <h2 id={tituloId} className="text-h3 text-text">
          {INTEGRANTES_TITULO}
        </h2>
        <p id={ayudaId} className="text-small text-text-2">
          {NO_PARTICIPO_AYUDA}
        </p>
        <CardList>
          {integrantes.map((m, i) => {
            const nombreId = `${base}-n${i}`;
            const casillaId = `${base}-c${i}`;
            const etiquetaId = `${base}-e${i}`;
            const marcado = marcados.includes(m.cedula);
            return (
              <li
                key={m.cedula}
                className="flex min-h-16 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-divider px-1 py-3 last:border-b-0"
              >
                <span className="flex min-w-0 flex-col">
                  <span id={nombreId} className="text-body text-text">
                    {m.nombre}
                  </span>
                  {marcado ? (
                    <span className="text-small text-text-2">
                      {NO_PARTICIPO_ESTADO}
                    </span>
                  ) : null}
                </span>
                <span className="flex items-center gap-2">
                  <Checkbox
                    id={casillaId}
                    checked={marcado}
                    onCheckedChange={(v) => onCambio(m.cedula, v === true)}
                    aria-labelledby={`${etiquetaId} ${nombreId}`}
                    aria-describedby={ayudaId}
                  />
                  <label
                    id={etiquetaId}
                    htmlFor={casillaId}
                    className="text-body cursor-pointer text-text"
                  >
                    {NO_PARTICIPO_CASILLA}
                  </label>
                </span>
              </li>
            );
          })}
        </CardList>
      </section>
    </Card>
  );
}
