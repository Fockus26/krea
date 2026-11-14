"use client";

import { useId } from "react";
import { NumberStepper } from "@/components/krea/number-stepper";
import { Card, CardList } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BASE_INTEGRANTE_ETIQUETA,
  BASES_INTEGRANTES_AYUDA,
  baseIntegranteLabel,
} from "@/lib/evaluar";
import {
  INTEGRANTES_TITULO,
  NO_PARTICIPO_AYUDA,
  NO_PARTICIPO_CASILLA,
  NO_PARTICIPO_ESTADO,
  SIN_PARTE_MOTIVO,
} from "@/lib/evaluar-datos";
import { BASE_MAX, BASE_MIN } from "@/lib/grades";
import { STEP_DEFAULT } from "@/lib/stepper";

/**
 * «Integrantes» de Evaluar entrega en una grupal (D366, D405): cada integrante de la entrega con
 * su base en esta tarea (`NumberStepper` 10–20, D403) y una casilla «No participó» (Checkbox para
 * selección en lista, D300). Marcado se ve por el ✓ de la casilla y por «Queda con 1» junto al
 * nombre, no solo por el color; su base queda deshabilitada (el 1 no lleva base, D365). El
 * nombre accesible de cada control lleva el nombre del integrante («Base de …», «No participó
 * …»), así cada uno se distingue con lector de pantalla. Sin `bases` (galería vieja), sin control
 * de base. Quien llega premarcado por el reparto (D420) lleva «No entregó ninguna parte» junto
 * al nombre: el motivo se lee en texto, no solo por la casilla.
 */
export function ReviewMembers({
  integrantes,
  marcados,
  onCambio,
  bases,
  onBase,
}: {
  /** `sinParte`: tenía preguntas repartidas y no entregó ninguna (D420). */
  integrantes: ReadonlyArray<{
    cedula: string;
    nombre: string;
    sinParte?: boolean;
  }>;
  marcados: readonly string[];
  onCambio: (cedula: string, marcado: boolean) => void;
  /** Base de cada integrante en esta tarea (cédula → base). */
  bases?: Readonly<Record<string, number>>;
  onBase?: (cedula: string, base: number) => void;
}) {
  const base = useId();
  const tituloId = `${base}-titulo`;
  const ayudaId = `${base}-ayuda`;
  const ayudaBasesId = `${base}-ayuda-bases`;
  const conBases = bases !== undefined && onBase !== undefined;
  return (
    <Card>
      <section aria-labelledby={tituloId} className="flex flex-col gap-2">
        <h2 id={tituloId} className="text-h3 text-text">
          {INTEGRANTES_TITULO}
        </h2>
        {conBases ? (
          <p id={ayudaBasesId} className="text-small text-text-2">
            {BASES_INTEGRANTES_AYUDA}
          </p>
        ) : null}
        <p id={ayudaId} className="text-small text-text-2">
          {NO_PARTICIPO_AYUDA}
        </p>
        <CardList>
          {integrantes.map((m, i) => {
            const nombreId = `${base}-n${i}`;
            const casillaId = `${base}-c${i}`;
            const etiquetaId = `${base}-e${i}`;
            const marcado = marcados.includes(m.cedula);
            const baseDe = bases?.[m.cedula];
            return (
              <li
                key={m.cedula}
                className="flex min-h-16 flex-col gap-2 border-b border-divider px-1 py-3 last:border-b-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                  <span className="flex min-w-0 flex-col">
                    <span id={nombreId} className="text-body text-text">
                      {m.nombre}
                    </span>
                    {/* El motivo del premarcado en texto (D420), marcado o no */}
                    {m.sinParte ? (
                      <span className="text-small text-text-2">
                        {SIN_PARTE_MOTIVO}
                      </span>
                    ) : null}
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
                </div>
                {conBases && baseDe !== undefined ? (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    {/* Visible; el nombre accesible del control ya lo incluye */}
                    <span aria-hidden="true" className="text-small-b text-text">
                      {BASE_INTEGRANTE_ETIQUETA}
                    </span>
                    <NumberStepper
                      label={baseIntegranteLabel(m.nombre)}
                      aria-describedby={ayudaBasesId}
                      value={baseDe}
                      onChange={(v) => onBase?.(m.cedula, v)}
                      min={BASE_MIN}
                      max={BASE_MAX}
                      step={STEP_DEFAULT}
                      unit="/ 20"
                      disabled={marcado}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </CardList>
      </section>
    </Card>
  );
}
