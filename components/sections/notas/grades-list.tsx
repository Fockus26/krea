"use client";

import { NotebookPen } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { EmptyState } from "@/components/krea/empty-state";
import type { FilaNota } from "@/components/sections/inicio/recent-grades";
import { GradeRow } from "@/components/sections/shared/grade-row";
import { Button } from "@/components/ui/button";
import { Card, CardList } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  FILTROS_NOTAS,
  type FiltroNotas,
  filtrarNotas,
  tituloLista,
  vacioFiltroTexto,
} from "@/lib/notas";

/**
 * Lista de Mis notas (HANDOFF §3 Mis notas §3): h2 + segmentado Todas · Individuales · Grupales
 * (envuelve) y una tarjeta con las mismas `GradeRow` de Inicio (§8). El orden ya viene dado
 * (evaluadas recientes, luego pendientes por fecha). Sin notas: el vacío del lienzo Vacíos.
 */
export function GradesList({
  filas,
  tareasHref,
}: {
  filas: readonly FilaNota[];
  tareasHref: string;
}) {
  const [filtro, setFiltro] = useState<FiltroNotas>("todas");
  const titleId = useId();
  const visibles = filtrarNotas(filas, filtro);
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 id={titleId} className="text-h2 text-text">
          {tituloLista(filtro)}
        </h2>
        {filas.length > 0 ? (
          <ToggleGroup
            aria-label="Filtrar notas"
            value={filtro}
            onValueChange={(v) => setFiltro(v as FiltroNotas)}
            className="flex-wrap"
          >
            {FILTROS_NOTAS.map((f) => (
              <ToggleGroupItem key={f.valor} value={f.valor}>
                {f.texto}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        ) : null}
      </div>
      <Card className="py-2 md:py-2">
        {filas.length === 0 ? (
          <EmptyState
            icon={NotebookPen}
            title="Aún no tienes notas"
            description="Aparecen aquí cuando tu profe evalúe tu primera entrega."
            action={
              <Button asChild variant="secondary" size="sm">
                <Link href={tareasHref}>Ver tareas por entregar</Link>
              </Button>
            }
          />
        ) : visibles.length === 0 ? (
          <p className="text-body px-1 py-6 text-center text-text-2">
            {vacioFiltroTexto(filtro)}
          </p>
        ) : (
          <CardList>
            {visibles.map(({ id, ...fila }) => (
              <GradeRow key={id} {...fila} />
            ))}
          </CardList>
        )}
      </Card>
    </section>
  );
}
