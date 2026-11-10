import type { Metadata } from "next";
import { PendingTasks } from "@/components/sections/inicio/pending-tasks";
import { PageHeader } from "@/components/sections/shared/page-header";
import { DeliveredTasks } from "@/components/sections/tareas/delivered-tasks";
import { datosAlumno } from "@/lib/datos/estudiante";
import { tareasVista } from "@/lib/vistas-estudiante";

export const metadata: Metadata = { title: "Tareas" };

// Tareas (HANDOFF §3): Por entregar y Entregadas, como /secciones/tareas, con las tareas de su
// sección y sus entregas (W5).
export default async function TareasPage() {
  const datos = await datosAlumno();
  const d = tareasVista(datos, Date.now());
  return (
    <>
      <PageHeader
        eyebrow={`Sección ${datos.usuario.seccion ?? ""}`}
        title="Tareas"
      />
      <PendingTasks filas={d.pendientes} />
      <DeliveredTasks filas={d.entregadas} />
    </>
  );
}
