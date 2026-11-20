"use client";

import { Trash2, User, Users } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/krea/status-badge";
import type { useSeleccionLote } from "@/components/sections/shared/use-seleccion-lote";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  estadoTodos,
  SELECCIONAR_TODAS_TAREAS,
  seleccionarLabel,
  TAREAS,
} from "@/lib/lote";
import {
  avanceTexto,
  eliminarTareaLabel,
  fechaTareaTexto,
  rutaTarea,
  TABLA_TAREAS_LABEL,
  type TareaProfe,
} from "@/lib/tareas-profe";
import { tituloTareaId } from "./teacher-task-card";

/**
 * Vista Lista de Tareas del profesor (D313): lo de la tarjeta en columnas — título (enlace a
 * `/profe/tareas/[id]`), tipo, secciones, estado, fecha y avance — y «Eliminar» de una por fila
 * (el mismo diálogo de D243, que abre la lista). Con `seleccion`, una casilla por fila y «todas
 * las visibles» en la cabecera (D314). El título lleva el `id` de la tarjeta: tras eliminar una,
 * el foco va al de la vecina igual que en Tarjetas. La región desplazable y la pista bajo 1024
 * las pone `Table` (D044): a 320 px se desplaza la tabla, no la página.
 */
export function TeacherTaskTable({
  tareas,
  ahora,
  seleccion,
  onEliminar,
}: {
  /** Las visibles (ya filtradas), en el orden de la lista. */
  tareas: readonly TareaProfe[];
  /** Instante (ms) para "vence" / "venció" por fecha y hora (D357). */
  ahora: number;
  seleccion?: {
    marcadas: ReadonlySet<string>;
    casilla: ReturnType<typeof useSeleccionLote>["casilla"];
    onTodas: () => void;
  };
  onEliminar?: (t: TareaProfe, boton: HTMLButtonElement) => void;
}) {
  return (
    <Table label={TABLA_TAREAS_LABEL}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {seleccion ? (
            <TableHead scope="col" className="w-12 pr-0">
              <Checkbox
                checked={estadoTodos(
                  tareas.map((t) => t.id),
                  seleccion.marcadas,
                )}
                onCheckedChange={() => seleccion.onTodas()}
                disabled={tareas.length === 0}
                aria-label={SELECCIONAR_TODAS_TAREAS}
              />
            </TableHead>
          ) : null}
          <TableHead scope="col">Tarea</TableHead>
          <TableHead scope="col">Tipo</TableHead>
          <TableHead scope="col">Secciones</TableHead>
          <TableHead scope="col">Estado</TableHead>
          <TableHead scope="col">Fecha</TableHead>
          <TableHead scope="col">Avance</TableHead>
          {onEliminar ? (
            <TableHead scope="col" numeric>
              <span className="sr-only">Acciones</span>
            </TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {tareas.map((t) => (
          <TableRow key={t.id}>
            {seleccion ? (
              <TableCell className="w-12 pr-0">
                <Checkbox
                  {...seleccion.casilla(t.id)}
                  aria-label={seleccionarLabel(`«${t.titulo}»`, TAREAS)}
                />
              </TableCell>
            ) : null}
            <TableCell>
              <Link
                id={tituloTareaId(t.id)}
                href={rutaTarea(t.id)}
                className="text-label break-words text-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                {t.titulo}
              </Link>
            </TableCell>
            <TableCell>
              <Badge>
                {t.tipo === "grupal" ? (
                  <Users aria-hidden="true" />
                ) : (
                  <User aria-hidden="true" />
                )}
                {t.tipo === "grupal" ? "Grupal" : "Individual"}
              </Badge>
            </TableCell>
            <TableCell className="whitespace-nowrap text-body text-text-2">
              {t.secciones ?? <Sin texto="Sin secciones" />}
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={t.estado} />
                {/* Todas sus entregas con nota (D454) */}
                {t.evaluadaToda ? <StatusBadge status="evaluada" /> : null}
              </div>
            </TableCell>
            <TableCell className="nums whitespace-nowrap text-body text-text-2">
              {fechaTareaTexto(t, ahora)}
            </TableCell>
            <TableCell className="nums text-body text-text-2">
              {t.avance && t.estado !== "borrador" ? (
                avanceTexto(t.avance, t.tipo)
              ) : (
                <Sin texto="Sin avance: es un borrador" />
              )}
            </TableCell>
            {onEliminar ? (
              <TableCell numeric>
                <Button
                  type="button"
                  variant="ghost-danger"
                  size="sm"
                  icon
                  aria-haspopup="dialog"
                  aria-label={eliminarTareaLabel(t.titulo)}
                  onClick={(e) => onEliminar(t, e.currentTarget)}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Celda sin dato: una raya a la vista y la frase para el lector. */
function Sin({ texto }: { texto: string }) {
  return (
    <>
      <span aria-hidden="true">—</span>
      <span className="sr-only">{texto}</span>
    </>
  );
}
