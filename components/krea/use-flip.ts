import { useCallback, useLayoutEffect, useRef } from "react";
import { flipDeltas, type PosicionesY, parseCssTime } from "@/lib/flip";

/*
 * FLIP del ranking (HANDOFF §6): First (posición anterior) · Last (la nueva, ya reordenada)
 * · Invert (translateY inverso) · Play (a 0). Solo anima `transform`, con `--d-rank` y `--ease`
 * leídos de :root. Con prefers-reduced-motion (o `--d-rank` a 0) reordena al instante.
 * Cada commit mide las filas registradas; la primera medición solo guarda posiciones.
 */
export function useFlip<T extends HTMLElement = HTMLElement>() {
  const nodos = useRef(new Map<string, T>());
  const anterior = useRef<PosicionesY>(new Map());

  /** `ref={registrar(id)}` en cada fila (el elemento que se traslada). */
  const registrar = useCallback(
    (id: string) => (el: T | null) => {
      if (el) nodos.current.set(id, el);
      else nodos.current.delete(id);
    },
    [],
  );

  // Sin lista de dependencias a propósito: el orden llega por los hijos, y medir 30 filas es barato.
  useLayoutEffect(() => {
    const nueva = new Map<string, number>();
    for (const [id, el] of nodos.current) {
      nueva.set(id, el.getBoundingClientRect().top + window.scrollY);
    }
    const previa = anterior.current;
    anterior.current = nueva;
    if (previa.size === 0) return;

    const reducido = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const estilo = getComputedStyle(document.documentElement);
    const duracion = parseCssTime(estilo.getPropertyValue("--d-rank"), 0);
    if (reducido || duracion <= 0) return;
    const easing = estilo.getPropertyValue("--ease").trim() || "ease";

    for (const [id, d] of flipDeltas(previa, nueva)) {
      nodos.current
        .get(id)
        ?.animate(
          [{ transform: `translateY(${d}px)` }, { transform: "translateY(0)" }],
          { duration: duracion, easing },
        );
    }
  });

  return { registrar };
}
