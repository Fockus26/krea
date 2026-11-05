import type { Metadata } from "next";
import { StudentsDirectory } from "@/components/sections/alumnos/students-directory";
import { PageHeader } from "@/components/sections/shared/page-header";
import { editarAlumno } from "@/lib/acciones/alumnos";
import { resumenTexto } from "@/lib/alumnos";
import { filasAlumnos } from "@/lib/alumnos-datos";
import {
  emailsTodos,
  entregasTodas,
  equiposTodos,
  rankingsTodos,
  usuariosTodos,
} from "@/lib/datos/profesor";
import { SECCIONES } from "@/lib/modelo";

export const metadata: Metadata = {
  title: "Alumnos",
  robots: { index: false },
};

// Alumnos (HANDOFF §3; W8, D209): las mismas secciones que /secciones/alumnos con Firestore. La
// búsqueda y la sección filtran en el cliente; «Guardar cambios» escribe perfil, historial de base
// (D176), email de recuperación y ranking en una transacción y la página se refresca.
export default async function AlumnosPage() {
  const [usuarios, equipos, entregas, rankings, emails] = await Promise.all([
    usuariosTodos(),
    equiposTodos(),
    entregasTodas(),
    rankingsTodos(),
    emailsTodos(),
  ]);
  const alumnos = filasAlumnos({
    usuarios,
    equipos,
    entregas,
    rankings,
    emails,
  });
  return (
    <>
      <PageHeader
        eyebrow={resumenTexto(alumnos.length, SECCIONES.length)}
        title="Alumnos"
      />
      <StudentsDirectory alumnos={alumnos} guardar={editarAlumno} />
    </>
  );
}
