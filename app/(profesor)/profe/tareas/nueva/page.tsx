import type { Metadata } from "next";
import { BackLink } from "@/components/sections/shared/back-link";
import { PageHeader } from "@/components/sections/shared/page-header";
import { TaskBuilder } from "@/components/sections/tareas-profe/task-builder";
import {
  cerrarTarea,
  eliminarTarea,
  guardarTarea,
} from "@/lib/acciones/tareas";
import { exigirSesion } from "@/lib/dal";
import { diaDeInstante } from "@/lib/fecha";
import { RUTA_TAREAS, SIN_PERDIDA } from "@/lib/tareas-profe";

export const metadata: Metadata = { title: "Nueva tarea" };

const ACCIONES = {
  guardar: guardarTarea,
  cerrar: cerrarTarea,
  eliminar: eliminarTarea,
};

// Constructor con una tarea vacía (HANDOFF §3). Sin barra inferior; «Guardar borrador» < 1024 va
// en la topbar (D130, D153). El primer guardado crea la tarea y la URL pasa a la suya (W6, D199).
export default async function NuevaTareaPage() {
  await exigirSesion("profesor");
  return (
    <>
      <div className="flex flex-col gap-2">
        <BackLink href={RUTA_TAREAS}>Tareas</BackLink>
        <PageHeader
          title="Nueva tarea"
          description="Las preguntas tienen que sumar exactamente 20 puntos para publicar."
        />
      </div>
      <TaskBuilder
        inicial={{}}
        hoy={diaDeInstante(Date.now())}
        listaHref={RUTA_TAREAS}
        guardarEnTopbar
        acciones={ACCIONES}
        // Recién creada: todavía no tiene entregas
        perdida={SIN_PERDIDA}
      />
    </>
  );
}
