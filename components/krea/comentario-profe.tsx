import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Comentario del profe (D445): caja `bg-accent-soft` con `Sparkles`, rótulo `text-small-b` y el
 * texto tal como se escribió (saltos de línea y palabras largas que no desbordan a 320). La usan
 * cada pregunta del Detalle de nota y el comentario general (alumno y «Solo ver» del profe).
 */
export function ComentarioProfe({
  titulo,
  texto,
  className,
}: {
  titulo: string;
  texto: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "icono-linea flex gap-2.5 rounded-nav bg-accent-soft px-3.5 py-3 text-callout text-text",
        className,
      )}
    >
      <Sparkles
        aria-hidden="true"
        className="size-5 shrink-0 text-accent-ink"
      />
      <div className="min-w-0 flex-1">
        <p className="text-small-b">{titulo}</p>
        <p className="whitespace-pre-wrap break-words">{texto}</p>
      </div>
    </div>
  );
}
