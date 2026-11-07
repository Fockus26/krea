import { User, Users } from "lucide-react";
import { PageHeader } from "@/components/sections/shared/page-header";
import { SelectorSeccion } from "@/components/sections/shared/selector-seccion";
import type { SeccionId } from "@/lib/modelo";
import {
  eyebrowRanking,
  type RolRanking,
  type Vista,
} from "@/lib/ranking-vista";
import { ordenarSecciones } from "@/lib/secciones";
import { SegmentedLinks } from "./segmented-links";

type Enlaces = {
  /** Ruta de cada pestaña (mismos filtros de sección/rol que la actual). */
  vista: Record<Vista, string>;
  /** Solo el profesor: ruta de cada sección del catálogo con la misma pestaña. */
  seccion?: Readonly<Record<SeccionId, string>>;
};

/**
 * Encabezado del Ranking (HANDOFF §3 Ranking §1): eyebrow «Sección 5A · 35 estudiantes», h1
 * «Ranking» (sin chip «En vivo», D257: el ranking sigue en vivo, solo se quitó el rótulo), segmentado Estudiantes/Equipos a la derecha (envuelve) y, con
 * `rol="profesor"`, el selector de sección del catálogo antes de las pestañas (D322). Los dos
 * navegan entre rutas (D095).
 */
export function RankingHeader({
  rol,
  seccion,
  vista,
  cantidad,
  enlaces,
}: {
  rol: RolRanking;
  seccion: SeccionId;
  vista: Vista;
  /** Estudiantes o equipos de la sección, según `vista`. */
  cantidad: number;
  enlaces: Enlaces;
}) {
  return (
    <PageHeader
      eyebrow={eyebrowRanking(seccion, cantidad, vista)}
      title="Ranking"
      actions={
        <>
          {rol === "profesor" && enlaces.seccion ? (
            <SelectorSeccion
              secciones={ordenarSecciones(Object.keys(enlaces.seccion))}
              valor={seccion}
              hrefs={enlaces.seccion}
            />
          ) : null}
          <SegmentedLinks
            label="Vista del ranking"
            actual={vista}
            opciones={[
              {
                clave: "estudiantes",
                texto: "Estudiantes",
                href: enlaces.vista.estudiantes,
                icono: <User aria-hidden="true" />,
              },
              {
                clave: "equipos",
                texto: "Equipos",
                href: enlaces.vista.equipos,
                icono: <Users aria-hidden="true" />,
              },
            ]}
          />
        </>
      }
    />
  );
}
