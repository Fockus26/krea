import { Trophy } from "lucide-react";
import { EmptyState } from "@/components/krea/empty-state";
import { RankingEnVivo } from "@/components/sections/ranking/ranking-en-vivo";
import { PageHeader } from "@/components/sections/shared/page-header";
import { Card } from "@/components/ui/card";
import { urlsFirmadas } from "@/lib/datos/imagenes";
import {
  equiposTodos,
  profesorActual,
  rankingsTodos,
} from "@/lib/datos/profesor";
import { infoDeEquipos } from "@/lib/ranking-en-vivo";
import type { SeccionRanking, Vista } from "@/lib/ranking-vista";

const RUTA = "/profe/ranking";

/** Ruta de cada uno de los 6 estados del profesor (5A/5C × estudiantes/equipos; D157). */
const href = (seccion: SeccionRanking, vista: Vista) =>
  `${RUTA}${seccion === "5C" ? "/5c" : ""}${vista === "equipos" ? "/equipos" : ""}`;

const SIN_TU = { cedula: null, equipoId: null };

/**
 * Ranking del profesor (HANDOFF §3; W8): `ranking/{seccion}` en vivo como el del estudiante
 * (D190), sin fila «tú» y con el segmentado 5A | 5C. Las pestañas y la sección son enlaces entre
 * rutas (D095, D157). Los logos se firman solo en la vista de equipos (D212). El chip «En vivo»
 * móvil lo pone la topbar (D128).
 */
export async function RankingProfe({
  seccion,
  vista,
}: {
  seccion: SeccionRanking;
  vista: Vista;
}) {
  const [{ sesion }, rankings, equipos] = await Promise.all([
    profesorActual(),
    rankingsTodos(),
    equiposTodos(),
  ]);
  const ranking = rankings[seccion];
  const enlaces = {
    vista: {
      estudiantes: href(seccion, "estudiantes"),
      equipos: href(seccion, "equipos"),
    },
    seccion: { "5A": href("5A", vista), "5C": href("5C", vista) },
  };
  if (!ranking) {
    return (
      <>
        <PageHeader eyebrow={`Sección ${seccion}`} title="Ranking" />
        <Card>
          {/* PLACEHOLDER de copy (CONTENT_CHECKLIST fila 127) */}
          <EmptyState
            icon={Trophy}
            headingLevel={2}
            title={`El ranking de ${seccion} aún no está listo`}
            description="Aparece cuando evalúes la primera tarea de la sección."
          />
        </Card>
      </>
    );
  }
  const propios = equipos.filter((e) => e.seccion === seccion);
  const logos =
    vista === "equipos"
      ? await urlsFirmadas(
          propios.flatMap((e) => (e.logoPath ? [e.logoPath] : [])),
        )
      : new Map<string, string>();
  return (
    <RankingEnVivo
      uid={sesion.uid}
      rol="profesor"
      seccion={seccion}
      vista={vista}
      inicial={ranking}
      tu={SIN_TU}
      info={infoDeEquipos(propios, logos)}
      enlaces={enlaces}
    />
  );
}
