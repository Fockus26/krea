"use client";

import { ChevronDown, Info } from "lucide-react";
import { useEffect, useState } from "react";
import {
  AYUDA_CLAVE,
  ayudaAbiertaDe,
  ayudaValor,
  REGLAS_MOVIL,
  REGLAS_TITULO_MOVIL,
} from "@/lib/ranking-vista";
import { cn } from "@/lib/utils";

/*
 * `<details>` móvil «¿Cómo se calculan los puntos?» (HANDOFF §3 Ranking §1, D097). Abierto la
 * primera vez; después recuerda lo último que el estudiante eligió en `localStorage`
 * (`krea-ranking-ayuda`). El estado es de React —el clic del `summary` se intercepta— y no del
 * evento `toggle`, que el navegador dispara también al montar y pisaría lo guardado. El servidor
 * pinta abierto; la lectura va en un efecto y todo acceso al almacenamiento va en try/catch (modo
 * privado: no recuerda, sigue abierto).
 */
export function RankingHowTo({ className }: { className?: string }) {
  const [abierto, setAbierto] = useState(true);

  useEffect(() => {
    try {
      setAbierto(ayudaAbiertaDe(localStorage.getItem(AYUDA_CLAVE)));
    } catch {
      // sin almacenamiento: queda abierto
    }
  }, []);

  return (
    <details
      open={abierto}
      className={cn(
        "rounded-md border border-divider bg-surface px-4 py-3",
        className,
      )}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: <summary> es interactivo de forma nativa (teclado incluido) */}
      <summary
        onClick={(e) => {
          e.preventDefault();
          const siguiente = !abierto;
          setAbierto(siguiente);
          try {
            localStorage.setItem(AYUDA_CLAVE, ayudaValor(siguiente));
          } catch {
            // sin almacenamiento: el cambio vale solo para esta visita
          }
        }}
        className="text-small-b icono-linea flex cursor-pointer list-none gap-2 rounded-sm py-[calc((--spacing(11)-1lh)/2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus [&::-webkit-details-marker]:hidden"
      >
        <Info aria-hidden="true" className="size-5 shrink-0 text-accent-ink" />
        {REGLAS_TITULO_MOVIL}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "ml-auto size-4 shrink-0 transition-transform duration-fast ease-krea motion-reduce:transition-none",
            abierto && "rotate-180",
          )}
        />
      </summary>
      <p className="text-small mt-2 text-text">{REGLAS_MOVIL}</p>
    </details>
  );
}
