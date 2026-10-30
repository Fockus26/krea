import { PageHeader } from "@/components/sections/shared/page-header";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  esFiltroSeccion,
  FILTROS_SECCION,
  type FiltroSeccion,
} from "@/lib/panel";

/**
 * Encabezado del Panel (HANDOFF §3 Panel §1): eyebrow, el único `<h1>` con el saludo por hora y el
 * segmentado 5A · 5C · Ambas (radiogroup de `ToggleGroup`, D038/D090) que envuelve debajo si no cabe.
 * El saludo llega ya armado: la hora no se lee en el servidor (`saludoTexto` en `lib/panel.ts`).
 */
export function PanelHeader({
  saludo,
  filtro,
  onFiltro,
}: {
  saludo: string;
  filtro: FiltroSeccion;
  onFiltro: (f: FiltroSeccion) => void;
}) {
  return (
    <PageHeader
      eyebrow="Escuela Creativa · 5.º año"
      title={saludo}
      actions={
        <ToggleGroup
          aria-label="Sección"
          value={filtro}
          onValueChange={(v) => {
            if (esFiltroSeccion(v)) onFiltro(v);
          }}
        >
          {FILTROS_SECCION.map(([valor, texto]) => (
            <ToggleGroupItem key={valor} value={valor}>
              {texto}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      }
    />
  );
}
