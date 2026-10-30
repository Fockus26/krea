"use client";

import { useState } from "react";
import { toast } from "@/components/ui/sonner";
import type { TarjetaPremio } from "@/lib/demo/premios";
import {
  type DecisionEmpate,
  decisionAviso,
  nombreCortoEquipo,
  resolverEmpate,
} from "@/lib/premios";
import { PrizeCardTeacher } from "./prize-card-teacher";

/**
 * `g3` de tarjetas de premios (HANDOFF §3 Premios). Estado local: decidir un empate cambia la
 * tarjeta y lo dice con un toast (nada se guarda, fase 07).
 */
export function PrizesBoard({
  tarjetas,
  nombres,
}: {
  tarjetas: readonly TarjetaPremio[];
  nombres: Readonly<Record<string, string>>;
}) {
  const [lista, setLista] = useState(tarjetas);

  function decidir(id: string, decision: DecisionEmpate) {
    const actual = lista.find((t) => t.id === id);
    if (!actual || actual.estado.tipo !== "empate") return;
    const nombre = (e: string) => nombres[e] ?? e;
    const aviso = decisionAviso(
      decision,
      decision.tipo === "dar" ? nombre(decision.equipoId) : "",
      actual.estado.equipoIds.map((e) => nombreCortoEquipo(nombre(e))),
    );
    setLista((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, estado: resolverEmpate(t.estado, decision) } : t,
      ),
    );
    toast.success(aviso);
  }

  return (
    <ul className="g3 m-0 list-none p-0">
      {lista.map((t) => (
        <PrizeCardTeacher
          key={t.id}
          tarjeta={t}
          nombres={nombres}
          onDecidir={decidir}
        />
      ))}
    </ul>
  );
}
