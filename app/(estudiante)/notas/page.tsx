import type { Metadata } from "next";
import { GradeLegend } from "@/components/sections/notas/grade-legend";
import { GradesList } from "@/components/sections/notas/grades-list";
import { PageHeader } from "@/components/sections/shared/page-header";
import { misNotasDe } from "@/lib/demo/notas";
import { alumnoPorCedula, CEDULA_DEMO } from "@/lib/demo/seed";

export const metadata: Metadata = { title: "Mis notas" };

// Mis notas (HANDOFF §3): las secciones de /secciones/notas con los href reales.
// Datos: Yeilin Duarte del seed (D069) hasta la fase 07.
export default function NotasPage() {
  const alumno = alumnoPorCedula(CEDULA_DEMO);
  return (
    <>
      <PageHeader
        eyebrow={`Sección ${alumno.seccion}`}
        title="Mis notas"
        description="Toca una nota para ver cómo se evaluó cada pregunta."
      />
      <GradeLegend />
      <GradesList filas={misNotasDe(alumno)} tareasHref="/tareas" />
    </>
  );
}
