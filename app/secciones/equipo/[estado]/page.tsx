import { Users } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/krea/empty-state";
import { TeamGrades } from "@/components/sections/equipo/team-grades";
import { TeamHero } from "@/components/sections/equipo/team-hero";
import { TeamMembers } from "@/components/sections/equipo/team-members";
import { TeamPrizes } from "@/components/sections/equipo/team-prizes";
import { PageHeader } from "@/components/sections/shared/page-header";
import { Card } from "@/components/ui/card";
import { CEDULA_SIN_EQUIPO, equipoVistaDe } from "@/lib/demo/equipo";
import { alumnoPorCedula, CEDULA_DEMO } from "@/lib/demo/seed";
import { Estados } from "../../_vista/estados";
import { Vista } from "../../_vista/vista";

export const metadata: Metadata = {
  title: "Secciones · Mi equipo",
  robots: { index: false, follow: false },
};

const BASE = "/secciones/equipo";
const ESTADOS = [
  ["con-equipo", "Con equipo"],
  ["sin-equipo", "Sin equipo"],
] as const;
type Estado = (typeof ESTADOS)[number][0];

function estadoDe(valor: string): Estado | undefined {
  return ESTADOS.find(([k]) => k === valor)?.[0];
}

// Un estado por ruta estática (D072)
export function generateStaticParams() {
  return ESTADOS.map(([estado]) => ({ estado }));
}

// Ruta final (fase 05): /equipo. Datos: Raquel Figueroa y 5A-G2 del seed; sin equipo, Hugo (5A).
export default async function EquipoVista({
  params,
}: PageProps<"/secciones/equipo/[estado]">) {
  const estado = estadoDe((await params).estado);
  if (!estado) notFound();
  const alumno = alumnoPorCedula(
    estado === "sin-equipo" ? CEDULA_SIN_EQUIPO : CEDULA_DEMO,
  );
  const d = equipoVistaDe(alumno);
  return (
    <>
      <Estados base={BASE} actual={estado} estados={ESTADOS} />
      <Vista rol="estudiante" ruta="/equipo">
        {d ? (
          <>
            <TeamHero equipo={d.equipo} />
            {/* ≥ 1024: g-home con integrantes | notas + premios; debajo, 1-2-3 en el orden del DOM */}
            <div className="g-home max-md:gap-6">
              <TeamMembers integrantes={d.integrantes} />
              <div className="flex flex-col gap-6">
                <TeamGrades filas={d.notas} />
                <TeamPrizes premios={d.premios} />
              </div>
            </div>
          </>
        ) : (
          <>
            <PageHeader
              eyebrow={`Sección ${alumno.seccion}`}
              title="Mi equipo"
            />
            <Card>
              <EmptyState
                icon={Users}
                headingLevel={2}
                title="Todavía no tienes equipo"
                description="Tu profe te asignará uno en clase. Mientras, tus notas individuales sí suman al ranking."
              />
            </Card>
          </>
        )}
      </Vista>
    </>
  );
}
