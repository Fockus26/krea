"use client";

import { createContext, type ReactNode, use, useState } from "react";
import { createPortal } from "react-dom";

/*
 * Acción de la página en la barra superior móvil (D130; p. ej. «Guardar borrador» del constructor,
 * HANDOFF §3). El layout del grupo envuelve el shell en `TopBarAccionProvider`; `RouteTopBar`
 * pone `TopBarAccionDestino` en la topbar, y la página pinta su botón con
 *   <TopBarAccion><Button variant="ghost" size="sm" …>Guardar borrador</Button></TopBarAccion>
 * que lo lleva allí con un portal (sigue siendo parte del árbol de la página: su estado y sus
 * manejadores son los de la página, y se desmonta con ella al navegar).
 * La topbar solo existe < lg: en escritorio la página muestra su propio botón (aside).
 * El botón aparece tras hidratar (el portal necesita el nodo del DOM); el HTML del servidor no
 * lo trae.
 */

type Destino = {
  nodo: HTMLElement | null;
  setNodo: (nodo: HTMLElement | null) => void;
};

const DestinoContext = createContext<Destino | null>(null);

export function TopBarAccionProvider({ children }: { children: ReactNode }) {
  const [nodo, setNodo] = useState<HTMLElement | null>(null);
  return <DestinoContext value={{ nodo, setNodo }}>{children}</DestinoContext>;
}

/** Hueco de la topbar: `display: contents`, así lo que llega es un ítem más de su fila flex. */
export function TopBarAccionDestino() {
  const destino = use(DestinoContext);
  return (
    <div
      ref={destino?.setNodo}
      data-slot="topbar-accion"
      className="contents"
    />
  );
}

/** Lleva `children` a la topbar móvil del shell. Fuera del provider no pinta nada. */
export function TopBarAccion({ children }: { children: ReactNode }) {
  const destino = use(DestinoContext);
  return destino?.nodo ? createPortal(children, destino.nodo) : null;
}
