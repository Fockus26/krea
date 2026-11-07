import { TriangleAlert } from "lucide-react";
import { GradePill } from "@/components/krea/grade-pill";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import {
  escalaDegradado,
  MARCA_10_PCT,
  marcaTuTexto,
  posicionEnEscala,
} from "@/lib/notas";

/**
 * Leyenda de Mis notas (HANDOFF §3 Mis notas §2): barra de 16 px con el degradado de
 * `gradeColor` (calculado, D004), marcas 1 / 10 / 20 (el 10 al 47,4 %) y las dos claves:
 * Raspado y Pendiente. La barra es una imagen con su texto; las marcas repiten lo visible.
 * Con `promedio` (D273) una marca vertical cruza la barra donde está el alumno y debajo va «Tú: 15,5»:
 * texto y forma, nunca solo color; el valor también va en el `aria-label` de la barra. Sin promedio
 * (`null`/ausente: nada evaluado) no hay marca.
 */
export function GradeLegend({ promedio }: { promedio?: number | null }) {
  const pct = promedio == null ? null : posicionEnEscala(promedio);
  return (
    <Card>
      <CardTitle level={2} className="text-h4 mb-3">
        Cómo leer los colores
      </CardTitle>
      <div className="relative">
        <div
          role="img"
          aria-label={`Escala de color: 1 rojo, 10 amarillo, 20 verde${promedio == null ? "" : `. ${marcaTuTexto(promedio)}`}`}
          className="h-4 rounded-pill"
          style={{ backgroundImage: escalaDegradado() }}
        />
        {pct === null ? null : (
          <span
            aria-hidden="true"
            data-slot="marca-tu"
            className="absolute -top-1 -bottom-1 w-1 -translate-x-1/2 rounded-pill bg-text ring-2 ring-surface"
            style={{ left: `${pct}%` }}
          />
        )}
      </div>
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
      {pct === null || promedio == null ? null : (
        <div aria-hidden="true" className="relative h-6">
          <span
            className={`text-small-b nums absolute top-0 whitespace-nowrap rounded-pill border border-divider bg-surface-2 px-2 text-text ${
              pct < 12
                ? ""
                : pct > 88
                  ? "-translate-x-full"
                  : "-translate-x-1/2"
            }`}
            style={{ left: `${pct}%` }}
          >
            {marcaTuTexto(promedio)}
          </span>
        </div>
      )}
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
