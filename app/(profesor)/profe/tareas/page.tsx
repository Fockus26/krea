import type { Metadata } from "next";
import { SinSecciones } from "@/components/sections/shared/sin-secciones";
import { TasksHeader } from "@/components/sections/tareas-profe/tasks-header";
import { TeacherTaskList } from "@/components/sections/tareas-profe/teacher-task-list";
import { eliminarTarea, eliminarTareas } from "@/lib/acciones/tareas";
import {
  conteos,
  entregasTodas,
  profesorActual,
  seccionesDelProfe,
  tareasProfe,
} from "@/lib/datos/profesor";
import { catalogoSecciones } from "@/lib/datos/secciones";
import { seccionesDe } from "@/lib/secciones";
import {
  eyebrowTareas,
  ordenarTareas,
  RUTA_NUEVA_TAREA,
  seccionesResumen,
} from "@/lib/tareas-profe";
import {
  perdidasPorTarea,
  resumenEntregas,
  tareaProfeDe,
} from "@/lib/tareas-profe-datos";

export const metadata: Metadata = { title: "Tareas del profesor" };

// Tareas del profesor (HANDOFF §3; W6): todas las tareas de Firestore, borradores incluidos, con
// sus entregas y evaluadas. Cada tarea enlaza a /profe/tareas/[id]; el filtro corre en el
// cliente (D099). «Hoy» es el día de Caracas del request (D197). Sin secciones en el catálogo no
// se puede crear una tarea: el vacío de D325 en vez de la lista (sin secciones no hay tareas).
export default async function TareasProfePage() {
  const [{ usuario, sesion }, tareas, entregas, c, catalogo] =
    await Promise.all([
      profesorActual(),
      tareasProfe(),
      entregasTodas(),
      conteos(),
      catalogoSecciones(),
    ]);
  const secciones = seccionesDe(catalogo);
  const resumen = resumenEntregas(entregas);
  const perdidas = perdidasPorTarea(entregas);
  // Después de los datos: el estado efectivo de cada tarea en este instante (D451)
  const ahora = Date.now();
  const vista = ordenarTareas(
    tareas.map((t) =>
      tareaProfeDe(t, resumen.get(t.id), c, perdidas.get(t.id), ahora),
    ),
  );
  const eyebrow = eyebrowTareas(
    vista.length,
    seccionesResumen(seccionesDelProfe(usuario, secciones)),
  );
  if (secciones.length === 0 && vista.length === 0) {
    return (
      <>
        <TasksHeader eyebrow={eyebrow} />
        <SinSecciones admin={sesion.admin === true} />
      </>
    );
  }
  return (
    <>
      <TasksHeader
        eyebrow={eyebrow}
        nuevaHref={secciones.length > 0 ? RUTA_NUEVA_TAREA : undefined}
      />
      <TeacherTaskList
        tareas={vista}
        ahora={ahora}
        eliminar={eliminarTarea}
        eliminarVarias={eliminarTareas}
      />
    </>
  );
}
