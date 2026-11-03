"use client";

import { useEffect, useRef } from "react";
import { alturaMayor } from "@/lib/toast";

/*
 * Mide la barra de acción que la contiene y publica su alto en `--h-action-bar` del documento
 * (D131): el toast lo suma en < lg para quedar por encima de la barra, también cuando su
 * contenido envuelve a dos líneas a 320 px. Con varias barras montadas vale la más alta; al
 * desmontarse la última, la variable se quita. Hasta medir, el CSS usa `--h-review-action`.
 */
const alturas = new Map<Element, number>();

function publicar() {
  const raiz = document.documentElement.style;
  const alto = alturaMayor(alturas.values());
  if (alto === null) raiz.removeProperty("--h-action-bar");
  else raiz.setProperty("--h-action-bar", `${alto}px`);
}

export function ActionBarAltura() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const barra = ref.current?.parentElement;
    if (!barra) return;
    const observador = new ResizeObserver(([entrada]) => {
      alturas.set(
        barra,
        entrada?.borderBoxSize?.[0]?.blockSize ??
          barra.getBoundingClientRect().height,
      );
      publicar();
    });
    observador.observe(barra);
    return () => {
      observador.disconnect();
      alturas.delete(barra);
      publicar();
    };
  }, []);
  return <span ref={ref} hidden />;
}
