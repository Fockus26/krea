// Props de ejemplo de Alumnos para la vista previa (D066, D069). Las reales salen de Firestore (fase 07).
import type { FilaAlumno } from "@/lib/alumnos";
import { ALUMNOS, equipoDe, puntosAlumno } from "@/lib/demo/seed";

/** PLACEHOLDER (HANDOFF §8; fila 83): el seed trae base 20 para todos; el lienzo enseña a Jailyn Martínez con base 15. */
const CEDULA_BASE_EJEMPLO = "37575127";
const BASE_EJEMPLO = 15;

/** Los 69 alumnos del seed (5A y 5C) con la fila ya resuelta. */
export function alumnosVista(): FilaAlumno[] {
  return ALUMNOS.map((a) => ({
    cedula: a.cedula,
    seccion: a.seccion,
    nombres: a.nombres,
    apellidos: a.apellidos,
    equipo: equipoDe(a)?.nombre ?? null,
    base: a.cedula === CEDULA_BASE_EJEMPLO ? BASE_EJEMPLO : a.base,
    nota: a.notaIndividual,
    puntos: puntosAlumno(a),
    // PLACEHOLDER: el estilo de avatar lo elige cada alumno (fila 60 del checklist)
    estilo: "adventurer-neutral",
  }));
}
