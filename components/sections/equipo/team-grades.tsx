import { Gift } from "lucide-react";
import type { FilaNota } from "@/components/sections/inicio/recent-grades";
import { GradeRow } from "@/components/sections/shared/grade-row";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardList, CardTitle } from "@/components/ui/card";

/**
 * "Notas del equipo" (HANDOFF §3 Mi equipo §3): las mismas `GradeRow` de Inicio y Mis notas
 * (§8); las pendientes con premio llevan el chip "En juego: {premio}" (envuelve a 320).
 */
export function TeamGrades({
  filas,
}: {
  filas: ReadonlyArray<FilaNota & { enJuego?: string }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle level={2}>Notas del equipo</CardTitle>
      </CardHeader>
      {filas.length === 0 ? (
        <p className="text-body py-4 text-text-2">
          Todavía no hay tareas grupales.
        </p>
      ) : (
        <CardList>
          {filas.map(({ id, enJuego, ...fila }) => (
            <GradeRow
              key={id}
              {...fila}
              chips={
                enJuego ? (
                  <Badge variant="prize" className="h-auto whitespace-normal">
                    <Gift aria-hidden="true" />
                    {enJuego}
                  </Badge>
                ) : undefined
              }
            />
          ))}
        </CardList>
      )}
    </Card>
  );
}
