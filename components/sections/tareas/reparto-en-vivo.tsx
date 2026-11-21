"use client";
// Reparto en vivo (D465): sustituye a «Actualizar» (D424). Sondea `/api/partes/version` cada
// `SONDEO_MS` con la última versión conocida (204 = nada cambió) y, si cambió, `router.refresh()`:
// el servidor vuelve a pintar el panel, las partes y los bloqueos. Lo que el capitán escribe no se
// pierde: el formulario no se remonta (sin `key` que cambie) y su estado sigue en el cliente.
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { rutaVersionPartes } from "@/lib/partes";
import { SONDEO_MS, useSondeo } from "@/lib/sondeo";

export function useVersionPartes({
  tareaId,
  inicial,
  activo = true,
  alCambiar,
}: {
  tareaId: string;
  /** La versión con la que el servidor pintó la pantalla. */
  inicial: string;
  activo?: boolean;
  alCambiar: (version: string) => void;
}): void {
  const desde = useRef(inicial);
  const cb = useRef(alCambiar);
  cb.current = alCambiar;
  // Un render nuevo del servidor (refresh tras una acción) trae su propia versión
  useEffect(() => {
    desde.current = inicial;
  }, [inicial]);

  useSondeo(
    async (senal) => {
      const r = await fetch(rutaVersionPartes(tareaId, desde.current), {
        signal: senal,
        cache: "no-store",
      });
      if (r.status !== 200) return;
      const v = (await r.json()) as { version?: unknown };
      if (typeof v.version !== "string" || v.version === desde.current) return;
      desde.current = v.version;
      cb.current(v.version);
    },
    SONDEO_MS,
    activo,
  );
}

/** Sin interfaz: la página lo monta en una grupal abierta sin enviar (capitán o integrante). */
export function RepartoEnVivo({
  tareaId,
  version,
}: {
  tareaId: string;
  version: string;
}) {
  const router = useRouter();
  useVersionPartes({
    tareaId,
    inicial: version,
    alCambiar: () => router.refresh(),
  });
  return null;
}
