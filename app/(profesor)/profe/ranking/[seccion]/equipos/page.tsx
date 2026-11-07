import type { Metadata } from "next";
import {
  CATALOGO_INICIAL,
  esCodigoSeccion,
  seccionesDe,
  slugSeccion,
} from "@/lib/secciones";
import { RankingProfe } from "../../_ranking";

type Props = PageProps<"/profe/ranking/[seccion]/equipos">;

// Como `/profe/ranking/[seccion]` (D323): al menos el catálogo inicial para `cacheComponents`.
export function generateStaticParams() {
  return seccionesDe(CATALOGO_INICIAL).map((s) => ({ seccion: slugSeccion(s) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const codigo = (await params).seccion.toUpperCase();
  return {
    title: esCodigoSeccion(codigo)
      ? `Ranking de equipos de ${codigo}`
      : "Ranking de equipos",
    robots: { index: false },
  };
}

export default async function RankingSeccionEquiposPage({ params }: Props) {
  return <RankingProfe slug={(await params).seccion} vista="equipos" />;
}
