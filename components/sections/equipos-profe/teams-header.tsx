import { SegmentedLinks } from "@/components/sections/ranking/segmented-links";
import { PageHeader } from "@/components/sections/shared/page-header";
import type { SeccionEquipos } from "@/lib/equipos-profe";

const SECCIONES: readonly SeccionEquipos[] = ["5A", "5C"];

/**
 * Encabezado de Equipos (HANDOFF §3 Equipos): eyebrow con los recuentos, h1 y el segmentado de
 * sección. La sección es una ruta (`/secciones/equipos-profe/5a`), así que el segmentado son
 * enlaces con `aria-current` (D095), no un radiogroup (D110).
 */
export function TeamsHeader({
  eyebrow,
  seccion,
  base,
}: {
  eyebrow: string;
  seccion: SeccionEquipos;
  /** Prefijo de las rutas de sección. */
  base: string;
}) {
  return (
    <PageHeader
      eyebrow={eyebrow}
      title="Equipos"
      actions={
        <SegmentedLinks
          label="Sección"
          actual={seccion}
          opciones={SECCIONES.map((s) => ({
            clave: s,
            texto: s,
            href: `${base}/${s.toLowerCase()}`,
          }))}
        />
      }
    />
  );
}
