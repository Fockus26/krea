"use client";

// Vista Tarjetas / Lista recordada en `localStorage` (D313). El interruptor vive en la cabecera y
// la lista más abajo: los dos leen el mismo almacén (`useSyncExternalStore`). El servidor y la
// hidratación pintan Tarjetas (`getServerSnapshot`) y el valor guardado entra justo después, sin
// hidratación rota. Todo acceso al almacenamiento va en try/catch (modo privado: no recuerda y
// el cambio vale para esta visita, que guarda la memoria del módulo).
import { useSyncExternalStore } from "react";
import { VISTA_INICIAL, type Vista, vistaDe } from "@/lib/vista";

const oyentes = new Set<() => void>();
const deEstaVisita = new Map<string, Vista>();

function leer(clave: string): Vista {
  const elegida = deEstaVisita.get(clave);
  if (elegida) return elegida;
  try {
    return vistaDe(localStorage.getItem(clave));
  } catch {
    return VISTA_INICIAL;
  }
}

function suscribir(avisar: () => void) {
  oyentes.add(avisar);
  return () => {
    oyentes.delete(avisar);
  };
}

export function useVista(clave: string): [Vista, (v: Vista) => void] {
  const vista = useSyncExternalStore(
    suscribir,
    () => leer(clave),
    () => VISTA_INICIAL,
  );
  const cambiar = (v: Vista) => {
    deEstaVisita.set(clave, v);
    try {
      localStorage.setItem(clave, v);
    } catch {
      // sin almacenamiento: vale solo para esta visita
    }
    for (const avisar of oyentes) avisar();
  };
  return [vista, cambiar];
}
