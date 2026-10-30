import { NotebookPen } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/krea/empty-state";
import { GradeRow } from "@/components/sections/shared/grade-row";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardList, CardTitle } from "@/components/ui/card";

export type FilaNota = {
  id: string;
  href: string;
  titulo: string;
  tipo: "individual" | "grupal";
  /** Equipo en las grupales. */
  detalle?: string;
  fecha: string;
  nota: number | null;
  base?: number;
};

/** "Mis notas" de Inicio (HANDOFF §3 Inicio §3): h2 + "Ver todas" y filas `GradeRow`. */
export function RecentGrades({
  filas,
  verTodasHref,
  tareasHref,
}: {
  filas: readonly FilaNota[];
  verTodasHref: string;
  /** Acción del vacío ("Ver tareas por entregar"). */
  tareasHref: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle level={2}>Mis notas</CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link href={verTodasHref}>Ver todas</Link>
        </Button>
      </CardHeader>
      {filas.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="Aún no tienes notas"
          description="Aparecen aquí cuando tu profe evalúe tu primera entrega."
          action={
            <Button asChild variant="secondary" size="sm">
              <Link href={tareasHref}>Ver tareas por entregar</Link>
            </Button>
          }
        />
      ) : (
        <CardList>
          {filas.map(({ id, ...fila }) => (
            <GradeRow key={id} {...fila} />
          ))}
        </CardList>
      )}
    </Card>
  );
}
