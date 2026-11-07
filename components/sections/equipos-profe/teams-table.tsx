"use client";

import type { ReactNode } from "react";
import { TeamLogo } from "@/components/krea/team-logo";
import type { useSeleccionLote } from "@/components/sections/shared/use-seleccion-lote";
import { Badge } from "@/components/ui/badge";
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
  chipPuestoTexto,
  type EquipoVista,
  type SeccionEquipos,
} from "@/lib/equipos-profe";
import {
  EQUIPOS,
  estadoTodos,
  SELECCIONAR_TODOS_EQUIPOS,
  seleccionarLabel,
} from "@/lib/lote";

/** Fila de la vista Lista: el equipo y lo que el tablero sabe de él ahora. */
export type FilaEquipo = {
  equipo: EquipoVista;
  integrantes: number;
  /** Nombre del capitán; `null` si quedó sin integrantes. */
  capitan: string | null;
  logoSrc?: string;
};

/* PROVISIONAL (CONTENT_CHECKLIST fila 164) */
export const tablaEquiposLabel = (seccion: SeccionEquipos) =>
  `Lista de equipos de ${seccion}`;

/**
 * Vista Lista de Equipos (D313): nombre con logo y tema, integrantes, capitán y puesto con sus
 * puntos (los del ranking que ya trae el tablero). Las acciones de fila son las de la tarjeta
 * (editar, eliminar, con sus diálogos); mover integrantes y cambiar capitán siguen solo en
 * Tarjetas. Con `seleccion`, una casilla por equipo y «todos» en la cabecera (D315). La región
 * desplazable y la pista bajo 1024 las pone `Table` (D044).
 */
export function TeamsTable({
  seccion,
  filas,
  seleccion,
  acciones,
}: {
  seccion: SeccionEquipos;
  filas: readonly FilaEquipo[];
  seleccion?: {
    marcadas: ReadonlySet<string>;
    casilla: ReturnType<typeof useSeleccionLote>["casilla"];
    onTodos: () => void;
  };
  acciones?: (equipo: EquipoVista) => ReactNode;
}) {
  return (
    <Table label={tablaEquiposLabel(seccion)}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {seleccion ? (
            <TableHead scope="col" className="w-12 pr-0">
              <Checkbox
                checked={estadoTodos(
                  filas.map((f) => f.equipo.id),
                  seleccion.marcadas,
                )}
                onCheckedChange={() => seleccion.onTodos()}
                disabled={filas.length === 0}
                aria-label={SELECCIONAR_TODOS_EQUIPOS}
              />
            </TableHead>
          ) : null}
          <TableHead scope="col">Equipo</TableHead>
          <TableHead scope="col" numeric>
            Integrantes
          </TableHead>
          <TableHead scope="col">Capitán</TableHead>
          <TableHead scope="col">Puesto</TableHead>
          {acciones ? (
            <TableHead scope="col" numeric>
              <span className="sr-only">Acciones</span>
            </TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {filas.map(({ equipo, integrantes, capitan, logoSrc }) => (
          <TableRow key={equipo.id}>
            {seleccion ? (
              <TableCell className="w-12 pr-0">
                <Checkbox
                  {...seleccion.casilla(equipo.id)}
                  aria-label={seleccionarLabel(
                    `el equipo ${equipo.nombre}`,
                    EQUIPOS,
                  )}
                />
              </TableCell>
            ) : null}
            <TableCell>
              <span className="flex items-center gap-3">
                <TeamLogo
                  teamId={equipo.id}
                  tema={equipo.tema ?? equipo.nombre}
                  src={logoSrc}
                  size={40}
                />
                <span className="flex min-w-0 flex-col items-start gap-1">
                  <span className="text-label break-words text-text">
                    {equipo.nombre}
                  </span>
                  <span className="text-small text-text-2">
                    {equipo.tema ? `Tema: ${equipo.tema}` : "Sin tema elegido"}
                  </span>
                </span>
              </span>
            </TableCell>
            <TableCell numeric className="text-body text-text">
              {integrantes}
            </TableCell>
            <TableCell className="text-body text-text">
              {capitan ?? <Badge variant="warn">Sin capitán</Badge>}
            </TableCell>
            <TableCell className="nums whitespace-nowrap text-body text-text-2">
              {chipPuestoTexto(equipo.puesto, equipo.puntos, equipo.empate)}
            </TableCell>
            {acciones ? (
              <TableCell numeric>
                <span className="flex flex-wrap items-center justify-end gap-1">
                  {acciones(equipo)}
                </span>
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
