import { Check, ChevronRight, Inbox, User, Users } from "lucide-react";
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
import { tipoTareaTexto } from "@/lib/sections";

export type FilaEntregada = {
  id: string;
  href: string;
  titulo: string;
  tipo: "individual" | "grupal";
  /** "entregada el 25/10/2026". */
  fecha: string;
};

/** "Entregadas" de /tareas (HANDOFF §3): filas con chip Entregada y la fecha. */
export function DeliveredTasks({ filas }: { filas: readonly FilaEntregada[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle level={2}>Entregadas</CardTitle>
      </CardHeader>
      {filas.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Aún no has entregado tareas"
          description="Cuando envíes una, aparece aquí con su fecha."
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
                        {tipoTareaTexto(f.tipo)} · {f.fecha}
                      </span>
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      <Badge variant="ok">
                        <Check aria-hidden="true" />
                        Entregada
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
