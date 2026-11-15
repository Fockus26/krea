import "server-only";
// Lecturas de la entrega ideal en el servidor (tanda 11-14 Z2, D433): detrás de la sesión, una vez
// por request (`cache`). El alumno solo llega a la ideal de una tarea de SU sección ya cerrada
// (`idealDelAlumno` decide con la sección de su perfil); el profe ve la de cualquier tarea.
import { cache } from "react";
import { exigirSesion } from "@/lib/dal";
import {
  type IdealDelAlumno,
  idealDelAlumno,
  leerIdeal,
} from "@/lib/data/ideales";
import { db } from "@/lib/datos/comun";
import { alumnoActual } from "@/lib/datos/estudiante";
import type { Ideal } from "@/lib/ideal";

/** La ideal guardada de la tarea, para el profe (vigente o no). */
export const idealProfe = cache(
  async (tareaId: string): Promise<Ideal | null> => {
    await exigirSesion("profesor");
    return leerIdeal(db(), tareaId);
  },
);

/** La ideal que puede ver el alumno de la sesión, o `null` (abierta, otra sección, caducada…). */
export const idealAlumno = cache(
  async (tareaId: string): Promise<IdealDelAlumno | null> => {
    const { seccion } = await alumnoActual();
    return idealDelAlumno(db(), seccion, tareaId);
  },
);
