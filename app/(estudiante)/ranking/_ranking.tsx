import { Trophy } from "lucide-react";
import { EmptyState } from "@/components/krea/empty-state";
import { RankingEnVivo } from "@/components/sections/ranking/ranking-en-vivo";
import { PageHeader } from "@/components/sections/shared/page-header";
import { Card } from "@/components/ui/card";
import {
  alumnoActual,
  infoEquipos,
  rankingDeSeccion,
} from "@/lib/datos/estudiante";
import type { SeccionRanking, Vista } from "@/lib/ranking-vista";

// Las pestañas Estudiantes | Equipos son enlaces entre rutas (D095): `/ranking` y `/ranking/equipos`.
const ENLACES = { estudiantes: "/ranking", equipos: "/ranking/equipos" };

/**
 * Ranking del estudiante (HANDOFF §3): su sección, «tú» = la sesión. El servidor pinta la primera
 * instantánea y el cliente la mantiene en vivo (D190), sin rótulo «En vivo» (D257). Compartido
 * por las dos rutas.
 */
export async function RankingEstudiante({ vista }: { vista: Vista }) {
  const { usuario, seccion } = await alumnoActual();
  const [ranking, info] = await Promise.all([
    rankingDeSeccion(seccion),
    infoEquipos(seccion, { conLogos: vista === "equipos" }),
  ]);
  if (!ranking) {
    return (
      <>
        <PageHeader eyebrow={`Sección ${seccion}`} title="Ranking" />
        <Card>
          {/* PLACEHOLDER de copy (CONTENT_CHECKLIST fila 127) */}
          <EmptyState
            icon={Trophy}
            headingLevel={2}
            title="El ranking de tu sección aún no está listo"
            description="Aparece cuando tu profe evalúe la primera tarea."
          />
        </Card>
      </>
    );
  }
  return (
    <RankingEnVivo
      uid={usuario.cedula}
      // La vista aún lista 5A/5C (las secciones del catálogo llegan con X5b, D317)
      seccion={seccion as SeccionRanking}
      vista={vista}
      inicial={ranking}
      tu={{ cedula: usuario.cedula, equipoId: usuario.equipoId }}
      info={info}
      enlaces={{ vista: ENLACES }}
    />
  );
}
