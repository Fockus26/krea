import { Minus, Plus, Scale } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/krea/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardList,
  CardListItem,
  CardTitle,
} from "@/components/ui/card";
import { ajusteMetaTexto, chipAjuste, type SeccionPanel } from "@/lib/panel";

export type FilaAjuste = {
  id: string;
  seccion: SeccionPanel;
  /** "Jorge Quintero" o "Equipo 5A-G3 Ropa". */
  nombre: string;
  valor: number;
  motivo: string;
  /** ISO local (`DemoAjuste.fecha`). */
  fecha: string;
};

/**
 * "Últimos ajustes" del Panel (HANDOFF §3 Panel §3): chip ±valor `ok`/`err` con Plus/Minus, nombre (`h3` con
 * aspecto h4), motivo y fecha. Un ajuste mueve puntos del ranking, nunca la nota (D007): el chip dice "pts" y el
 * signo va en el ícono y en el texto para lectores, no solo en el color.
 */
export function RecentAdjustments({ filas }: { filas: readonly FilaAjuste[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle level={2}>Últimos ajustes</CardTitle>
        <Button asChild variant="secondary" size="sm">
          <Link href="/profe/puntos">
            <Plus aria-hidden="true" />
            Nuevo ajuste
          </Link>
        </Button>
      </CardHeader>
      {filas.length === 0 ? (
        <EmptyState
          icon={Scale}
          title="Sin ajustes recientes"
          description="Los puntos que sumes o restes por conducta aparecen aquí, con su motivo."
        />
      ) : (
        <CardList>
          {filas.map((f) => {
            const chip = chipAjuste(f.valor);
            const Signo = chip.signo === "mas" ? Plus : Minus;
            return (
              <CardListItem key={f.id} className="items-start">
                <Badge
                  variant={chip.signo === "mas" ? "ok" : "err"}
                  className="min-w-13 justify-center nums"
                >
                  <Signo aria-hidden="true" />
                  <span aria-hidden="true">{chip.texto}</span>
                  <span className="sr-only">{chip.accesible}</span>
                </Badge>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <h3 className="text-h4 break-words text-text">{f.nombre}</h3>
                  <p className="text-small break-words text-text-2">
                    {ajusteMetaTexto(f.motivo, f.fecha)}
                  </p>
                </div>
              </CardListItem>
            );
          })}
        </CardList>
      )}
    </Card>
  );
}
