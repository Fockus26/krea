import "server-only";
// Lecturas de la entrega ideal en el servidor (tanda 11-14 Z2, D433): detrás de la sesión, una vez
// por request (`cache`). El alumno solo llega a la ideal de una tarea de SU sección ya cerrada
// (`idealDelAlumno` decide con la sección de su perfil); el profe ve la de cualquier tarea.
// Dos sabores (D436): `idealProfe`/`idealAlumno` son el complemento de otra página (lista de
// entregas, detalle de la tarea) y, si la lectura falla, dan `null` sin tumbarla; las páginas de
// la ideal misma usan `…Pagina`, que deja caer el error (la ideal ES su contenido).
import { cache } from "react";
import { exigirSesion } from "@/lib/dal";
import {
  type IdealDelAlumno,
  idealDelAlumno,
  leerIdeal,
} from "@/lib/data/ideales";
import { db, opcional } from "@/lib/datos/comun";
import { alumnoActual } from "@/lib/datos/estudiante";
import type { Ideal } from "@/lib/ideal";

/** La ideal guardada de la tarea, para el profe (vigente o no). Un fallo de la lectura lanza. */
export const idealProfePagina = cache(
  async (tareaId: string): Promise<Ideal | null> => {
    await exigirSesion("profesor");
    return leerIdeal(db(), tareaId);
  },
);

/** Igual que `idealProfePagina`, como complemento: si la lectura falla, `null`. */
export const idealProfe = cache(
  async (tareaId: string): Promise<Ideal | null> => {
    await exigirSesion("profesor");
    return opcional("ideal (profe)", () => leerIdeal(db(), tareaId), null);
  },
);

/**
 * La ideal que puede ver el alumno de la sesión, o `null` (abierta, otra sección, caducada…). Un
 * fallo de la lectura lanza.
 */
export const idealAlumnoPagina = cache(
  async (tareaId: string): Promise<IdealDelAlumno | null> => {
    const { seccion } = await alumnoActual();
    // Después de la sesión (nunca en el prerender): vencida sin prórrogas = cerrada (D453)
    return idealDelAlumno(db(), seccion, tareaId, Date.now());
  },
);

/** Igual que `idealAlumnoPagina`, como complemento: si la lectura falla, `null`. */
export const idealAlumno = cache(
  async (tareaId: string): Promise<IdealDelAlumno | null> => {
    const { seccion } = await alumnoActual();
    return opcional(
      "ideal (alumno)",
      () => idealDelAlumno(db(), seccion, tareaId),
      null,
    );
  },
);
