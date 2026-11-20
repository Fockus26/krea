"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "@/components/ui/sonner";
import { avisoEntrega, IR_A_LA_COLA, VER_EVALUACION } from "@/lib/evaluar-vivo";
import { useVersionEvaluar } from "./use-version-evaluar";

/**
 * La entrega abierta en vivo (D443): NO se refresca sola (el profe perdería lo que escribe). Si
 * otro profe la evalúa, la corrige o deshace su nota, o si se devolvió o eliminó, avisa con un
 * toast que se queda hasta que se atienda: «Ver la evaluación» pide la página de nuevo
 * (`router.refresh`; el formulario se vuelve a montar con la nota nueva), «Ir a la cola» sale.
 * El mismo cambio no se avisa dos veces. Guardar con la versión vieja ya da `cambio` (D224).
 */
export function EntregaEnVivo({
  entregaId,
  abiertaCon,
  colaHref,
}: {
  entregaId: string;
  /** `evaluadaEn` con el que se abrió (la `version` del formulario); `null` = Pendiente. */
  abiertaCon: number | null;
  colaHref: string;
}) {
  const router = useRouter();
  const avisada = useRef<string | null>(null);
  const id = `evaluar-vivo-${entregaId}`;
  // Al salir de la entrega (Saltar, Guardar, el menú) el aviso ya no aplica
  useEffect(() => () => void toast.dismiss(id), [id]);
  useVersionEvaluar({
    entrega: entregaId,
    alCambiar: (v) => {
      const aviso = avisoEntrega(abiertaCon, v.entrega);
      if (!aviso || avisada.current === aviso.clave) return;
      avisada.current = aviso.clave;
      toast(aviso.texto, {
        id,
        duration: Number.POSITIVE_INFINITY,
        action:
          aviso.tipo === "evaluada"
            ? { label: VER_EVALUACION, onClick: () => router.refresh() }
            : { label: IR_A_LA_COLA, onClick: () => router.push(colaHref) },
      });
    },
  });
  return null;
}
