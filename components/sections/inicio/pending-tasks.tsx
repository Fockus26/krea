import {
  ChevronRight,
  Clock,
  Crown,
  Gift,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/krea/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardList,
  CardListItem,
  CardTitle,
} from "@/components/ui/card";
import { type AvanceEntrega, avanceTexto } from "@/lib/inicio";
import { pendientesTexto, tipoTareaTexto } from "@/lib/sections";

export type FilaPendiente = {
  id: string;
  href: string;
  titulo: string;
  tipo: "individual" | "grupal";
  /** Ya formateada: «dd/mm/aaaa» o, con hora, «dd/mm/aaaa · 3:30 p. m.» (D355). */
  vence: string;
  /** Ya pasó su fecha y hora (D357): la meta dice «venció» en vez de «vence». */
  vencida?: boolean;
  premio?: string;
  /** Grupal y el alumno es el capitán: chip "Entregas tú" (D012). */
  entregasTu?: boolean;
  avance: AvanceEntrega;
};

/**
 * "Por entregar" de Inicio (HANDOFF §3 Inicio §4): h2 + chip warn con el total. Filas enlace con
 * título, meta (tipo y "vence dd/mm/aaaa") y chips (premio, "Entregas tú", avance). Vacío:
 * "¡Todo entregado!" (lienzo Vacíos).
 */
export function PendingTasks({ filas }: { filas: readonly FilaPendiente[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle level={2}>Por entregar</CardTitle>
        {filas.length > 0 ? (
          <Badge variant="warn">
            <Clock aria-hidden="true" />
            {pendientesTexto(filas.length)}
          </Badge>
        ) : null}
      </CardHeader>
      {filas.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="¡Todo entregado!"
          description="Cuando tu profe publique una tarea nueva, aparece aquí."
        />
      ) : (
        <CardList>
          {filas.map((f) => {
            const Icon = f.tipo === "grupal" ? Users : User;
            return (
              <CardListItem key={f.id} asChild>
                <Link href={f.href} className="items-start">
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <h3 className="text-h4 text-text">{f.titulo}</h3>
                    <span className="text-small flex icono-linea gap-1.5 text-text-2">
                      <Icon aria-hidden="true" className="size-4 shrink-0" />
                      <span>
                        {tipoTareaTexto(f.tipo)} ·{" "}
                        {f.vencida ? "venció" : "vence"} {f.vence}
                      </span>
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      {f.premio ? (
                        <Badge
                          variant="prize"
                          className="h-auto whitespace-normal"
                        >
                          <Gift aria-hidden="true" />
                          {f.premio}
                        </Badge>
                      ) : null}
                      {f.entregasTu ? (
                        <Badge variant="cap">
                          <Crown aria-hidden="true" />
                          Entregas tú
                        </Badge>
                      ) : null}
                      <Badge variant="warn">
                        <Clock aria-hidden="true" />
                        {avanceTexto(f.avance)}
                      </Badge>
                    </span>
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    className="mt-1 size-5 shrink-0 text-text-2"
                  />
                </Link>
              </CardListItem>
            );
          })}
        </CardList>
      )}
    </Card>
  );
}
