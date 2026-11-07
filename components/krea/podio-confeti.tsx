"use client";

import type * as React from "react";
import { useEffect, useRef, useState } from "react";
import {
  CONFETI_MS,
  claveConfeti,
  debeCelebrar,
  MARCA_CONFETI,
  piezasConfeti,
} from "@/lib/ranking-celebracion";
import type { Vista } from "@/lib/ranking-vista";

const PIEZAS = piezasConfeti();

/*
 * Lluvia corta de confeti sobre el podio (D258): una vez por sesión y por vista, al montar (no en
 * cada `onSnapshot`). Piezas con `transform`/`opacity`, colores del acento, `absolute` dentro de
 * su contenedor (que recorta con `overflow-hidden`): no mueve nada del layout. Con reduced motion
 * no se monta. `sessionStorage` va en try/catch: sin almacenamiento celebra en cada visita.
 */
export function PodioConfeti({ vista }: { vista: Vista }) {
  const [visible, setVisible] = useState(false);
  // StrictMode ejecuta el efecto dos veces: la ref evita decidir (y marcar) dos veces
  const decidido = useRef(false);

  useEffect(() => {
    if (decidido.current) return;
    decidido.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let toca = true;
    try {
      toca = debeCelebrar(sessionStorage.getItem(claveConfeti(vista)));
      if (toca) sessionStorage.setItem(claveConfeti(vista), MARCA_CONFETI);
    } catch {
      // sin almacenamiento: celebra esta visita
    }
    if (toca) setVisible(true);
  }, [vista]);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), CONFETI_MS);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible) return null;
  return (
    <div
      aria-hidden="true"
      data-slot="podio-confeti"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {PIEZAS.map((p) => (
        <span
          key={`${p.izq}-${p.retardo}-${p.giro}-${p.color}`}
          style={
            {
              left: `${p.izq}%`,
              backgroundColor: p.color,
              "--confeti-deriva": `${p.deriva}rem`,
              "--confeti-giro": `${p.giro}deg`,
              "--confeti-caida": "14rem",
              "--confeti-retardo": `${p.retardo}ms`,
            } as React.CSSProperties
          }
          className="animate-confeti absolute top-0 h-3 w-1.5 rounded-sm"
        />
      ))}
    </div>
  );
}
