import { Ranking } from "@/components/sections/ranking/ranking";
import {
  AHORA_DEMO,
  equipoIdDemo,
  itemsEquipos,
  itemsEstudiantes,
  movimientosDe,
} from "@/lib/demo/ranking";
import { CEDULA_DEMO } from "@/lib/demo/seed";
import type { Vista } from "@/lib/ranking-vista";

// Las pestañas Estudiantes | Equipos son enlaces entre rutas (D095): `/ranking` y `/ranking/equipos`.
const ENLACES = { estudiantes: "/ranking", equipos: "/ranking/equipos" };

/**
 * Ranking del estudiante (HANDOFF §3; la sección 5A, «tú» = Yeilin Duarte, D069). El chip
 * «En vivo» móvil lo pone la topbar de la ruta (D128). Compartido por las dos rutas.
 */
export function RankingEstudiante({ vista }: { vista: Vista }) {
  const items =
    vista === "estudiantes"
      ? itemsEstudiantes("5A", CEDULA_DEMO)
      : itemsEquipos("5A", equipoIdDemo());
  return (
    <Ranking
      rol="estudiante"
      seccion="5A"
      vista={vista}
      items={items}
      movimientos={movimientosDe(items)}
      ahora={AHORA_DEMO}
      enlaces={{ vista: ENLACES }}
    />
  );
}
