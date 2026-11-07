"use client";

import { type Ref, useLayoutEffect, useRef } from "react";
import { parseCssTime } from "@/lib/flip";
import {
  type Caja,
  cajaRelativa,
  flipIndicador,
  memoriaVigente,
  transformDe,
} from "@/lib/indicador";
import { cn } from "@/lib/utils";

/*
 * Indicador que se desliza (HANDOFF §6, pedidos 42 y 43; D279, reemplaza a D039): un solo hijo
 * absoluto de la lista que viaja a la opción activa con `transform` (translate + scale, FLIP con
 * WAAPI, `--d-normal` y `--ease`). Su caja de reposo (ancho/alto) se pone sin transición; nunca
 * se animan `width`/`left`.
 *  - Mientras no ha medido (HTML del servidor, lista oculta), la opción activa conserva su propio
 *    fondo/barra; al medir, la lista recibe `data-ind` y esos estilos ceden al indicador
 *    (`group-data-[ind]:…:bg-transparent` en cada componente, más específico que el estilo
 *    propio). Sin JS, todo se ve como antes.
 *  - Sigue a la opción activa con un MutationObserver (Radix cambia `data-state` sin re-render
 *    del wrapper) y se recoloca sin animar cuando cambia el tamaño (ResizeObserver).
 *  - `memoria`: para segmentados de enlaces (cada opción es otra página y el control se vuelve a
 *    montar): guarda la caja al ocultarse y, si la nueva página lo monta en menos de 1 s, viaja
 *    desde ahí.
 *  - Reduced motion: `--d-normal` vale 0 → aparece en su sitio, sin viaje.
 */

const memorias = new Map<string, { caja: Caja; t: number }>();

const OBSERVADOS = ["data-state", "aria-current", "aria-checked"];

export function useIndicador<L extends HTMLElement>({
  activo,
  eje = "xy",
  memoria,
}: {
  /** Selector de la opción activa dentro de la lista. */
  activo: string;
  /** `x`: barra de línea (alto y posición vertical los pone el CSS). */
  eje?: "x" | "xy";
  /** Clave para viajar entre páginas (segmentado de enlaces). */
  memoria?: string;
}) {
  const listaRef = useRef<L>(null);
  const indicadorRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const lista = listaRef.current;
    const ind = indicadorRef.current;
    if (!lista || !ind) return;
    let previa: Caja | null = memoria
      ? memoriaVigente(memorias.get(memoria), Date.now())
      : null;

    const colocar = (animar: boolean) => {
      const el = lista.querySelector<HTMLElement>(activo);
      const lr = lista.getBoundingClientRect();
      const r = el?.getBoundingClientRect();
      if (!r || r.width <= 0 || lr.width <= 0) {
        // Oculta o sin opción activa: el fondo propio de la opción vuelve a mandar
        delete lista.dataset.ind;
        return;
      }
      const caja = cajaRelativa(
        r,
        lr,
        { left: lista.scrollLeft, top: lista.scrollTop },
        { left: lista.clientLeft, top: lista.clientTop },
      );
      ind.style.width = `${caja.w}px`;
      if (eje === "xy") ind.style.height = `${caja.h}px`;
      ind.style.transform = transformDe(caja, eje);
      lista.dataset.ind = "";

      const desde = animar ? flipIndicador(previa, caja, eje) : null;
      previa = caja;
      if (!desde) return;
      const reducido = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const estilo = getComputedStyle(document.documentElement);
      const duracion = parseCssTime(estilo.getPropertyValue("--d-normal"), 0);
      if (reducido || duracion <= 0) return;
      const easing = estilo.getPropertyValue("--ease").trim() || "ease";
      ind.animate(
        [{ transform: desde }, { transform: transformDe(caja, eje) }],
        {
          duration: duracion,
          easing,
        },
      );
    };

    colocar(true);
    const cambios = new MutationObserver(() => colocar(true));
    cambios.observe(lista, {
      subtree: true,
      attributes: true,
      attributeFilter: OBSERVADOS,
    });
    const tamano = new ResizeObserver(() => colocar(false));
    tamano.observe(lista);
    return () => {
      cambios.disconnect();
      tamano.disconnect();
      if (memoria && previa)
        memorias.set(memoria, { caja: previa, t: Date.now() });
    };
  }, [activo, eje, memoria]);

  return { listaRef, indicadorRef };
}

/**
 * El indicador: va dentro de la lista (que es `relative isolate`), detrás de las opciones
 * (`-z-10`). `linea`: barra de 3 px de acento al pie; `segmentado`: la «opción levantada»
 * (`--surface` + `shadow-1`). Invisible hasta que la lista tiene `data-ind`.
 */
export function Indicador({
  ref,
  variante,
  className,
}: {
  ref: Ref<HTMLSpanElement>;
  variante: "linea" | "segmentado";
  className?: string;
}) {
  return (
    <span
      ref={ref}
      aria-hidden="true"
      data-slot="indicador"
      className={cn(
        "pointer-events-none absolute left-0 -z-10 origin-top-left opacity-0 in-data-[ind]:opacity-100",
        variante === "linea" && "bottom-0 h-0.75 rounded-t-xs bg-accent",
        variante === "segmentado" && "top-0 rounded-nav bg-surface shadow-1",
        className,
      )}
    />
  );
}
