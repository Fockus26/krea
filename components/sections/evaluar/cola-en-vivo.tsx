"use client";

import { useRouter } from "next/navigation";
import { useVersionEvaluar } from "./use-version-evaluar";

/**
 * La cola de Evaluar en vivo (D441): si otro profe evalúa o un alumno entrega, la versión cambia
 * y la página se vuelve a pedir al servidor (`router.refresh`), sin recargar ni perder los
 * filtros. No pinta nada: la lista nueva llega con el render del servidor.
 */
export function ColaEnVivo({ version }: { version: string }) {
  const router = useRouter();
  useVersionEvaluar({ inicial: version, alCambiar: () => router.refresh() });
  return null;
}
