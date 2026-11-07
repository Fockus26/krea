import type { ReactNode } from "react";
import { SegmentedLinks } from "@/components/sections/ranking/segmented-links";
import { PageHeader } from "@/components/sections/shared/page-header";
import { VistaToggle } from "@/components/sections/shared/vista-toggle";
import type { SeccionEquipos } from "@/lib/equipos-profe";
import { CLAVE_VISTA_EQUIPOS } from "@/lib/vista";

const SECCIONES: readonly SeccionEquipos[] = ["5A", "5C"];

/**
 * Encabezado de Equipos (HANDOFF §3 Equipos): eyebrow con los recuentos, h1 y el segmentado de
 * sección. La sección es una ruta (`/secciones/equipos-profe/5a`), así que el segmentado son
 * enlaces con `aria-current` (D095), no un radiogroup (D110). `acciones` («Nuevo equipo», W12) va
 * antes del segmentado y envuelve con él; entre los dos, el interruptor Tarjetas / Lista (D313).
 */
export function TeamsHeader({
  eyebrow,
  seccion,
  base,
  acciones,
}: {
  eyebrow: string;
  seccion: SeccionEquipos;
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
          <SegmentedLinks
            label="Sección"
            actual={seccion}
            opciones={SECCIONES.map((s) => ({
              clave: s,
              texto: s,
              href: `${base}/${s.toLowerCase()}`,
            }))}
          />
        </>
      }
    />
  );
}
