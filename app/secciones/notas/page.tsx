import type { Metadata } from "next";
import { GradeLegend } from "@/components/sections/notas/grade-legend";
import { GradesList } from "@/components/sections/notas/grades-list";
import { PageHeader } from "@/components/sections/shared/page-header";
import { misNotasDe } from "@/lib/demo/notas";
import { alumnoPorCedula, CEDULA_DEMO } from "@/lib/demo/seed";
import { Vista } from "../_vista/vista";

export const metadata: Metadata = {
  title: "Secciones · Mis notas",
  robots: { index: false, follow: false },
};

// Ruta final (fase 05): /notas. Datos: Yeilin Duarte del seed (D069).
export default function NotasVista() {
  const alumno = alumnoPorCedula(CEDULA_DEMO);
  return (
    <Vista rol="estudiante" ruta="/notas" width="lectura">
      <PageHeader
        eyebrow={`Sección ${alumno.seccion}`}
        title="Mis notas"
        description="Toca una nota para ver cómo se evaluó cada pregunta."
      />
      {/* Promedio de ejemplo para ver el marcador «Tú» */}
      <GradeLegend promedio={15.5} />
      <GradesList filas={misNotasDe(alumno)} tareasHref="/tareas" />
    </Vista>
  );
}
