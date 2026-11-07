"use client";

import { useState } from "react";
import { rutaAlumnos } from "@/lib/alumnos";
import {
  detallePorEvaluar,
  detalleRaspados,
  evaluadosTexto,
  type FiltroSeccion,
  filtrarPorSeccion,
  filtroTexto,
  porcentajeEvaluados,
  type Raspado,
  type SeccionPanel,
} from "@/lib/panel";
import { PanelHeader } from "./panel-header";
import { type DatosMetricas, PanelMetrics } from "./panel-metrics";
import { type FilaEvaluar, PendingReviews } from "./pending-reviews";
import { type FilaAjuste, RecentAdjustments } from "./recent-adjustments";

export type DatosPanel = {
  entregas: readonly FilaEvaluar[];
  ajustes: readonly FilaAjuste[];
  /** Tarea que miden "Evaluados" y "Raspados" (hoy la única evaluada: Identidad de marca). */
  tareaEvaluada: string;
  /** Id de esa tarea; sin él (vista previa) los enlaces van a Alumnos sin tarea (D252). */
  tareaId?: string | null;
  avance: Readonly<Record<SeccionPanel, { evaluados: number; total: number }>>;
  raspados: ReadonlyArray<Raspado & { seccion: SeccionPanel }>;
};

/**
 * Panel del profesor (HANDOFF §3 Panel). Cliente solo por el filtro de sección: el segmentado filtra en el
 * navegador sobre los datos completos que llegan por props (el filtro puro vive en `lib/panel.ts`).
 * La hora no se lee aquí: el saludo llega armado (la fase 05 decide el reloj del cliente).
 */
export function PanelView({
  saludo,
  datos,
  filtroInicial = "ambas",
}: {
  saludo: string;
  datos: DatosPanel;
  filtroInicial?: FiltroSeccion;
}) {
  const [filtro, setFiltro] = useState<FiltroSeccion>(filtroInicial);

  const entregas = filtrarPorSeccion(datos.entregas, filtro);
  const ajustes = filtrarPorSeccion(datos.ajustes, filtro);
  const raspados = filtrarPorSeccion(datos.raspados, filtro);
  const secciones: SeccionPanel[] =
    filtro === "ambas" ? ["5A", "5C"] : [filtro];
  const evaluados = secciones.reduce(
    (n, s) => n + datos.avance[s].evaluados,
    0,
  );
  const total = secciones.reduce((n, s) => n + datos.avance[s].total, 0);

  // La sección elegida en el Panel (D099) viaja a Alumnos; «ambas» no filtra.
  const base = {
    ...(filtro === "ambas" ? {} : { seccion: filtro }),
    ...(datos.tareaId ? { tarea: datos.tareaId } : {}),
  };

  const metricas: DatosMetricas = {
    porEvaluar: {
      total: entregas.length,
      detalle: detallePorEvaluar(entregas),
    },
    evaluados: {
      tarea: datos.tareaEvaluada,
      n: evaluados,
      total,
      pct: porcentajeEvaluados(evaluados, total),
      texto: evaluadosTexto(evaluados, total),
    },
    raspados: { total: raspados.length, detalle: detalleRaspados(raspados) },
    hrefs: {
      evaluados: rutaAlumnos({ ...base, estado: "evaluados" }),
      raspados: rutaAlumnos({ ...base, estado: "raspados" }),
    },
  };

  return (
    <>
      <PanelHeader saludo={saludo} filtro={filtro} onFiltro={setFiltro} />
      {/* Única región viva del panel: frase estable, sin cifras sueltas */}
      <output className="sr-only">{filtroTexto(filtro)}</output>
      <PanelMetrics datos={metricas} />
      <div className="g-home max-md:gap-6 lg:items-stretch!">
        <PendingReviews filas={entregas} />
        <RecentAdjustments filas={ajustes} />
      </div>
    </>
  );
}
