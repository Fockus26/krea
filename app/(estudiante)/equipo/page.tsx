import { Users } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/krea/empty-state";
import { TeamGrades } from "@/components/sections/equipo/team-grades";
import { TeamHero } from "@/components/sections/equipo/team-hero";
import { TeamMembers } from "@/components/sections/equipo/team-members";
import { TeamPrizes } from "@/components/sections/equipo/team-prizes";
import { PageHeader } from "@/components/sections/shared/page-header";
import { Card } from "@/components/ui/card";
import {
  datosAlumno,
  entregasGrupales,
  integrantesDe,
  logoDeEquipo,
} from "@/lib/datos/estudiante";
import { equipoVista } from "@/lib/vistas-estudiante";

export const metadata: Metadata = { title: "Mi equipo" };

// Mi equipo (HANDOFF §3): como /secciones/equipo, con su equipo actual (D189). «Sin equipo» sale
// de los datos (`equipoId` null en su perfil).
export default async function EquipoPage() {
  const datos = await datosAlumno();
  const seccion = datos.usuario.seccion;
  let d: ReturnType<typeof equipoVista> = null;
  let logo: string | null = null;
  if (datos.equipo && seccion) {
    const [companeros, grupales, firmado] = await Promise.all([
      integrantesDe(datos.equipo.id),
      entregasGrupales(seccion),
      logoDeEquipo(datos.equipo),
    ]);
    d = equipoVista(datos, companeros, grupales);
    logo = firmado;
  }
  return d ? (
    <>
      <TeamHero equipo={{ ...d.equipo, logo }} />
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
      <PageHeader eyebrow={`Sección ${seccion ?? ""}`} title="Mi equipo" />
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
