"use client";
// Aviso «otro profe está evaluando esta entrega» (pedido 8, D408–D410) como toast (D450). Reutiliza
// la presencia de «Editar alumno» (D275–D277): mientras la pantalla está abierta marca la entrada
// propia y, cuando llega otro profe, lanza un toast con el aviso. Ambos lo ven: el que llega ve al
// que estaba en su primer sondeo; el que estaba ve al que llega en el siguiente. Un toast por
// llegada (no en cada sondeo; quien se va y vuelve en la misma visita no se repite) y nada si se van.
// El Toaster ya es región viva (D131): no hay otro `aria-live` que lo anuncie dos veces. No bloquea:
// si el otro guarda antes, Guardar responde `cambio` (D224). No pinta nada en la página.
import { UserPen } from "lucide-react";
import * as React from "react";
import {
  usePresenciaEntrega,
  type YoPresencia,
} from "@/components/sections/alumnos/use-presencia";
import { toast } from "@/components/ui/sonner";
import {
  AVISO_PRESENCIA_MS,
  avisoPresenciaEntrega,
  llegadasPresencia,
  presenciaEvaluarTexto,
} from "@/lib/presencia";

export function PresenciaEvaluar({
  entregaId,
  yo,
}: {
  entregaId: string;
  /** El profe que mira: su cédula y cómo lo ven los demás (`nombrePresencia`). */
  yo: YoPresencia;
}) {
  const otros = usePresenciaEntrega(yo, entregaId);
  // Quiénes ya avisaron en esta visita (el montaje lleva `key={entregaId}`)
  const vistos = React.useRef(new Set<string>());

  React.useEffect(() => {
    const nuevos = llegadasPresencia(vistos.current, otros);
    if (nuevos.length === 0) return;
    for (const e of nuevos) vistos.current.add(e.profeId);
    toast(avisoPresenciaEntrega(presenciaEvaluarTexto(nuevos)), {
      duration: AVISO_PRESENCIA_MS,
      icon: <UserPen aria-hidden="true" />,
    });
  }, [otros]);

  return null;
}
