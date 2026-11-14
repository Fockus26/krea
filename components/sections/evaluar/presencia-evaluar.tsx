"use client";
// Aviso «otro profe está evaluando esta entrega» (pedido 8, D408–D410). Reutiliza la presencia de
// «Editar alumno» (D275–D277): mientras la pantalla está abierta marca la entrada propia y avisa si
// hay otros. No bloquea nada: si el otro guarda antes, Guardar responde `cambio` (D224). Sin otros
// profes no pinta nada visible ni reserva espacio (el `output` es `sr-only`, fuera del flujo).
import { UserPen } from "lucide-react";
import {
  usePresenciaEntrega,
  type YoPresencia,
} from "@/components/sections/alumnos/use-presencia";
import { avisoPresenciaEntrega, presenciaEvaluarTexto } from "@/lib/presencia";

export function PresenciaEvaluar({
  entregaId,
  yo,
}: {
  entregaId: string;
  /** El profe que mira: su cédula y cómo lo ven los demás (`nombrePresencia`). */
  yo: YoPresencia;
}) {
  const otros = presenciaEvaluarTexto(usePresenciaEntrega(yo, entregaId));
  const aviso = avisoPresenciaEntrega(otros);
  return (
    <>
      {/* Se anuncia una vez por cambio de quién evalúa (no con cada latido): el texto no cambia */}
      <output className="sr-only" aria-live="polite">
        {aviso}
      </output>
      {aviso ? (
        <p
          aria-hidden="true"
          className="flex icono-linea gap-2 rounded-sm bg-accent-soft-2 px-3 py-2 text-small text-text"
        >
          <UserPen
            aria-hidden="true"
            className="size-4 shrink-0 text-accent-ink"
          />
          <span>{aviso}</span>
        </p>
      ) : null}
    </>
  );
}
