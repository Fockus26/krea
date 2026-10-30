import type { Metadata } from "next";
import { HomeGrid } from "@/components/sections/inicio/home-grid";
import { PendingTasks } from "@/components/sections/inicio/pending-tasks";
import { PointsCard } from "@/components/sections/inicio/points-card";
import { RecentGrades } from "@/components/sections/inicio/recent-grades";
import { TeamSummary } from "@/components/sections/inicio/team-summary";
import { PageHeader } from "@/components/sections/shared/page-header";
import { inicioDe } from "@/lib/demo/inicio";
import { Vista } from "../_vista/vista";

export const metadata: Metadata = {
  title: "Secciones · Inicio",
  robots: { index: false, follow: false },
};

// Ruta final (fase 05): /. Datos: Yeilin Duarte del seed (D069).
export default function InicioVista() {
  const d = inicioDe();
  return (
    <Vista rol="estudiante" ruta="/">
      <HomeGrid
        saludo={
          <PageHeader
            eyebrow={d.saludo.eyebrow}
            title={d.saludo.titulo}
            description={d.saludo.linea}
          />
        }
        puntos={<PointsCard {...d.puntos} rankingHref="/ranking" />}
        notas={
          <RecentGrades
            filas={d.notas}
            verTodasHref="/notas"
            tareasHref="/tareas"
          />
        }
        pendientes={<PendingTasks filas={d.pendientes} />}
        equipo={<TeamSummary equipo={d.equipo} equipoHref="/equipo" />}
      />
    </Vista>
  );
}
