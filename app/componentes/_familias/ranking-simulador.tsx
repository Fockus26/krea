"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RankAnnouncer } from "@/components/krea/rank-announcer";
import { RankList } from "@/components/krea/rank-list";
import { Button } from "@/components/ui/button";
import type { RankEvento } from "@/lib/rank-row";
import { estudiantesOrdenados, filaEstudiante } from "./ranking-datos";

const TU = "e06"; // María Méndez
const MUEVE = "e02"; // Jorge Quintero: pasa de 28 a 36 puntos y sube del 8.º al 5.º
const PUNTOS_NUEVOS = 36;
const CAMBIO = { [MUEVE]: PUNTOS_NUEVOS };
const MOVING_MS = 600; // --d-rank
const EFECTO_MS = 1300; // --d-celebrate + margen

/** Lista de estudiantes con un botón que sube a uno de puesto, para ver el FLIP, la elevación y el brillo. */
export function RankingSimulador() {
  const [alto, setAlto] = useState(false);
  const [deltas, setDeltas] = useState<Partial<Record<string, number>> | null>(
    null,
  );
  const [moving, setMoving] = useState<string | undefined>();
  const [efecto, setEfecto] = useState<string | undefined>();
  const [eventos, setEventos] = useState<RankEvento[]>([]);
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      for (const t of timers.current) window.clearTimeout(t);
    },
    [],
  );

  const ordenados = useMemo(
    () => estudiantesOrdenados(alto ? CAMBIO : {}),
    [alto],
  );

  const filas = ordenados.map((e) =>
    filaEstudiante(e, {
      me: TU,
      deltas: deltas ?? undefined,
      moving,
      efecto: efecto ? { id: efecto, tipo: "sube" } : null,
    }),
  );

  function simular() {
    const siguiente = !alto;
    const antes = estudiantesOrdenados(alto ? CAMBIO : {});
    const despues = estudiantesOrdenados(siguiente ? CAMBIO : {});
    const puestoAntes = new Map(antes.map((e) => [e.id, e.puesto]));
    const nuevos: Record<string, number> = {};
    for (const e of despues)
      nuevos[e.id] = (puestoAntes.get(e.id) ?? e.puesto) - e.puesto;

    for (const t of timers.current) window.clearTimeout(t);
    setAlto(siguiente);
    setDeltas(nuevos);
    setMoving(MUEVE);
    setEfecto(siguiente ? MUEVE : undefined);
    const mueve = despues.find((e) => e.id === MUEVE);
    setEventos(
      siguiente && mueve
        ? [{ tipo: "sube", nombre: mueve.nombre, puesto: mueve.puesto }]
        : [],
    );
    timers.current = [
      window.setTimeout(() => setMoving(undefined), MOVING_MS),
      window.setTimeout(() => setEfecto(undefined), EFECTO_MS),
    ];
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button variant="secondary" size="sm" onClick={simular}>
          Simular cambio de puesto
        </Button>
      </div>
      <RankAnnouncer eventos={eventos} />
      <RankList filas={filas} label="Ranking de estudiantes" />
    </div>
  );
}
