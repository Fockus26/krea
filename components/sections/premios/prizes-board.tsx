"use client";

import { Trophy } from "lucide-react";
import { useState, useTransition } from "react";
import { EmptyState } from "@/components/krea/empty-state";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import type { DecisionPremio, SeccionId } from "@/lib/modelo";
import {
  type DecisionEmpate,
  decisionAviso,
  nombreCortoEquipo,
  resolverEmpate,
  type TarjetaPremio,
} from "@/lib/premios";
import { mensajeErrorTarea } from "@/lib/tareas-profe";
import type { ResultadoTarea } from "@/lib/tareas-profe-datos";
import { PrizeCardTeacher } from "./prize-card-teacher";

/** Server Action de la página real (W6, D201); sin ella (galería) la decisión es solo local. */
export type DecidirPremioAccion = (entrada: {
  tareaId: string;
  seccion: SeccionId;
  decision: DecisionPremio;
}) => Promise<ResultadoTarea>;

/**
 * `g3` de tarjetas de premios (HANDOFF §3 Premios). Decidir un empate cambia la tarjeta y lo dice
 * con un toast; con `decidir` (página real) primero se guarda en Firestore y, si falla, la
 * tarjeta sigue en empate y el toast dice por qué.
 */
export function PrizesBoard({
  tarjetas,
  nombres,
  decidir: guardarDecision,
}: {
  tarjetas: readonly TarjetaPremio[];
  nombres: Readonly<Record<string, string>>;
  decidir?: DecidirPremioAccion;
}) {
  const [lista, setLista] = useState(tarjetas);
  const [, startTransition] = useTransition();

  function decidir(id: string, decision: DecisionEmpate) {
    const actual = lista.find((t) => t.id === id);
    if (!actual || actual.estado.tipo !== "empate") return;
    const { seccionId } = actual;
    const nombre = (e: string) => nombres[e] ?? e;
    const aviso = decisionAviso(
      decision,
      decision.tipo === "dar" ? nombre(decision.equipoId) : "",
      actual.estado.equipoIds.map((e) => nombreCortoEquipo(nombre(e))),
    );
    const aplicar = () => {
      setLista((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, estado: resolverEmpate(t.estado, decision) }
            : t,
        ),
      );
      toast.success(aviso);
    };
    if (!guardarDecision || !seccionId) {
      aplicar();
      return;
    }
    startTransition(async () => {
      let r: ResultadoTarea;
      try {
        r = await guardarDecision({
          tareaId: actual.tareaId,
          seccion: seccionId,
          decision,
        });
      } catch {
        r = { ok: false, error: "red" };
      }
      if (r.ok) aplicar();
      else toast.error(mensajeErrorTarea(r.error));
    });
  }

  if (lista.length === 0)
    return (
      <Card>
        <EmptyState
          icon={Trophy}
          headingLevel={2}
          title="Todavía no hay premios"
          description="Cuando una tarea tenga premio, aquí verás quién lo gana y podrás decidir los empates."
        />
      </Card>
    );

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
