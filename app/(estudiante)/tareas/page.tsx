import type { Metadata } from "next";
import { PendingTasks } from "@/components/sections/inicio/pending-tasks";
import { PageHeader } from "@/components/sections/shared/page-header";
import { DeliveredTasks } from "@/components/sections/tareas/delivered-tasks";
import { tareasDe } from "@/lib/demo/entrega";
import { alumnoPorCedula, CEDULA_DEMO } from "@/lib/demo/seed";

export const metadata: Metadata = { title: "Tareas" };

// Tareas (HANDOFF §3): Por entregar y Entregadas, como /secciones/tareas.
// Datos: Yeilin Duarte del seed (D069) hasta la fase 07.
export default function TareasPage() {
  const alumno = alumnoPorCedula(CEDULA_DEMO);
  const d = tareasDe(alumno);
  return (
    <>
      <PageHeader eyebrow={`Sección ${alumno.seccion}`} title="Tareas" />
      <PendingTasks filas={d.pendientes} />
      <DeliveredTasks filas={d.entregadas} />
    </>
  );
}
