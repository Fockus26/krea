"use client";

import * as React from "react";
import { toast } from "@/components/ui/sonner";
import type { CandidatosPuntos, InicialAjuste } from "@/lib/demo/puntos";
import {
  ajusteAnuladoTexto,
  anular,
  deltasSesion,
  FILTRO_VACIO,
  type FilaHistorial,
  type FiltroHistorial,
  isoLocal,
} from "@/lib/puntos";
import { AdjustmentForm } from "./adjustment-form";
import { AdjustmentHistory } from "./adjustment-history";

/**
 * Ajustes de puntos (HANDOFF §3; D118–D121): `g-home` 7/5 con el formulario y el historial; una
 * columna por debajo de 1024 en el orden del DOM. El estado es local (nada se guarda hasta la
 * fase 07): aplicar y anular añaden filas al historial y mueven los puntos de la vista previa.
 */
export function PuntosView({
  candidatos,
  historial,
  inicial,
  profe,
}: {
  candidatos: CandidatosPuntos;
  historial: readonly FilaHistorial[];
  inicial?: InicialAjuste;
  profe: string;
}) {
  const [filas, setFilas] = React.useState<readonly FilaHistorial[]>(historial);
  const [filtro, setFiltro] = React.useState<FiltroHistorial>(FILTRO_VACIO);
  const deltas = deltasSesion(filas);

  const onAnular = (id: string) => {
    const original = filas.find((f) => f.id === id);
    if (!original) return;
    setFilas(
      anular(filas, id, {
        nuevoId: `anula-${id}-${Date.now()}`,
        fecha: isoLocal(new Date()),
        profe,
      }),
    );
    toast.success(ajusteAnuladoTexto(original));
  };

  return (
    <div className="g-home max-md:gap-6">
      <AdjustmentForm
        candidatos={candidatos}
        deltas={deltas}
        inicial={inicial}
        profe={profe}
        onAplicar={(f) => setFilas((prev) => [f, ...prev])}
      />
      <AdjustmentHistory
        filas={filas}
        filtro={filtro}
        onFiltro={setFiltro}
        onAnular={onAnular}
      />
    </div>
  );
}
