"use client";

import { Check, CircleDashed, Hourglass, Inbox } from "lucide-react";
import Link from "next/link";
import { Fragment, useState } from "react";
import { EmptyState } from "@/components/krea/empty-state";
import { GradePill } from "@/components/krea/grade-pill";
import {
  type AccionesDevolverEntrega,
  AccionesEntrega,
} from "@/components/sections/evaluar/acciones-entrega";
import { SelectorSeccion } from "@/components/sections/shared/selector-seccion";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DEVOLVER_SOLO_ABIERTAS } from "@/lib/devolver-entrega";
import { formatNota } from "@/lib/grades";
import type { SeccionId } from "@/lib/modelo";
import {
  ACCION_TEXTO,
  accionLabel,
  conteoEntregas,
  conteoEntregasTexto,
  ESTADO_FILA_TEXTO,
  type EstadoFilaEntrega,
  type FilaEntregaTarea,
  filasDeSeccion,
  puntajeTexto,
} from "@/lib/tareas-profe-entregas";

const ESTADO_CHIP: Record<
  EstadoFilaEntrega,
  { variant: BadgeVariant; icon: typeof Check }
> = {
  "sin-entregar": { variant: "neutral", icon: CircleDashed },
  "por-evaluar": { variant: "warn", icon: Hourglass },
  evaluada: { variant: "acc", icon: Check },
};

function EstadoChip({ estado }: { estado: EstadoFilaEntrega }) {
  const { variant, icon: Icon } = ESTADO_CHIP[estado];
  return (
    <Badge variant={variant} data-status={estado}>
      <Icon aria-hidden="true" />
      {ESTADO_FILA_TEXTO[estado]}
    </Badge>
  );
}

const SIN_DATO = <span aria-hidden="true">—</span>;

/**
 * Entregas de una tarea (D398–D401): selector de sección, el conteo y una fila por titular —el
 * alumno o el equipo con sus integrantes debajo— con estado (ícono + palabra), puntaje sobre 20,
 * base y nota (`GradePill`; Pendiente si no hay, D003). «Ver» abre la entrega para leerla (`?ver`)
 * y «Evaluar»/«Corregir» sin `?ver` (D401). Cada fila con entrega suma «Más acciones»:
 * «Devolver al alumno» (evaluada y tarea abierta, D411) y «Eliminar entrega» (D413); con la tarea
 * cerrada, una línea bajo el conteo explica por qué no hay «Devolver». La sección elegida viaja en
 * la URL sin recargar.
 */
