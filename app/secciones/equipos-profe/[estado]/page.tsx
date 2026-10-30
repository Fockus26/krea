import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TeamsBoard } from "@/components/sections/equipos-profe/teams-board";
import { equiposProfeVista } from "@/lib/demo/equipos-profe";
import type { SeccionEquipos } from "@/lib/equipos-profe";
import { Vista } from "../../_vista/vista";

export const metadata: Metadata = {
  title: "Secciones · Equipos (profesor)",
  robots: { index: false, follow: false },
};

const BASE = "/secciones/equipos-profe";
const SECCIONES: Record<string, SeccionEquipos> = { "5a": "5A", "5c": "5C" };

// Un estado por ruta estática (D072): la sección. El segmentado del encabezado navega entre ellas
// (D110), así que no hace falta la barra de estados de la vista previa.
export function generateStaticParams() {
  return Object.keys(SECCIONES).map((estado) => ({ estado }));
}

// Ruta final (fase 05): /profe/equipos. Datos: equipos, capitanes y puntos del seed.
export default async function EquiposProfeVista({
  params,
}: PageProps<"/secciones/equipos-profe/[estado]">) {
  const seccion = SECCIONES[(await params).estado];
  if (!seccion) notFound();
  const d = equiposProfeVista(seccion);
  return (
    <Vista rol="profesor" ruta="/profe/equipos">
      <TeamsBoard
        seccion={d.seccion}
        base={BASE}
        equipos={d.equipos}
        alumnos={d.alumnos}
        inicial={d.inicial}
        total={d.total}
      />
    </Vista>
  );
}
