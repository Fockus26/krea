import { Calendar, ListChecks, User, Users } from "lucide-react";
import { StatusBadge } from "@/components/krea/status-badge";
import { Badge } from "@/components/ui/badge";

/**
 * Encabezado de la entrega (HANDOFF §3 Tareas y entrega): eyebrow tipo + equipo, el `<h1>` y
 * chips (Calendar "Vence…", "20 pts · 5 preguntas" y el estado, siempre con ícono + palabra).
 */
export function TaskHeader({
  tipo,
  eyebrow,
  titulo,
  vence,
  puntos,
  entregada,
}: {
  tipo: "individual" | "grupal";
  eyebrow: string;
  titulo: string;
  /** "Vence 30/10/2026". */
  vence: string;
  /** "20 pts · 5 preguntas". */
  puntos: string;
  entregada: boolean;
}) {
  const Icon = tipo === "grupal" ? Users : User;
  return (
    <header className="flex flex-col gap-2">
      <p className="text-eyebrow flex icono-linea gap-1.5 text-text-2">
        <Icon aria-hidden="true" className="size-4 shrink-0" />
        {eyebrow}
      </p>
      <h1 className="text-h1 text-text">{titulo}</h1>
      <div className="mt-1 flex flex-wrap gap-1.5">
        <Badge variant="neutral">
          <Calendar aria-hidden="true" />
          {vence}
        </Badge>
        <Badge variant="neutral">
          <ListChecks aria-hidden="true" />
          {puntos}
        </Badge>
        <StatusBadge status={entregada ? "entregada" : "por-entregar"} />
      </div>
    </header>
  );
}
