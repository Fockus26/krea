import type { Metadata } from "next";
import { PendingTasks } from "@/components/sections/inicio/pending-tasks";
import { PageHeader } from "@/components/sections/shared/page-header";
import { DeliveredTasks } from "@/components/sections/tareas/delivered-tasks";
import { tareasDe } from "@/lib/demo/entrega";
import { alumnoPorCedula, CEDULA_DEMO } from "@/lib/demo/seed";
import { Vista } from "../_vista/vista";

export const metadata: Metadata = {
  title: "Secciones · Tareas",
  robots: { index: false, follow: false },
};

// Ruta final (fase 05): /tareas. Misma plantilla que Mis notas (HANDOFF §3): Por entregar
// (las filas de Inicio) y Entregadas. Datos: Yeilin Duarte del seed (D069).
export default function TareasVista() {
  const alumno = alumnoPorCedula(CEDULA_DEMO);
  const d = tareasDe(alumno);
  return (
    <Vista rol="estudiante" ruta="/tareas" width="lectura">
      <PageHeader eyebrow={`Sección ${alumno.seccion}`} title="Tareas" />
      <PendingTasks filas={d.pendientes} />
      <DeliveredTasks filas={d.entregadas} />
    </Vista>
  );
}
