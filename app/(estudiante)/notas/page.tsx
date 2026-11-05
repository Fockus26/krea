import type { Metadata } from "next";
import { GradeLegend } from "@/components/sections/notas/grade-legend";
import { GradesList } from "@/components/sections/notas/grades-list";
import { PageHeader } from "@/components/sections/shared/page-header";
import { datosAlumno } from "@/lib/datos/estudiante";
import { filasMisNotas } from "@/lib/vistas-estudiante";

export const metadata: Metadata = { title: "Mis notas" };

// Mis notas (HANDOFF §3): las secciones de /secciones/notas con las notas de su sesión (D189).
export default async function NotasPage() {
  const datos = await datosAlumno();
  return (
    <>
      <PageHeader
        eyebrow={`Sección ${datos.usuario.seccion ?? ""}`}
        title="Mis notas"
        description="Toca una nota para ver cómo se evaluó cada pregunta."
      />
      <GradeLegend />
      <GradesList filas={filasMisNotas(datos)} tareasHref="/tareas" />
    </>
  );
}
