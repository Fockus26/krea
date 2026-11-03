import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { SeccionEquipos } from "@/lib/equipos-profe";
import { EquiposProfe } from "../_equipos";

type Props = PageProps<"/profe/equipos/[seccion]">;

const SECCIONES: Record<string, SeccionEquipos> = { "5a": "5A", "5c": "5C" };

// Una página por sección: el segmentado del encabezado navega entre ellas (D110, D156)
export function generateStaticParams() {
  return Object.keys(SECCIONES).map((seccion) => ({ seccion }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const seccion = SECCIONES[(await params).seccion];
  return {
    title: seccion ? `Equipos de ${seccion}` : "Equipos",
    robots: { index: false },
  };
}

export default async function EquiposSeccionPage({ params }: Props) {
  const seccion = SECCIONES[(await params).seccion];
  if (!seccion) notFound();
  return <EquiposProfe seccion={seccion} />;
}
