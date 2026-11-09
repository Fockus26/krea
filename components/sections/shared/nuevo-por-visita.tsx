"use client";

import { useRouter } from "next/navigation";
import { Fragment, type ReactNode } from "react";

/**
 * Formularios de «crear» que tienen que abrir vacíos cada vez. Con `cacheComponents`, Next oculta
 * las páginas vistas con `<Activity>` en vez de desmontarlas: sin esto, volver a «Nueva tarea»
 * mostraba la anterior, con su id, y el próximo guardado la sobrescribía. `bfcacheId` cambia en
 * cada navegación nueva (enlace, `router.push`) y se mantiene con atrás/adelante del navegador,
 * que sí recupera lo que se estaba escribiendo.
 */
export function NuevoPorVisita({ children }: { children: ReactNode }) {
  const { bfcacheId } = useRouter();
  return <Fragment key={bfcacheId}>{children}</Fragment>;
}
