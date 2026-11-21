"use client";

import { useSyncExternalStore } from "react";

/*
 * Estado de la red del navegador (`navigator.onLine` + eventos online/offline). En el servidor y
 * durante la hidratación vale `true`: la variante «sin conexión» solo aparece en el cliente.
 */
function suscribir(aviso: () => void) {
  window.addEventListener("online", aviso);
  window.addEventListener("offline", aviso);
  return () => {
    window.removeEventListener("online", aviso);
    window.removeEventListener("offline", aviso);
  };
}

export function useEnLinea(): boolean {
  return useSyncExternalStore(
    suscribir,
    () => navigator.onLine,
    () => true,
  );
}

/**
 * ¿Hay red ahora mismo? Para el `onSubmit` de un formulario cuyo botón es `BotonEnLinea`: Enter
 * en un campo envía sin pasar por el botón deshabilitado (D539). Solo se llama en el cliente.
 */
export function hayRed(): boolean {
  return typeof navigator === "undefined" || navigator.onLine;
}

const sinSuscripcion = () => () => {};

/**
 * `location.pathname` en el cliente; `null` en el servidor y al hidratar. Para las pantallas de
 * estado prerenderizadas (el 404 estático no conoce la dirección pedida).
 */
export function useRutaActual(): string | null {
  return useSyncExternalStore(
    sinSuscripcion,
    () => window.location.pathname,
    () => null,
  );
}
