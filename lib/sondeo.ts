"use client";
// Sondeo para lo «en vivo» (D327: Postgres no tiene onSnapshot). Llama a `pedir` al montar y cada
// `cadaMs`; con la pestaña oculta no pide, y al volver a verla pide al momento. `pedir` recibe una
// señal que se aborta al desmontar.
import { useEffect, useRef } from "react";

/** Cada cuánto se refresca lo «en vivo» (ranking, presencia). */
export const SONDEO_MS = 5_000;

export function useSondeo(
  pedir: (senal: AbortSignal) => Promise<void>,
  cadaMs: number,
  activo = true,
): void {
  const ref = useRef(pedir);
  ref.current = pedir;
  useEffect(() => {
    if (!activo) return;
    const control = new AbortController();
    let enCurso = false;
    const tic = async () => {
      if (enCurso || document.visibilityState === "hidden") return;
      enCurso = true;
      try {
        await ref.current(control.signal);
      } catch {
        // Quien pide decide qué mostrar; aquí solo se sigue intentando
      } finally {
        enCurso = false;
      }
    };
    void tic();
    const reloj = setInterval(tic, cadaMs);
    const alVolver = () => {
      if (document.visibilityState === "visible") void tic();
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      control.abort();
      clearInterval(reloj);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [cadaMs, activo]);
}
