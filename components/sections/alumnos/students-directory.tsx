"use client";

import { useState } from "react";
import {
  contadorTexto,
  type FilaAlumno,
  filtrarAlumnos,
  type SeccionAlumnos,
} from "@/lib/alumnos";
import { StudentFilters } from "./student-filters";
import { StudentsTable } from "./students-table";

/**
 * Filtros + tabla (HANDOFF §3 Alumnos). Recibe la lista completa por props; la sección y la
 * búsqueda filtran en cliente. "Guardar" actualiza el estado local (sin Firestore: fase 07).
 */
export function StudentsDirectory({
  alumnos,
  seccionInicial = "5A",
}: {
  alumnos: readonly FilaAlumno[];
  seccionInicial?: SeccionAlumnos;
}) {
  const [filas, setFilas] = useState<readonly FilaAlumno[]>(alumnos);
  const [seccion, setSeccion] = useState<SeccionAlumnos>(seccionInicial);
  const [consulta, setConsulta] = useState("");

  const conteos: Record<SeccionAlumnos, number> = {
    "5A": filas.filter((a) => a.seccion === "5A").length,
    "5C": filas.filter((a) => a.seccion === "5C").length,
  };
  const visibles = filtrarAlumnos(
    filas.filter((a) => a.seccion === seccion),
    consulta,
  );

  return (
    <>
      <StudentFilters
        seccion={seccion}
        onSeccion={setSeccion}
        conteos={conteos}
        consulta={consulta}
        onConsulta={setConsulta}
        contador={contadorTexto(visibles.length, consulta, seccion)}
      />
      <StudentsTable
        seccion={seccion}
        filas={visibles}
        consulta={consulta}
        onGuardar={(cedula, cambios) =>
          setFilas((actuales) =>
            actuales.map((a) =>
              a.cedula === cedula ? { ...a, ...cambios } : a,
            ),
          )
        }
      />
    </>
  );
}
