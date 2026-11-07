import type { Metadata } from "next";
import { BackLink } from "@/components/sections/shared/back-link";
import { PageHeader } from "@/components/sections/shared/page-header";
import { SinSecciones } from "@/components/sections/shared/sin-secciones";
import { TaskBuilder } from "@/components/sections/tareas-profe/task-builder";
import {
  cerrarTarea,
  eliminarTarea,
  guardarTarea,
} from "@/lib/acciones/tareas";
import { profesorActual, seccionesDelProfe } from "@/lib/datos/profesor";
import { catalogoSecciones } from "@/lib/datos/secciones";
import { diaDeInstante } from "@/lib/fecha";
import { seccionesDe } from "@/lib/secciones";
import { RUTA_TAREAS, SIN_PERDIDA } from "@/lib/tareas-profe";

export const metadata: Metadata = { title: "Nueva tarea" };

const ACCIONES = {
  guardar: guardarTarea,
  cerrar: cerrarTarea,
  eliminar: eliminarTarea,
};

// Constructor con una tarea vacía (HANDOFF §3). Sin barra inferior; «Guardar borrador» < 1024 va
// en la topbar (D130, D153). El primer guardado crea la tarea y la URL pasa a la suya (W6, D199).
// Las casillas de sección salen del catálogo y vienen marcadas las del profe (todas, si no tiene
// una asignada; D324). Sin secciones no se puede crear: el vacío de D325.
export default async function NuevaTareaPage() {
  const [{ sesion, usuario }, catalogo] = await Promise.all([
    profesorActual(),
    catalogoSecciones(),
  ]);
  const secciones = seccionesDe(catalogo);
  return (
    <>
      <div className="flex flex-col gap-2">
        <BackLink href={RUTA_TAREAS}>Tareas</BackLink>
        <PageHeader
          title="Nueva tarea"
          description={
            secciones.length > 0
              ? "Las preguntas tienen que sumar exactamente 20 puntos para publicar."
              : undefined
          }
        />
      </div>
      {secciones.length === 0 ? (
        <SinSecciones admin={sesion.admin === true} />
      ) : (
        <TaskBuilder
          inicial={{
            secciones: seccionesDelProfe(usuario, secciones).filter((s) =>
              secciones.includes(s),
            ),
          }}
          secciones={secciones}
          hoy={diaDeInstante(Date.now())}
          listaHref={RUTA_TAREAS}
          guardarEnTopbar
          acciones={ACCIONES}
          // Recién creada: todavía no tiene entregas
          perdida={SIN_PERDIDA}
        />
      )}
    </>
  );
}
