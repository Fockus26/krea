import { Trophy } from "lucide-react";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/krea/empty-state";
import { RankingEnVivo } from "@/components/sections/ranking/ranking-en-vivo";
import { PageHeader } from "@/components/sections/shared/page-header";
import { SelectorSeccion } from "@/components/sections/shared/selector-seccion";
import { SinSecciones } from "@/components/sections/shared/sin-secciones";
import { Card } from "@/components/ui/card";
import { urlsFirmadas } from "@/lib/datos/imagenes";
import {
  equiposTodos,
  profesorActual,
  rankingsTodos,
} from "@/lib/datos/profesor";
import { catalogoSecciones } from "@/lib/datos/secciones";
import { conCedula } from "@/lib/id-publico";
import { infoDeEquipos } from "@/lib/ranking-en-vivo";
import type { Vista } from "@/lib/ranking-vista";
import { seccionDeSlug, seccionesDe, slugSeccion } from "@/lib/secciones";

const RUTA = "/profe/ranking";

/** Ruta de cada sección × vista: `/profe/ranking/4b`, `/profe/ranking/4b/equipos` (D323). */
const href = (seccion: string, vista: Vista) =>
  `${RUTA}/${slugSeccion(seccion)}${vista === "equipos" ? "/equipos" : ""}`;

const SIN_TU = { id: null, equipoId: null };

/**
 * Ranking del profesor (HANDOFF §3; W8): `ranking/{seccion}` en vivo como el del estudiante
 * (D190), sin fila «tú» y con el selector de sección del catálogo (D322). Las pestañas y la
 * sección son enlaces entre rutas (D095, D157, D323): `slug` es el segmento de la URL («4b»);
 * sin él (`/profe/ranking`), la primera sección del catálogo. Un slug que no está en el catálogo
 * da 404. Los logos se firman solo en la vista de equipos (D212).
 */
export async function RankingProfe({
  slug,
  vista,
}: {
  slug?: string;
  vista: Vista;
}) {
  const [{ sesion }, catalogo] = await Promise.all([
    profesorActual(),
    catalogoSecciones(),
  ]);
  const secciones = seccionesDe(catalogo);
  if (secciones.length === 0) {
    return (
      <>
        <PageHeader title="Ranking" />
        <SinSecciones admin={sesion.admin === true} />
      </>
    );
  }
  const seccion =
    slug === undefined ? secciones[0] : seccionDeSlug(slug, catalogo);
  if (!seccion) notFound();
  const [rankings, equipos] = await Promise.all([
    rankingsTodos(),
    equiposTodos(),
  ]);
  const ranking = rankings[seccion];
  const enlaces = {
    vista: {
      estudiantes: href(seccion, "estudiantes"),
      equipos: href(seccion, "equipos"),
    },
    seccion: Object.fromEntries(secciones.map((s) => [s, href(s, vista)])),
  };
  if (!ranking) {
    return (
      <>
        <PageHeader
          eyebrow={`Sección ${seccion}`}
          title="Ranking"
          actions={
            // Una sección sin ranking todavía (p. ej. recién creada): se puede ir a otra
            <SelectorSeccion
              secciones={secciones}
              valor={seccion}
              hrefs={enlaces.seccion}
            />
          }
        />
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
      rol="profesor"
      seccion={seccion}
      vista={vista}
      inicial={ranking}
      tu={SIN_TU}
      // El profe ve cédulas: cada fila enlaza a Alumnos (D494)
      info={infoDeEquipos(propios, logos, conCedula)}
      enlaces={enlaces}
    />
  );
}
