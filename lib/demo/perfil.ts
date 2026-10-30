// Props de ejemplo de Perfil para la vista previa (D066, D069). Las reales salen de Firestore (fase 07).

import {
  alumnoPorCedula,
  CEDULA_DEMO,
  type DemoAlumno,
  equipoDe,
  nombreCompleto,
} from "@/lib/demo/seed";
import type { DicebearEstilo } from "@/lib/dicebear";
import {
  baseChipTexto,
  capitanChipTexto,
  cedulaTexto,
  partirNombre,
} from "@/lib/perfil";

export function perfilDe(alumno: DemoAlumno = alumnoPorCedula(CEDULA_DEMO)) {
  const equipo = equipoDe(alumno);
  const [primerNombre, segundoNombre] = partirNombre(alumno.nombres);
  const [primerApellido, segundoApellido] = partirNombre(alumno.apellidos);
  return {
    nombre: nombreCompleto(alumno),
    // PLACEHOLDER: estilo de avatar (lo elige el alumno; fila 60)
    estilo: "adventurer-neutral" as DicebearEstilo,
    seed: alumno.cedula,
    cedula: cedulaTexto(alumno.cedula),
    seccion: `Sección ${alumno.seccion}`,
    // El género no está en el seed (D075): "Capitán" por defecto
    capitan:
      equipo && equipo.capitanCedula === alumno.cedula
        ? capitanChipTexto(equipo.id)
        : undefined,
    base: baseChipTexto(alumno.base),
    campos: [
      { id: "primer-nombre", label: "Primer nombre", valor: primerNombre },
      { id: "segundo-nombre", label: "Segundo nombre", valor: segundoNombre },
      {
        id: "primer-apellido",
        label: "Primer apellido",
        valor: primerApellido,
      },
      {
        id: "segundo-apellido",
        label: "Segundo apellido",
        valor: segundoApellido,
      },
    ],
  };
}
