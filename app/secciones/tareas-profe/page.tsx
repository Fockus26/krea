import type { Metadata } from "next";
import { TasksHeader } from "@/components/sections/tareas-profe/tasks-header";
import { TeacherTaskList } from "@/components/sections/tareas-profe/teacher-task-list";
import {
  AHORA_DEMO,
  SECCIONES_PROFE,
  tareasProfeVista,
} from "@/lib/demo/tareas-profe";
import { eyebrowTareas, RUTA_NUEVA_TAREA } from "@/lib/tareas-profe";
import { Vista } from "../_vista/vista";

export const metadata: Metadata = {
  title: "Secciones · Tareas del profesor",
  robots: { index: false, follow: false },
};

// Ruta final (fase 05): /profe/tareas. Datos: las 4 tareas de lib/demo/tareas.ts + el borrador
// «Plan de redes sociales» (lib/demo/tareas-profe.ts); el segmentado filtra en el cliente (D099).
export default function TareasProfeVista() {
  const tareas = tareasProfeVista();
  return (
    <Vista rol="profesor" ruta="/profe/tareas">
      <TasksHeader
        eyebrow={eyebrowTareas(tareas.length, SECCIONES_PROFE)}
        nuevaHref={RUTA_NUEVA_TAREA}
      />
      <TeacherTaskList tareas={tareas} ahora={AHORA_DEMO} />
    </Vista>
  );
}