export function TaskSubmissions({
  titulo,
  filas,
  secciones,
  seccionInicial,
  acciones,
  tareaCerrada = false,
}: {
  titulo: string;
  filas: readonly FilaEntregaTarea[];
  /** Secciones de la tarea con filas, ordenadas. */
  secciones: readonly SeccionId[];
  seccionInicial: SeccionId | null;
  /** Devolver y eliminar (Server Actions); sin ellas (galería), el menú solo muestra el toast. */
  acciones?: AccionesDevolverEntrega;
  /** La tarea ya no está abierta: no hay «Devolver» y se explica (D411). */
  tareaCerrada?: boolean;
}) {
  const [seccion, setSeccion] = useState(seccionInicial);
  const visibles = filasDeSeccion(filas, seccion);
  const conteo = conteoEntregasTexto(conteoEntregas(visibles));

  const elegir = (valor: string) => {
    setSeccion(valor);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("seccion", valor);
      window.history.replaceState(null, "", url);
    } catch {
      // Sin historial (vista previa): el estado local basta
    }
  };

  if (filas.length === 0 || seccion === null) {
    return (
      <EmptyState
        icon={Inbox}
        headingLevel={2}
        title="Todavía no hay entregas ni alumnos para esta tarea"
        description="Cuando haya secciones con alumnos o equipos, aquí verás quién entregó y su nota."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section
        aria-label="Filtros"
        className="flex flex-wrap items-center gap-3"
      >
        <SelectorSeccion
          secciones={secciones}
          valor={seccion}
          onCambio={elegir}
        />
        <output
          aria-live="polite"
          aria-atomic="true"
          className="nums text-small text-text-2"
        >
          {conteo}
        </output>
        {tareaCerrada ? (
          <p className="w-full text-small text-text-2">
            {DEVOLVER_SOLO_ABIERTAS}
          </p>
        ) : null}
      </section>
      <Table label={`Entregas de ${titulo} en ${seccion}`}>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead scope="col">Alumno o equipo</TableHead>
            <TableHead scope="col">Estado</TableHead>
            <TableHead scope="col" numeric>
              Puntaje
            </TableHead>
            <TableHead scope="col" className="text-center">
              Base
            </TableHead>
            <TableHead scope="col" className="text-center">
              Nota
            </TableHead>
            <TableHead scope="col" numeric>
              <span className="sr-only">Acciones</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibles.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={6} className="h-auto py-8 text-center">
                <span className="text-body text-text-2">
                  No hay alumnos ni equipos de {seccion} en esta tarea.
                </span>
              </TableCell>
            </TableRow>
          ) : (
            visibles.map((f) => (
              <Fragment key={f.titularId}>
                <TableRow>
                  <TableCell>
                    <span className="text-label text-text">{f.nombre}</span>
                  </TableCell>
                  <TableCell>
                    <EstadoChip estado={f.estado} />
                  </TableCell>
                  <TableCell numeric>{puntajeTexto(f.puntaje)}</TableCell>
                  <TableCell className="nums text-center">
                    {f.base === null ? (
                      f.tipo === "grupal" ? (
                        <span className="text-small text-text-2">
                          Por integrante
                        </span>
                      ) : (
                        SIN_DATO
                      )
                    ) : (
                      formatNota(f.base)
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {f.tipo === "grupal" || f.estado === "sin-entregar" ? (
                      SIN_DATO
                    ) : (
                      <GradePill nota={f.nota} size="sm" table />
                    )}
                  </TableCell>
                  <TableCell numeric>
                    <span className="flex items-center justify-end gap-1">
                      {f.verHref ? (
                        <Button asChild variant="ghost" size="sm">
                          <Link
                            href={f.verHref}
                            aria-label={accionLabel("ver", f.nombre)}
                          >
                            Ver
                          </Link>
                        </Button>
                      ) : null}
                      {f.accion && f.accionHref ? (
                        <Button asChild variant="secondary" size="sm">
                          <Link
                            href={f.accionHref}
                            aria-label={accionLabel(f.accion, f.nombre)}
                          >
                            {ACCION_TEXTO[f.accion]}
                          </Link>
                        </Button>
                      ) : null}
                      {f.entregaId ? (
                        <AccionesEntrega
                          variante="menu"
                          entregaId={f.entregaId}
                          titular={{
                            nombre: f.nombre,
                            tipo: f.tipo,
                            evaluada: f.estado === "evaluada",
                          }}
                          enviadaEn={f.enviadaEn}
                          evaluadaEn={f.evaluadaEn}
                          puedeDevolver={f.puedeDevolver}
                          acciones={acciones}
                        />
                      ) : null}
                    </span>
                  </TableCell>
                </TableRow>
                {f.integrantes.map((i) => (
                  <TableRow key={`${f.titularId}-${i.cedula}`}>
                    <TableCell className="h-auto py-1.5 pl-8">
                      <span className="text-small text-text-2">
                        <span className="sr-only">Integrante de </span>
                        {i.nombre}
                        <span className="sr-only"> en {f.nombre}</span>
                      </span>
                    </TableCell>
                    <TableCell className="h-auto py-1.5">
                      {i.noParticipo ? (
                        <Badge variant="neutral">No participó</Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="h-auto py-1.5">{null}</TableCell>
                    <TableCell className="nums h-auto py-1.5 text-center">
                      {i.base === null ? SIN_DATO : formatNota(i.base)}
                    </TableCell>
                    <TableCell className="h-auto py-1.5 text-center">
                      <GradePill nota={i.nota} size="sm" table />
                    </TableCell>
                    <TableCell className="h-auto py-1.5">{null}</TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
