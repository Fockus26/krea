import type { Metadata } from "next";
import { StudentsDirectory } from "@/components/sections/alumnos/students-directory";
import { PageHeader } from "@/components/sections/shared/page-header";
import { SinSecciones } from "@/components/sections/shared/sin-secciones";
import {
  crearAlumno,
  editarAlumno,
  eliminarAlumno,
  eliminarAlumnos,
  resumenEliminarAlumno,
  resumenEliminarAlumnos,
} from "@/lib/acciones/alumnos";
import { leerFiltrosAlumnos, resumenTexto } from "@/lib/alumnos";
import { filasAlumnos } from "@/lib/alumnos-datos";
import {
  emailsTodos,
  entregasTodas,
  equiposTodos,
  profesorActual,
  rankingsTodos,
  tareasProfe,
  usuariosTodos,
} from "@/lib/datos/profesor";
import { catalogoSecciones } from "@/lib/datos/secciones";
import { nombrePresencia } from "@/lib/presencia";
import { seccionesDe } from "@/lib/secciones";

export const metadata: Metadata = {
  title: "Alumnos",
  robots: { index: false },
};

// Los filtros viajan en la URL (D252): ?seccion=<código del catálogo, «4B»>&estado=evaluados|raspados|pendientes&tarea=<id>&alumno=<cédula>.
// Las secciones salen del catálogo (D323); sin ninguna, el vacío de D325.
// Alumnos (HANDOFF §3; W8, D209): las mismas secciones que /secciones/alumnos con Firestore. La
// búsqueda y la sección filtran en el cliente; «Guardar cambios» escribe perfil, historial de base
// (D176), email de recuperación y ranking en una transacción y la página se refresca. «Agregar
// alumno» y «Eliminar alumno» (W12, D267, D268) también terminan con `refresh()`. `yo` enciende la
// presencia en vivo al editar (W14, D275–D277): la suscripción vive en el cliente, no aquí.
export default async function AlumnosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, catalogo] = await Promise.all([
    searchParams,
    catalogoSecciones(),
  ]);
  const secciones = seccionesDe(catalogo);
  const filtros = leerFiltrosAlumnos(params, secciones);
  const [usuarios, equipos, entregas, rankings, emails, tareas, profe] =
    await Promise.all([
      usuariosTodos(),
      equiposTodos(),
      entregasTodas(),
      rankingsTodos(),
      emailsTodos(),
      tareasProfe(),
      profesorActual(),
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
  if (secciones.length === 0) {
    return (
      <>
        <PageHeader title="Alumnos" />
        <SinSecciones admin={profe.sesion.admin === true} />
      </>
    );
  }
  return (
    <StudentsDirectory
      encabezado={{ eyebrow: resumenTexto(alumnos.length, secciones.length) }}
      alumnos={alumnos}
      secciones={secciones}
      guardar={editarAlumno}
      alta={{
        crear: crearAlumno,
        resumir: resumenEliminarAlumno,
        eliminar: eliminarAlumno,
        resumirVarios: resumenEliminarAlumnos,
        eliminarVarios: eliminarAlumnos,
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
      yo={{
        uid: profe.sesion.uid,
        nombre: nombrePresencia(profe.usuario),
      }}
    />
  );
}
