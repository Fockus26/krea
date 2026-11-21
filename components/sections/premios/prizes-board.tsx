"use client";

import { Trophy } from "lucide-react";
import { useState, useTransition } from "react";
import { EmptyState } from "@/components/krea/empty-state";
import { useFlip } from "@/components/krea/use-flip";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import {
  type DecisionPremio,
  idDeDecision,
  type SeccionId,
} from "@/lib/modelo";
import {
  type DecisionEmpate,
  decisionAviso,
  nombreCortoTitular,
  resolverEmpate,
  type TarjetaPremio,
} from "@/lib/premios";
import { mensajeErrorTarea } from "@/lib/tareas-profe";
import type { ResultadoTarea } from "@/lib/tareas-profe-datos";
import { PrizeCardTeacher } from "./prize-card-teacher";
import {
  type GuardarPremioAccion,
  type PremioEnEdicion,
  PrizeDialog,
} from "./prize-dialog";

/** Server Action de la página real (W6, D201); sin ella (galería) la decisión es solo local. */
export type DecidirPremioAccion = (entrada: {
  tareaId: string;
  seccion: SeccionId;
  decision: DecisionPremio;
}) => Promise<ResultadoTarea>;

function edicionDe(t: TarjetaPremio): PremioEnEdicion {
  return {
    tareaId: t.tareaId,
    tarea: t.tarea,
    tipo: t.tipoTarea ?? "grupal",
    premio: t.premio ?? "",
    fotoUrl: t.fotoUrl ?? null,
    conFoto: Boolean(t.premioFoto),
  };
}

/**
 * `g3` de tarjetas de premios (HANDOFF §3 Premios). Decidir un empate cambia la tarjeta y lo dice
 * con un toast; con `decidir` (página real) primero se guarda en Firestore y, si falla, la
 * tarjeta sigue en empate y el toast dice por qué. Con `guardarPremio` (D266), «Agregar / Editar
 * premio» de cada tarjeta abre el diálogo; al guardar, la acción refresca la página y las
 * tarjetas nuevas llegan por props (se adoptan al cambiar).
 */
export function PrizesBoard({
  tarjetas,
  nombres,
  decidir: guardarDecision,
  guardarPremio,
  fotoDisponible = false,
}: {
  tarjetas: readonly TarjetaPremio[];
  nombres: Readonly<Record<string, string>>;
  decidir?: DecidirPremioAccion;
  guardarPremio?: GuardarPremioAccion;
  fotoDisponible?: boolean;
}) {
  const [lista, setLista] = useState(tarjetas);
  const [origen, setOrigen] = useState(tarjetas);
  // Tras `refresh()` del servidor llegan tarjetas nuevas: mandan sobre lo decidido en local
  if (origen !== tarjetas) {
    setOrigen(tarjetas);
    setLista(tarjetas);
  }
  const [editando, setEditando] = useState<TarjetaPremio | null>(null);
  const [, startTransition] = useTransition();
  // Agregar o quitar un premio recoloca las tarjetas de la cuadrícula (X e Y) y la quitada se despide
  const { registrar } = useFlip<HTMLLIElement>({
    duracion: "--d-normal",
    entrada: true,
    salida: true,
  });

  function decidir(id: string, decision: DecisionEmpate) {
    const actual = lista.find((t) => t.id === id);
    if (!actual || actual.estado.tipo !== "empate") return;
    const { seccionId } = actual;
    const nombre = (e: string) => nombres[e] ?? e;
    const elegido = idDeDecision(decision);
    const aviso = decisionAviso(
      decision,
      elegido ? nombre(elegido) : "",
      actual.estado.titularIds.map((e) =>
        nombreCortoTitular(actual.tipoTarea, nombre(e)),
      ),
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

  // Sin `DialogTrigger`: al cerrar, Radix devuelve el foco al botón «Editar premio» que lo abrió
  const dialogo =
    guardarPremio && editando ? (
      <PrizeDialog
        abierto
        onAbiertoChange={(v) => {
          if (!v) setEditando(null);
        }}
        edicion={edicionDe(editando)}
        fotoDisponible={fotoDisponible}
        guardar={guardarPremio}
      />
    ) : null;

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
    <>
      <ul className="g3 m-0 list-none p-0">
        {lista.map((t) => (
          <PrizeCardTeacher
            key={t.id}
            liRef={registrar(t.id)}
            tarjeta={t}
            nombres={nombres}
            onDecidir={decidir}
            onEditar={guardarPremio ? setEditando : undefined}
          />
        ))}
      </ul>
      {dialogo}
    </>
  );
}
