import type { Metadata } from "next";
import { TasksHeader } from "@/components/sections/tareas-profe/tasks-header";
import { TeacherTaskList } from "@/components/sections/tareas-profe/teacher-task-list";
import {
  HOY_DEMO,
  SECCIONES_PROFE,
  tareasProfeVista,
} from "@/lib/demo/tareas-profe";
import { eyebrowTareas, RUTA_NUEVA_TAREA } from "@/lib/tareas-profe";

export const metadata: Metadata = { title: "Tareas del profesor" };

// Tareas del profesor (HANDOFF §3): las mismas secciones que /secciones/tareas-profe. Cada tarea
// enlaza a /profe/tareas/[id] (ids de TAREAS + el borrador, D152); el filtro corre en el cliente (D099).
export default function TareasProfePage() {
  const tareas = tareasProfeVista();
  return (
    <>
      <TasksHeader
        eyebrow={eyebrowTareas(tareas.length, SECCIONES_PROFE)}
        nuevaHref={RUTA_NUEVA_TAREA}
      />
      <TeacherTaskList tareas={tareas} hoy={HOY_DEMO} />
    </>
  );
}
