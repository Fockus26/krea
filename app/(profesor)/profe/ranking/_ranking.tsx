import { Ranking } from "@/components/sections/ranking/ranking";
import {
  AHORA_DEMO,
  itemsEquipos,
  itemsEstudiantes,
  movimientosDe,
} from "@/lib/demo/ranking";
import type { SeccionRanking, Vista } from "@/lib/ranking-vista";

const RUTA = "/profe/ranking";

/** Ruta de cada uno de los 6 estados del profesor (5A/5C × estudiantes/equipos; D157). */
const href = (seccion: SeccionRanking, vista: Vista) =>
  `${RUTA}${seccion === "5C" ? "/5c" : ""}${vista === "equipos" ? "/equipos" : ""}`;

/**
 * Ranking del profesor (HANDOFF §3): sin fila «tú», con el segmentado 5A | 5C. Las pestañas y la
 * sección son enlaces entre rutas (D095, D157). El chip «En vivo» móvil lo pone la topbar (D128).
 */
export function RankingProfe({
  seccion,
  vista,
}: {
  seccion: SeccionRanking;
  vista: Vista;
}) {
  const items =
    vista === "estudiantes"
      ? itemsEstudiantes(seccion, null)
      : itemsEquipos(seccion, null);
  return (
    <Ranking
      rol="profesor"
      seccion={seccion}
      vista={vista}
      items={items}
      movimientos={movimientosDe(items)}
      ahora={AHORA_DEMO}
      enlaces={{
        vista: {
          estudiantes: href(seccion, "estudiantes"),
          equipos: href(seccion, "equipos"),
        },
        seccion: { "5A": href("5A", vista), "5C": href("5C", vista) },
      }}
    />
  );
}
