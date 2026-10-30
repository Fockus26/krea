import { Gift } from "lucide-react";

/**
 * Premio de una tarea grupal (HANDOFF §3 Tareas y entrega): tarjeta plana con fondo
 * `--prize-card-bg` (secundario 22 %), cuadro 44 `--secondary` con Gift, la línea fija y el
 * nombre del premio (tamaño h4, que envuelve).
 */
export function PrizeCard({ premio }: { premio: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md bg-prize-card p-4 text-text">
      <span className="grid size-11 shrink-0 place-items-center rounded-nav bg-secondary text-on-secondary">
        <Gift aria-hidden="true" className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-small text-text">
          Premio para el equipo con mejor nota
        </p>
        <p className="text-h4 text-text">{premio}</p>
      </div>
    </div>
  );
}
