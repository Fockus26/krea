import { TeamsBoard } from "@/components/sections/equipos-profe/teams-board";
import { equiposProfeVista } from "@/lib/demo/equipos-profe";
import type { SeccionEquipos } from "@/lib/equipos-profe";

/** Base de los enlaces del segmentado 5A | 5C: `${base}/5a`, `${base}/5c` (D110, D156). */
export const BASE_EQUIPOS = "/profe/equipos";

/**
 * Equipos del profesor (HANDOFF §3) de una sección. Compartido por `/profe/equipos` (5A, la sección
 * por defecto) y `/profe/equipos/[seccion]`. El aviso «pasó a …» usa el Toaster global (D131).
 */
export function EquiposProfe({ seccion }: { seccion: SeccionEquipos }) {
  const d = equiposProfeVista(seccion);
  return (
    <TeamsBoard
      seccion={d.seccion}
      base={BASE_EQUIPOS}
      equipos={d.equipos}
      alumnos={d.alumnos}
      inicial={d.inicial}
      total={d.total}
    />
  );
}
