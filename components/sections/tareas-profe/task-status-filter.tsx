"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  esFiltroEstado,
  FILTROS_ESTADO,
  type FiltroEstado,
  filtroFrase,
} from "@/lib/tareas-profe";

/**
 * Segmentado de estado de la lista (HANDOFF §3): filtra en sitio los mismos datos, así que es un
 * radiogroup local (`ToggleGroup`, D099), no enlaces. Con scroll horizontal propio si no cabe
 * (§4: sin scroll de página a 320). La única región viva es el `<output>` con una frase estable.
 */
export function TaskStatusFilter({
  filtro,
  onFiltro,
}: {
  filtro: FiltroEstado;
  onFiltro: (filtro: FiltroEstado) => void;
}) {
  return (
    <div className="flex flex-col">
      <div className="max-w-full self-start overflow-x-auto">
        <ToggleGroup
          aria-label="Filtrar por estado"
          value={filtro}
          onValueChange={(v) => {
            if (esFiltroEstado(v)) onFiltro(v);
          }}
          className="max-w-none"
        >
          {FILTROS_ESTADO.map(([valor, texto]) => (
            <ToggleGroupItem key={valor} value={valor}>
              {texto}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <output aria-live="polite" aria-atomic="true" className="sr-only">
        {filtroFrase(filtro)}
      </output>
    </div>
  );
}
