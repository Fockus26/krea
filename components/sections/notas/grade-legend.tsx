import { TriangleAlert } from "lucide-react";
import { GradePill } from "@/components/krea/grade-pill";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { escalaDegradado, MARCA_10_PCT } from "@/lib/notas";

/**
 * Leyenda de Mis notas (HANDOFF §3 Mis notas §2): barra de 16 px con el degradado de
 * `gradeColor` (calculado, D004), marcas 1 / 10 / 20 (el 10 al 47,4 %) y las dos claves:
 * Raspado y Pendiente. La barra es una imagen con su texto; las marcas repiten lo visible.
 */
export function GradeLegend() {
  return (
    <Card>
      <CardTitle level={2} className="text-h4 mb-3">
        Cómo leer los colores
      </CardTitle>
      <div
        role="img"
        aria-label="Escala de color: 1 rojo, 10 amarillo, 20 verde"
        className="h-4 rounded-pill"
        style={{ backgroundImage: escalaDegradado() }}
      />
      <div
        aria-hidden="true"
        className="text-small-b nums relative mt-1.5 h-5 text-text"
      >
        <span className="absolute left-0">1</span>
        <span
          className="absolute -translate-x-1/2"
          style={{ left: `${MARCA_10_PCT}%` }}
        >
          10
        </span>
        <span className="absolute right-0">20</span>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        <li className="text-small flex flex-wrap items-center gap-2 text-text">
          <Badge variant="err">
            <TriangleAlert aria-hidden="true" />
            Raspado
          </Badge>
          menos de 10: no suma puntos al ranking
        </li>
        <li className="text-small flex flex-wrap items-center gap-2 text-text">
          <GradePill nota={null} size="sm" />
          sin entregar o sin evaluar
        </li>
      </ul>
    </Card>
  );
}
