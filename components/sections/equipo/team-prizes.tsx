import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export type PremioGanado = {
  id: string;
  premio: string;
  /** "Mejor nota en {tarea} · 19". */
  detalle: string;
};

/**
 * "Premios ganados" (HANDOFF §3 Mi equipo §3): h2 + chip cap con el total; por premio, cuadro 56
 * `--secondary` con Trophy, el premio (tamaño h4) y "Mejor nota en {tarea} · nota".
 */
export function TeamPrizes({ premios }: { premios: readonly PremioGanado[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle level={2}>Premios ganados</CardTitle>
        <Badge variant="cap" className="nums">
          {premios.length}
          <span className="sr-only">
            {premios.length === 1 ? " premio" : " premios"}
          </span>
        </Badge>
      </CardHeader>
      {premios.length === 0 ? (
        <p className="text-body text-text-2">
          Todavía no han ganado premios. La próxima tarea grupal puede ser.
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-4 p-0">
          {premios.map((p) => (
            <li key={p.id} className="flex items-center gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-done bg-secondary text-on-secondary">
                <Trophy aria-hidden="true" className="size-8" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-h4 text-text">{p.premio}</h3>
                <p className="text-small text-text-2">{p.detalle}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
