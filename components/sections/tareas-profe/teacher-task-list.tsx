"use client";

import { ClipboardCheck } from "lucide-react";
import * as React from "react";
import { EmptyState } from "@/components/krea/empty-state";
import { Card } from "@/components/ui/card";
import {
  type FiltroEstado,
  filtrarTareas,
  filtroVacio,
  type TareaProfe,
} from "@/lib/tareas-profe";
import { TaskStatusFilter } from "./task-status-filter";
import { TeacherTaskCard } from "./teacher-task-card";

/**
 * Lista de tareas del profesor (cliente, único estado: el filtro). Recibe todas las tareas por
 * props y filtra en el cliente (D099); el vacío de un filtro sin tareas es provisional (fila 89).
 */
export function TeacherTaskList({
  tareas,
  hoy,
  filtroInicial = "todas",
}: {
  tareas: readonly TareaProfe[];
  hoy: string;
  filtroInicial?: FiltroEstado;
}) {
  const [filtro, setFiltro] = React.useState<FiltroEstado>(filtroInicial);
  const visibles = filtrarTareas(tareas, filtro);

  return (
    <div className="flex flex-col gap-6">
      <TaskStatusFilter filtro={filtro} onFiltro={setFiltro} />
      {visibles.length > 0 ? (
        <ul className="flex flex-col gap-6">
          {visibles.map((t) => (
            <TeacherTaskCard key={t.id} tarea={t} hoy={hoy} />
          ))}
        </ul>
      ) : (
        <Card>
          <EmptyState
            icon={ClipboardCheck}
            headingLevel={2}
            title={filtroVacio(filtro)}
          />
        </Card>
      )}
    </div>
  );
}
