// Títulos de la topbar móvil que dependen de datos (D128), por ruta exacta. Los arma el layout de
// cada grupo en el servidor y viajan al cliente (`RouteTopBar`) como objeto serializable; la fase 07
// cambia la fuente (Firestore), no la forma. Las claves usan los ids de lib/demo: si una ruta
// dinámica de las olas 2–3 usa otros, se ajusta aquí (si falta, la topbar usa su título de reserva).

import { COLA } from "@/lib/demo/evaluar";
import { TAREAS } from "@/lib/demo/tareas";
import { tituloEntrega } from "@/lib/evaluar";
import type { Rol } from "@/lib/layout";
import type { TitulosTopbar } from "@/lib/topbar";

/** Copy del lienzo (Tarea.dc.html) y de la vista /secciones/tareas. */
const TIPO_TAREA = {
  individual: "Tarea individual",
  grupal: "Tarea grupal",
} as const;

export function titulosTopbar(rol: Rol): TitulosTopbar {
  if (rol === "profesor") {
    return Object.fromEntries([
      ...COLA.map((e, i) => [
        `/profe/evaluar/${e.id}`,
        tituloEntrega(i, COLA.length),
      ]),
      // Constructor de una tarea existente: su título. El borrador queda con «Nueva tarea» (lienzo, D152)
      ...TAREAS.map((t) => [`/profe/tareas/${t.id}`, t.titulo]),
    ]);
  }
  return Object.fromEntries(
    TAREAS.flatMap((t) => [
      [`/notas/${t.id}`, t.titulo],
      [`/tareas/${t.id}`, TIPO_TAREA[t.tipo]],
    ]),
  );
}
