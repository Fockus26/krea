"use client";

import type * as React from "react";
import { createContext, useContext, useState } from "react";

/*
 * Destino de los portales de Radix (Dialog, Sheet, DropdownMenu). Sin `PortalScope`, los
 * portales montan en `body` y heredan el tema y el acento de `<html>` (D015). Dentro de un
 * `PortalScope` montan en un nodo suyo, así que heredan `data-theme`/`data-accent` del
 * contenedor más cercano (los escenarios de /componentes, D029). D034.
 */
const PortalContainerContext = createContext<HTMLElement | null>(null);

/** Contenedor para el `container` de un Portal de Radix; `undefined` = `body`. */
function usePortalContainer(): HTMLElement | undefined {
  return useContext(PortalContainerContext) ?? undefined;
}

/**
 * Los overlays abiertos desde `children` se montan en un nodo al final del ámbito, dentro
 * del mismo árbol de `data-theme`/`data-accent`. El nodo es `display: contents` (no ocupa
 * hueco en un flex/grid) y su contenido es `position: fixed`: nada de lo de arriba puede
 * tener `transform`, `filter` ni `contain`, o el overlay dejaría de cubrir la pantalla.
 */
function PortalScope({ children }: { children: React.ReactNode }) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  return (
    <PortalContainerContext value={container}>
      {children}
      <div ref={setContainer} data-slot="portal-scope" className="contents" />
    </PortalContainerContext>
  );
}

export { PortalScope, usePortalContainer };
