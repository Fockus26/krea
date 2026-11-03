import { Users } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/krea/empty-state";
import { TeamGrades } from "@/components/sections/equipo/team-grades";
import { TeamHero } from "@/components/sections/equipo/team-hero";
import { TeamMembers } from "@/components/sections/equipo/team-members";
import { TeamPrizes } from "@/components/sections/equipo/team-prizes";
import { PageHeader } from "@/components/sections/shared/page-header";
import { Card } from "@/components/ui/card";
import { equipoVistaDe } from "@/lib/demo/equipo";
import { alumnoPorCedula, CEDULA_DEMO } from "@/lib/demo/seed";

export const metadata: Metadata = { title: "Mi equipo" };

// Mi equipo (HANDOFF §3): como /secciones/equipo. Datos: Yeilin Duarte y 5A-G2 del seed (D069).
// «Sin equipo» sale de los datos: la persona de ejemplo tiene equipo, así que solo se ve con otra
// sesión (fase 07) o en /secciones/equipo/sin-equipo.
export default function EquipoPage() {
  const alumno = alumnoPorCedula(CEDULA_DEMO);
  const d = equipoVistaDe(alumno);
  return d ? (
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
      <PageHeader eyebrow={`Sección ${alumno.seccion}`} title="Mi equipo" />
      <Card>
        <EmptyState
          icon={Users}
          headingLevel={2}
          title="Todavía no tienes equipo"
          description="Tu profe te asignará uno en clase. Mientras, tus notas individuales sí suman al ranking."
        />
      </Card>
    </>
  );
}
