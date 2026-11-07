import type { Metadata } from "next";
import { TasksHeader } from "@/components/sections/tareas-profe/tasks-header";
import { TeacherTaskList } from "@/components/sections/tareas-profe/teacher-task-list";
import { eliminarTarea } from "@/lib/acciones/tareas";
import {
  conteos,
  entregasTodas,
  profesorActual,
  seccionesDelProfe,
  tareasProfe,
} from "@/lib/datos/profesor";
import { diaDeInstante } from "@/lib/fecha";
import {
  eyebrowTareas,
  ordenarTareas,
  RUTA_NUEVA_TAREA,
} from "@/lib/tareas-profe";
import {
  perdidasPorTarea,
  resumenEntregas,
  seccionTareaDe,
  tareaProfeDe,
} from "@/lib/tareas-profe-datos";

export const metadata: Metadata = { title: "Tareas del profesor" };

// Tareas del profesor (HANDOFF §3; W6): todas las tareas de Firestore, borradores incluidos, con
// sus entregas y evaluadas. Cada tarea enlaza a /profe/tareas/[id]; el filtro corre en el
// cliente (D099). «Hoy» es el día de Caracas del request (D197).
export default async function TareasProfePage() {
  const [{ usuario }, tareas, entregas, c] = await Promise.all([
    profesorActual(),
    tareasProfe(),
    entregasTodas(),
    conteos(),
  ]);
  const resumen = resumenEntregas(entregas);
  const perdidas = perdidasPorTarea(entregas);
  const vista = ordenarTareas(
    tareas.map((t) =>
      tareaProfeDe(t, resumen.get(t.id), c, perdidas.get(t.id)),
    ),
  );
  return (
    <>
      <TasksHeader
        eyebrow={eyebrowTareas(
          vista.length,
          seccionTareaDe(seccionesDelProfe(usuario)),
        )}
        nuevaHref={RUTA_NUEVA_TAREA}
      />
      <TeacherTaskList
        tareas={vista}
        hoy={diaDeInstante(Date.now())}
        eliminar={eliminarTarea}
      />
    </>
  );
}
