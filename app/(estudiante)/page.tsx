import { Trophy } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/krea/empty-state";
import { DailyMessage } from "@/components/sections/inicio/daily-message";
import { HomeGrid } from "@/components/sections/inicio/home-grid";
import { PendingTasks } from "@/components/sections/inicio/pending-tasks";
import { PointsCard } from "@/components/sections/inicio/points-card";
import { RecentGrades } from "@/components/sections/inicio/recent-grades";
import { TeamSummary } from "@/components/sections/inicio/team-summary";
import { PageHeader } from "@/components/sections/shared/page-header";
import { Card } from "@/components/ui/card";
import {
  datosAlumno,
  integrantesDe,
  logoDeEquipo,
} from "@/lib/datos/estudiante";
import { diaDeInstante } from "@/lib/fecha";
import { mensajeDelDia } from "@/lib/mensaje-diario";
import { inicioVista, promedioDelAlumno } from "@/lib/vistas-estudiante";

export const metadata: Metadata = { title: "Inicio" };

// Inicio del estudiante (HANDOFF §3): las secciones de /secciones/inicio con los datos de su
// sesión (Firestore, D189). La carga la cubre `loading.tsx` (Suspense).
export default async function InicioPage() {
  const datos = await datosAlumno();
  const [companeros, logo] = await Promise.all([
    datos.equipo ? integrantesDe(datos.equipo.id) : [],
    logoDeEquipo(datos.equipo),
  ]);
  // Instante de la petición (tras `datosAlumno()`, nunca en el prerender): «vence» / «venció» (D357)
  const ahora = Date.now();
  const d = inicioVista(datos, companeros, ahora);
  // Día de Caracas leído tras `datosAlumno()` (sesión = dato de la petición, D098): nunca en el
  // prerender. Cambia cada día, no cada recarga (D274).
  const mensaje = mensajeDelDia(promedioDelAlumno(datos), diaDeInstante(ahora));
  return (
    <HomeGrid
      saludo={
        <PageHeader
          eyebrow={d.saludo.eyebrow}
          title={d.saludo.titulo}
          description={d.saludo.linea}
        />
      }
      mensaje={<DailyMessage mensaje={mensaje} />}
      puntos={
        d.puntos ? (
          <PointsCard {...d.puntos} rankingHref="/ranking" />
        ) : (
          <Card>
            {/* PLACEHOLDER de copy (CONTENT_CHECKLIST fila 127) */}
            <EmptyState
              icon={Trophy}
              headingLevel={2}
              title="Tus puntos aún no están listos"
              description="Aparecen cuando tu profe publique el ranking de tu sección."
            />
          </Card>
        )
      }
      notas={
        <RecentGrades
          filas={d.notas}
          verTodasHref="/notas"
          tareasHref="/tareas"
        />
      }
      pendientes={<PendingTasks filas={d.pendientes} />}
      equipo={
        <TeamSummary
          equipo={d.equipo && { ...d.equipo, logo }}
          equipoHref="/equipo"
        />
      }
    />
  );
}
