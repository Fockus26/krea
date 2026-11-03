import type { Metadata } from "next";
import { StudentsDirectory } from "@/components/sections/alumnos/students-directory";
import { PageHeader } from "@/components/sections/shared/page-header";
import { resumenTexto } from "@/lib/alumnos";
import { alumnosVista } from "@/lib/demo/alumnos";

export const metadata: Metadata = {
  title: "Alumnos",
  robots: { index: false },
};

// Alumnos (HANDOFF §3): las mismas secciones que /secciones/alumnos. Datos: los 69 alumnos del seed
// (D069); la búsqueda y la sección filtran en el cliente y "Guardar cambios" solo actualiza el estado
// local (D109).
export default function AlumnosPage() {
  const alumnos = alumnosVista();
  return (
    <>
      <PageHeader eyebrow={resumenTexto(alumnos.length, 2)} title="Alumnos" />
      <StudentsDirectory alumnos={alumnos} />
    </>
  );
}
