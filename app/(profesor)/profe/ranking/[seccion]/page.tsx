import type { Metadata } from "next";
import {
  CATALOGO_INICIAL,
  esCodigoSeccion,
  seccionesDe,
  slugSeccion,
} from "@/lib/secciones";
import { RankingProfe } from "../_ranking";

type Props = PageProps<"/profe/ranking/[seccion]">;

// Una ruta por sección del catálogo (D323). Con `cacheComponents` hace falta al menos un valor:
// el catálogo inicial; las demás («4b») se pintan en el request. La que no existe da 404.
export function generateStaticParams() {
  return seccionesDe(CATALOGO_INICIAL).map((s) => ({ seccion: slugSeccion(s) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Sin leer el catálogo: el título sale del segmento si tiene forma de sección
  const codigo = (await params).seccion.toUpperCase();
  return {
    title: esCodigoSeccion(codigo) ? `Ranking de ${codigo}` : "Ranking",
    robots: { index: false },
  };
}

export default async function RankingSeccionPage({ params }: Props) {
  return <RankingProfe slug={(await params).seccion} vista="estudiantes" />;
}
