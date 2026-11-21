import { useCallback, useLayoutEffect, useRef } from "react";
import {
  flipDeltas,
  idsNuevos,
  idsQuitados,
  type Posiciones,
  type PosicionFlip,
  parseCssTime,
} from "@/lib/flip";

/*
 * FLIP (HANDOFF §6): First (posición anterior) · Last (la nueva, ya reordenada) · Invert
 * (translate inverso, en X e Y: sirve en listas y en cuadrículas) · Play (a 0). Solo anima
 * `transform` y `opacity`, con `--d-rank` / `--d-normal` y `--ease` leídos de :root. Con
 * prefers-reduced-motion (o la duración a 0) reordena al instante.
 * Cada commit mide los elementos registrados; la primera medición solo guarda posiciones.
 * Listas de gestión (D281): `duracion: "--d-normal"` (filtrar no es un cambio de puesto) y
 * `entrada`: los que aparecen después de la primera medición (alta, quitar un filtro) entran con
 * opacidad (`--d-normal`). `salida` (D542): los que desaparecen (eliminar, filtrar, mover a otra
 * zona) se despiden con un fundido sobre un «fantasma» (clon inerte, `aria-hidden`, en su última
 * posición); el estado real ya cambió, el fantasma solo es pintura y no estorba clics. Sin
 * opciones, el ranking queda igual.
 * Con `raiz` (D543) las posiciones se miden relativas a esa caja: si la caja entera se mueve (una
 * tarjeta que baja porque la de arriba creció) sus hijos no se animan además, que sería doble.
 */
export function useFlip<
  T extends HTMLElement = HTMLElement,
  R extends HTMLElement = HTMLElement,
>({
  duracion: variable = "--d-rank",
  entrada = false,
  salida = false,
}: {
  /** Variable CSS de la duración del viaje. */
  duracion?: "--d-rank" | "--d-normal";
  /** Animar la aparición de los nuevos (solo opacidad). */
  entrada?: boolean;
  /** Animar la salida de los que desaparecen (fantasma con opacidad a 0). */
  salida?: boolean;
} = {}) {
  const nodos = useRef(new Map<string, T>());
  const caja = useRef<R | null>(null);
  const anterior = useRef<Posiciones>(new Map());
  const previos = useRef(new Map<string, Medida<T>>());
  const medido = useRef(false);

  /** `ref={registrar(id)}` en cada elemento que se traslada. */
  const registrar = useCallback(
    (id: string) => (el: T | null) => {
      if (el) nodos.current.set(id, el);
      else nodos.current.delete(id);
    },
    [],
  );

  /** `ref={raiz}` en la caja contra la que se mide (opcional). */
  const raiz = useCallback((el: R | null) => {
    caja.current = el;
  }, []);

  // Sin lista de dependencias a propósito: el orden llega por los hijos, y medir 30 filas es barato.
  useLayoutEffect(() => {
    const origen = caja.current?.getBoundingClientRect();
    const nueva = new Map<string, PosicionFlip>();
    const medidas = new Map<string, Medida<T>>();
    for (const [id, el] of nodos.current) {
      const r = el.getBoundingClientRect();
      const abs = { x: r.left + window.scrollX, y: r.top + window.scrollY };
      nueva.set(
        id,
        origen ? { x: r.left - origen.left, y: r.top - origen.top } : abs,
      );
      medidas.set(id, {
        el,
        padre: el.parentElement,
        ...abs,
        ancho: r.width,
        alto: r.height,
      });
    }
    const previa = anterior.current;
    const medidasPrevias = previos.current;
    const primera = !medido.current;
    anterior.current = nueva;
    previos.current = medidas;
    medido.current = true;
    if (primera) return;
    const nuevos = entrada ? idsNuevos(previa, nueva) : [];
    const quitados = salida ? idsQuitados(previa, nueva) : [];
    if (previa.size === 0 && nuevos.length === 0) return;

    const reducido = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const estilo = getComputedStyle(document.documentElement);
    const duracion = parseCssTime(estilo.getPropertyValue(variable), 0);
    if (reducido || duracion <= 0) return;
    const easing = estilo.getPropertyValue("--ease").trim() || "ease";

    for (const [id, { dx, dy }] of flipDeltas(previa, nueva)) {
      nodos.current
        .get(id)
        ?.animate(
          [
            { transform: `translate(${dx}px, ${dy}px)` },
            { transform: "translate(0, 0)" },
          ],
          { duration: duracion, easing },
        );
    }
    const fundido = parseCssTime(estilo.getPropertyValue("--d-normal"), 0);
    if (fundido <= 0) return;
    for (const id of nuevos) {
      nodos.current.get(id)?.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: fundido,
        easing,
      });
    }
    for (const id of quitados) {
      const m = medidasPrevias.get(id);
      // Si se fue la lista entera (cambio de vista, otra pantalla) no hay dónde despedirlo
      if (m?.padre?.isConnected) despedir(m, fundido, easing);
    }
  });

  return { registrar, raiz };
}

type Medida<T extends HTMLElement> = {
  el: T;
  /** Su padre al medir: si ya no está en el documento, no hay fantasma. */
  padre: HTMLElement | null;
  /** Coordenadas de documento. */
  x: number;
  y: number;
  ancho: number;
  alto: number;
};

/**
 * Fantasma de un elemento que ya no está: su clon (sin ids, inerte y oculto a lectores de
 * pantalla) se queda en su última posición y se desvanece con `opacity`; luego se quita solo.
 */
function despedir<T extends HTMLElement>(
  m: Medida<T>,
  duration: number,
  easing: string,
) {
  const clon = m.el.cloneNode(true) as HTMLElement;
  clon.removeAttribute("id");
  for (const n of clon.querySelectorAll("[id]")) n.removeAttribute("id");
  const fila = clon instanceof HTMLTableRowElement;
  const envoltorio = document.createElement(fila ? "table" : "div");
  if (fila) envoltorio.appendChild(document.createElement("tbody"));
  (fila ? envoltorio.firstElementChild : envoltorio)?.appendChild(clon);
  envoltorio.setAttribute("aria-hidden", "true");
  envoltorio.inert = true;
  Object.assign(envoltorio.style, {
    position: "absolute",
    left: `${m.x}px`,
    top: `${m.y}px`,
    width: `${m.ancho}px`,
    height: fila ? "auto" : `${m.alto}px`,
    margin: "0",
    pointerEvents: "none",
  });
  document.body.appendChild(envoltorio);
  const a = envoltorio.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration,
    easing,
    fill: "both",
  });
  const quitar = () => envoltorio.remove();
  a.onfinish = quitar;
  a.oncancel = quitar;
}
