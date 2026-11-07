import type { ReactNode } from "react";
import { PageHeader } from "@/components/sections/shared/page-header";
import { SelectorSeccion } from "@/components/sections/shared/selector-seccion";
import { VistaToggle } from "@/components/sections/shared/vista-toggle";
import type { SeccionId } from "@/lib/modelo";
import { slugSeccion } from "@/lib/secciones";
import { CLAVE_VISTA_EQUIPOS } from "@/lib/vista";

/**
 * Encabezado de Equipos (HANDOFF §3 Equipos): eyebrow con los recuentos, h1 y el selector de
 * sección del catálogo (D322). La sección es una ruta (`/profe/equipos/4b`), así que con pocas
 * secciones son enlaces con `aria-current` (D095), no un radiogroup (D110). `acciones` («Nuevo
 * equipo», W12) va antes del selector y envuelve con él; entre los dos, el interruptor Tarjetas /
 * Lista (D313).
 */
export function TeamsHeader({
  eyebrow,
  seccion,
  secciones,
  base,
  acciones,
}: {
  eyebrow: string;
  seccion: SeccionId;
  /** Secciones del catálogo, ordenadas. */
  secciones: readonly SeccionId[];
  /** Prefijo de las rutas de sección. */
  base: string;
  acciones?: ReactNode;
}) {
  return (
    <PageHeader
      eyebrow={eyebrow}
      title="Equipos"
      actions={
        <>
          {acciones}
          <VistaToggle clave={CLAVE_VISTA_EQUIPOS} />
          <SelectorSeccion
            secciones={secciones}
            valor={seccion}
            hrefs={Object.fromEntries(
              secciones.map((s) => [s, `${base}/${slugSeccion(s)}`]),
            )}
          />
        </>
      }
    />
  );
}
