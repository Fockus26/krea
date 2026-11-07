import type { Metadata } from "next";
import {
  CATALOGO_INICIAL,
  esCodigoSeccion,
  seccionesDe,
  slugSeccion,
} from "@/lib/secciones";
import { EquiposProfe } from "../_equipos";

type Props = PageProps<"/profe/equipos/[seccion]">;

// Una página por sección del catálogo: el selector del encabezado navega entre ellas (D110, D156,
// D323). Con `cacheComponents` hace falta al menos un valor: el catálogo inicial; las demás
// («4b») se pintan en el request y la que no existe da 404 (lo decide `EquiposProfe`).
export function generateStaticParams() {
  return seccionesDe(CATALOGO_INICIAL).map((s) => ({
    seccion: slugSeccion(s),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Sin leer el catálogo: el título sale del segmento si tiene forma de sección
  const codigo = (await params).seccion.toUpperCase();
  return {
    title: esCodigoSeccion(codigo) ? `Equipos de ${codigo}` : "Equipos",
    robots: { index: false },
  };
}

export default async function EquiposSeccionPage({ params }: Props) {
  return <EquiposProfe slug={(await params).seccion} />;
}
