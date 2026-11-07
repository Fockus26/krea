"use client";

// Selección de las casillas del lote (D298, D310): un solo lugar para Alumnos, Profesores y las
// pantallas que vengan (Tareas, Equipos). `ids` = lo seleccionable en el orden visible.
// Clic alterna una y fija el ancla; Shift+clic (o Shift+Espacio con la casilla enfocada) aplica al
// rango ancla→clicada el estado que toma esa casilla. El `Checkbox` de shadcn es un `button`:
// `onCheckedChange` no trae el evento, así que el Shift se lee en `onClick`/`onKeyDown`.
import { type KeyboardEvent, type MouseEvent, useRef, useState } from "react";
import {
  alternarRango,
  alternarTodos,
  alternarUno,
  podarSeleccion,
} from "@/lib/lote";

export function useSeleccionLote(ids: readonly string[]) {
  const [marcadas, setMarcadas] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const ancla = useRef<string | null>(null);
  // Shift visto en el evento que precede a `onCheckedChange`
  const shift = useRef(false);
  const shiftTeclado = useRef(false);

  function alternar(id: string, marcar: boolean, conShift: boolean) {
    const a = ancla.current;
    if (conShift && a !== null && ids.includes(a)) {
      setMarcadas((m) => alternarRango(m, ids, a, id, marcar));
    } else {
      setMarcadas((m) => alternarUno(m, id, marcar));
      ancla.current = id;
    }
  }

  /** Props de la casilla de `id`: sustituyen a `checked`/`onCheckedChange`. */
  function casilla(id: string) {
    return {
      checked: marcadas.has(id),
      onClick: (e: MouseEvent) => {
        shift.current = e.shiftKey || shiftTeclado.current;
        shiftTeclado.current = false;
      },
      onKeyDown: (e: KeyboardEvent) => {
        if (e.key === " ") shiftTeclado.current = e.shiftKey;
      },
      onBlur: () => {
        shiftTeclado.current = false;
      },
      onCheckedChange: (v: boolean | "indeterminate") => {
        const conShift = shift.current;
        shift.current = false;
        alternar(id, v === true, conShift);
      },
    };
  }

  return {
    marcadas,
    casilla,
    alternarTodos: () => {
      setMarcadas((m) => alternarTodos(ids, m));
      ancla.current = null;
    },
    limpiar: () => {
      setMarcadas(new Set());
      ancla.current = null;
    },
    /** Quita de la selección (tras borrar). */
    quitar: (fuera: readonly string[]) => {
      const f = new Set(fuera);
      setMarcadas((m) => new Set([...m].filter((c) => !f.has(c))));
    },
    /** Deja solo lo que sigue existiendo (tras `refresh()`). */
    podar: (existentes: readonly string[]) =>
      setMarcadas((m) => podarSeleccion(m, existentes)),
  };
}
