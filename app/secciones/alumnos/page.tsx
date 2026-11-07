import type { Metadata } from "next";
import { StudentsDirectory } from "@/components/sections/alumnos/students-directory";
import { PageHeader } from "@/components/sections/shared/page-header";
import { resumenTexto } from "@/lib/alumnos";
import { alumnosVista } from "@/lib/demo/alumnos";
import { CATALOGO_INICIAL, seccionesDe } from "@/lib/secciones";
import { Vista } from "../_vista/vista";

// La galería sigue con las secciones del seed (las del catálogo inicial)
const SECCIONES_DEMO = seccionesDe(CATALOGO_INICIAL);

export const metadata: Metadata = {
  title: "Secciones · Alumnos",
  robots: { index: false, follow: false },
};

// Ruta final (fase 05): /profe/alumnos. Datos: los 69 alumnos del seed (D069); la búsqueda y la
// sección filtran en el cliente y "Guardar cambios" solo actualiza el estado local (D109).
export default function AlumnosVista() {
  const alumnos = alumnosVista();
  return (
    <Vista rol="profesor" ruta="/profe/alumnos">
      <PageHeader
        eyebrow={resumenTexto(alumnos.length, SECCIONES_DEMO.length)}
        title="Alumnos"
      />
      <StudentsDirectory alumnos={alumnos} secciones={SECCIONES_DEMO} />
    </Vista>
  );
}
