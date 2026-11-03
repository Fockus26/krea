import type { Metadata } from "next";
import { BackLink } from "@/components/sections/shared/back-link";
import { PageHeader } from "@/components/sections/shared/page-header";
import { TaskBuilder } from "@/components/sections/tareas-profe/task-builder";
import { HOY_DEMO, NUEVA_DEMO } from "@/lib/demo/tareas-profe";
import { RUTA_TAREAS } from "@/lib/tareas-profe";

export const metadata: Metadata = { title: "Nueva tarea" };

// Constructor con una tarea vacía (HANDOFF §3). Sin barra inferior; «Guardar borrador» < 1024 va
// en la topbar (D130, D153). Nada se guarda hasta la fase 07.
export default function NuevaTareaPage() {
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
        inicial={NUEVA_DEMO}
        hoy={HOY_DEMO}
        listaHref={RUTA_TAREAS}
        guardarEnTopbar
      />
    </>
  );
}
