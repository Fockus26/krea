"use client";
// Sondeo de `/api/evaluar/version` (D441): cada `SONDEO_MS` pregunta con la última versión
// conocida; 204 = nada cambió. `alCambiar` recibe la respuesta nueva (la primera también, si no
// se dio una versión inicial). Con la pestaña oculta no pide (`useSondeo`).
import { useEffect, useRef, useState } from "react";
import { rutaVersionEvaluar, type VersionEvaluar } from "@/lib/evaluar-vivo";
import { SONDEO_MS, useSondeo } from "@/lib/sondeo";

export function useVersionEvaluar({
  inicial = null,
  entrega,
  activo = true,
  alCambiar,
}: {
  /** La versión con la que el servidor pintó la pantalla. */
  inicial?: string | null;
  /** Id de la entrega abierta: la respuesta trae su estado. */
  entrega?: string;
  activo?: boolean;
  alCambiar: (v: VersionEvaluar) => void;
}): void {
  const desde = useRef(inicial);
  const cb = useRef(alCambiar);
  cb.current = alCambiar;
  // Un render nuevo del servidor (router.refresh) trae su propia versión
  useEffect(() => {
    desde.current = inicial;
  }, [inicial]);

  useSondeo(
    async (senal) => {
      const r = await fetch(
        rutaVersionEvaluar({ desde: desde.current, entrega }),
        { signal: senal, cache: "no-store" },
      );
      if (r.status !== 200) return;
      const v = (await r.json()) as VersionEvaluar;
      if (typeof v.version !== "string" || v.version === desde.current) return;
      desde.current = v.version;
      cb.current(v);
    },
    SONDEO_MS,
    activo,
  );
}

/**
 * El contador «N por evaluar» del menú en vivo (D441): arranca con el valor del servidor (el
 * layout no se vuelve a pintar al navegar) y lo reemplaza con `porEvaluar` de cada cambio. Si el
 * servidor trae otro valor (un `refresh`), manda el suyo. `null`/`undefined` (sin sesión aún o
 * fuera del profesor): no sondea.
 */
export function usePorEvaluarEnVivo(
  inicial: number | null | undefined,
): number | null | undefined {
  const [vivo, setVivo] = useState<{
    de: number | null | undefined;
    n: number;
  } | null>(null);
  useVersionEvaluar({
    activo: inicial != null,
    alCambiar: (v) => setVivo({ de: inicial, n: v.porEvaluar }),
  });
  return vivo && vivo.de === inicial ? vivo.n : inicial;
}
