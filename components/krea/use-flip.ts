import { useCallback, useLayoutEffect, useRef } from "react";
import {
  flipDeltas,
  idsNuevos,
  type PosicionesY,
  parseCssTime,
} from "@/lib/flip";

/*
 * FLIP del ranking (HANDOFF §6): First (posición anterior) · Last (la nueva, ya reordenada)
 * · Invert (translateY inverso) · Play (a 0). Solo anima `transform`, con `--d-rank` y `--ease`
 * leídos de :root. Con prefers-reduced-motion (o la duración a 0) reordena al instante.
 * Cada commit mide las filas registradas; la primera medición solo guarda posiciones.
 * Listas de gestión (D281): `duracion: "--d-normal"` (filtrar no es un cambio de puesto) y
 * `entrada`: las filas que aparecen después de la primera medición (alta, quitar un filtro)
 * entran con opacidad (`k-fade-in`, `--d-normal`). Sin opciones, el ranking queda igual.
 */
export function useFlip<T extends HTMLElement = HTMLElement>({
  duracion: variable = "--d-rank",
  entrada = false,
}: {
  /** Variable CSS de la duración del viaje. */
  duracion?: "--d-rank" | "--d-normal";
  /** Animar la aparición de filas nuevas (solo opacidad). */
  entrada?: boolean;
} = {}) {
  const nodos = useRef(new Map<string, T>());
  const anterior = useRef<PosicionesY>(new Map());
  const medido = useRef(false);

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
    const primera = !medido.current;
    anterior.current = nueva;
    medido.current = true;
    if (primera) return;
    const nuevos = entrada ? idsNuevos(previa, nueva) : [];
    if (previa.size === 0 && nuevos.length === 0) return;

    const reducido = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const estilo = getComputedStyle(document.documentElement);
    const duracion = parseCssTime(estilo.getPropertyValue(variable), 0);
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
    if (nuevos.length === 0) return;
    const fundido = parseCssTime(estilo.getPropertyValue("--d-normal"), 0);
    for (const id of nuevos) {
      nodos.current.get(id)?.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: fundido,
        easing,
      });
    }
  });

  return { registrar };
}
