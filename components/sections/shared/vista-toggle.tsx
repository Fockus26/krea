"use client";

import { LayoutGrid, List } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { VISTA_LABEL, VISTA_TEXTO, VISTAS, vistaDe } from "@/lib/vista";
import { useVista } from "./use-vista";

const ICONO = { tarjetas: LayoutGrid, lista: List } as const;

/** `id` de la opción «Lista»: recibe el foco cuando un lote deja la tabla vacía (D313). */
export const vistaListaId = (clave: string) =>
  `vista-${clave.replaceAll(".", "-")}-lista`;

/**
 * Interruptor Tarjetas / Lista (D313): radiogroup con nombre «Vista» (`ToggleGroup`, D038), cada
 * opción con ícono + palabra (el estado elegido es la opción levantada y `aria-checked`, no solo
 * color). Lo elegido se recuerda en este navegador con `clave` (`useVista`).
 */
export function VistaToggle({ clave }: { clave: string }) {
  const [vista, setVista] = useVista(clave);
  return (
    <ToggleGroup
      aria-label={VISTA_LABEL}
      value={vista}
      onValueChange={(v) => setVista(vistaDe(v))}
    >
      {VISTAS.map((v) => {
        const Icono = ICONO[v];
        return (
          <ToggleGroupItem
            key={v}
            value={v}
            id={v === "lista" ? vistaListaId(clave) : undefined}
          >
            <Icono aria-hidden="true" />
            {VISTA_TEXTO[v]}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
