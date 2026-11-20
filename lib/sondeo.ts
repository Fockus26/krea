"use client";
// Sondeo para lo «en vivo» (D327: Postgres no tiene onSnapshot). Llama a `pedir` al montar y cada
// `cadaMs`; con la pestaña oculta no pide, y al volver a verla pide tras ESPERA_AL_VOLVER_MS (D437:
// un móvil que despierta aún no tiene red y ese primer pedido fallaba). `pedir` recibe una señal
// que se aborta al desmontar.
import { useEffect, useRef } from "react";

/** Cada cuánto se refresca lo «en vivo» (ranking, presencia). */
export const SONDEO_MS = 5_000;

/** Lo que se espera al volver la pestaña a la vista antes de pedir (D437). */
export const ESPERA_AL_VOLVER_MS = 1_000;

/**
 * Fallos SEGUIDOS antes de avisar «no se está actualizando» o vaciar lo en vivo (D437): ≈ 15 s con
 * SONDEO_MS. Uno suelto (red que parpadea, un deploy, la base un segundo ocupada) no se nota.
 */
export const FALLOS_PARA_CORTADO = 3;

/** El contador de fallos seguidos tras un intento: un éxito lo vuelve a 0. */
export const fallosTras = (fallos: number, ok: boolean): number =>
  ok ? 0 : fallos + 1;

/** ¿Ya son bastantes fallos seguidos para decir que se cortó? */
export const estaCortado = (fallos: number): boolean =>
  fallos >= FALLOS_PARA_CORTADO;

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
    let despertar: ReturnType<typeof setTimeout> | undefined;
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
      clearTimeout(despertar);
      if (document.visibilityState === "visible")
        despertar = setTimeout(tic, ESPERA_AL_VOLVER_MS);
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      control.abort();
      clearInterval(reloj);
      clearTimeout(despertar);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [cadaMs, activo]);
}
