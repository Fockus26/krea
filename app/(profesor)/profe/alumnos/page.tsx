import type { Metadata } from "next";
import { StudentsDirectory } from "@/components/sections/alumnos/students-directory";
import {
  crearAlumno,
  editarAlumno,
  eliminarAlumno,
  resumenEliminarAlumno,
} from "@/lib/acciones/alumnos";
import { leerFiltrosAlumnos, resumenTexto } from "@/lib/alumnos";
import { filasAlumnos } from "@/lib/alumnos-datos";
import {
  emailsTodos,
  entregasTodas,
  equiposTodos,
  rankingsTodos,
  tareasProfe,
  usuariosTodos,
} from "@/lib/datos/profesor";
import { SECCIONES } from "@/lib/modelo";

export const metadata: Metadata = {
  title: "Alumnos",
  robots: { index: false },
};

// Los filtros viajan en la URL (D252): ?seccion=5A|5C&estado=evaluados|raspados|pendientes&tarea=<id>&alumno=<cédula>.
// Alumnos (HANDOFF §3; W8, D209): las mismas secciones que /secciones/alumnos con Firestore. La
// búsqueda y la sección filtran en el cliente; «Guardar cambios» escribe perfil, historial de base
// (D176), email de recuperación y ranking en una transacción y la página se refresca. «Agregar
// alumno» y «Eliminar alumno» (W12, D267, D268) también terminan con `refresh()`.
export default async function AlumnosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filtros = leerFiltrosAlumnos(await searchParams);
  const [usuarios, equipos, entregas, rankings, emails, tareas] =
    await Promise.all([
      usuariosTodos(),
      equiposTodos(),
      entregasTodas(),
      rankingsTodos(),
      emailsTodos(),
      tareasProfe(),
    ]);
  // Una tarea que no existe se ignora, como cualquier otro valor inválido.
  const tarea = tareas.find((t) => t.id === filtros.tarea);
  const alumnoExiste = usuarios.some(
    (u) => u.rol === "estudiante" && u.cedula === filtros.alumno,
  );
  const alumnos = filasAlumnos({
    usuarios,
    equipos,
    entregas,
    rankings,
    emails,
  });
  return (
    <StudentsDirectory
      encabezado={{ eyebrow: resumenTexto(alumnos.length, SECCIONES.length) }}
      alumnos={alumnos}
      guardar={editarAlumno}
      alta={{
        crear: crearAlumno,
        resumir: resumenEliminarAlumno,
        eliminar: eliminarAlumno,
        equipos: equipos.map((e) => ({
          id: e.id,
          nombre: e.nombre,
          seccion: e.seccion,
        })),
      }}
      filtrosIniciales={{
        ...filtros,
        tarea: tarea?.id,
        alumno: alumnoExiste ? filtros.alumno : undefined,
      }}
      tarea={tarea ? { id: tarea.id, titulo: tarea.titulo } : undefined}
    />
  );
}
