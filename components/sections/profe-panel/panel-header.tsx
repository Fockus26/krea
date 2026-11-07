import { PageHeader } from "@/components/sections/shared/page-header";
import { SelectorSeccion } from "@/components/sections/shared/selector-seccion";
import type { SeccionId } from "@/lib/modelo";
import {
  esFiltroSeccion,
  type FiltroSeccion,
  TODAS_SECCIONES,
  TODAS_TEXTO,
} from "@/lib/panel";

/**
 * Encabezado del Panel (HANDOFF §3 Panel §1): eyebrow, el único `<h1>` con el saludo por hora y el
 * filtro «Todas» + cada sección del catálogo (selector compartido, D322: radiogroup de
 * `ToggleGroup` con pocas, D038/D090; `Select` por año con más) que envuelve debajo si no cabe.
 * El saludo llega ya armado: la hora no se lee en el servidor (`saludoTexto` en `lib/panel.ts`).
 * Sin año fijo en el eyebrow (D326): la escuela puede tener varios.
 */
export function PanelHeader({
  saludo,
  secciones,
  filtro,
  onFiltro,
}: {
  saludo: string;
  secciones: readonly SeccionId[];
  filtro: FiltroSeccion;
  onFiltro: (f: FiltroSeccion) => void;
}) {
  return (
    <PageHeader
      // PROVISIONAL (CONTENT_CHECKLIST fila 170)
      eyebrow="Escuela Creativa del liceo"
      title={saludo}
      actions={
        secciones.length > 0 ? (
          <SelectorSeccion
            secciones={secciones}
            valor={filtro}
            todas={{ valor: TODAS_SECCIONES, texto: TODAS_TEXTO }}
            onCambio={(v) => {
              if (esFiltroSeccion(v, secciones)) onFiltro(v);
            }}
          />
        ) : null
      }
    />
  );
}
