import { Gift } from "lucide-react";
import type { TipoTareaId } from "@/lib/modelo";
import { premioParaTexto } from "@/lib/premios";

/**
 * Premio de una tarea (HANDOFF §3 Tareas y entrega): tarjeta plana con fondo
 * `--prize-card-bg` (secundario 22 %), cuadro 44 `--secondary` con Gift, la línea fija y el
 * nombre del premio (tamaño h4, que envuelve). Grupal o individual (D263). Con foto (D265: URL
 * firmada que da la página) va debajo, con `alt` = el premio.
 */
export function PrizeCard({
  premio,
  tipo = "grupal",
  fotoUrl,
}: {
  premio: string;
  tipo?: TipoTareaId;
  fotoUrl?: string | null;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md bg-prize-card p-4 text-text">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-nav bg-secondary text-on-secondary">
          <Gift aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-small text-text">{premioParaTexto(tipo)}</p>
          <p className="text-h4 text-text">{premio}</p>
        </div>
      </div>
      {fotoUrl ? (
        // biome-ignore lint/performance/noImgElement: URL firmada de B2 de vida corta (D046, D212)
        <img
          src={fotoUrl}
          alt={premio}
          loading="lazy"
          decoding="async"
          className="aspect-video w-full max-w-md rounded-md bg-surface-2 object-cover"
        />
      ) : null}
    </div>
  );
}
