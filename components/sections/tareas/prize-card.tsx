import { Gift, Trophy } from "lucide-react";
import type { TipoTareaId } from "@/lib/modelo";
import { PREMIO_GANADO_TEXTO, premioParaTexto } from "@/lib/premios";

/**
 * Premio de una tarea (HANDOFF §3 Tareas y entrega): tarjeta plana con fondo
 * `--prize-card-bg` (secundario 22 %), cuadro 44 `--secondary` con Gift, la línea fija y el
 * nombre del premio (tamaño h4, que envuelve). Grupal o individual (D263). Con foto (D265: URL
 * firmada que da la página) va debajo, con `alt` = el premio. `ganado` (D527, detalle de la nota
 * de una individual): Trophy, como en «Premios ganados», y «¡Ganaste el premio!» en vez de la
 * línea fija.
 */
export function PrizeCard({
  premio,
  tipo = "grupal",
  fotoUrl,
  ganado = false,
}: {
  premio: string;
  tipo?: TipoTareaId;
  fotoUrl?: string | null;
  ganado?: boolean;
}) {
  const Icono = ganado ? Trophy : Gift;
  return (
    <div className="flex flex-col gap-3 rounded-md bg-prize-card p-4 text-text">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-nav bg-secondary text-on-secondary">
          <Icono aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0">
          <p
            className={
              ganado ? "text-small-b text-text" : "text-small text-text"
            }
          >
            {ganado ? PREMIO_GANADO_TEXTO : premioParaTexto(tipo)}
          </p>
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
