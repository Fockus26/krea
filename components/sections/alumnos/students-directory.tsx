"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/krea/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  busquedaVacia,
  contadorTexto,
  type FilaAlumno,
  filtrarAlumnos,
  otraSeccion,
  type SeccionAlumnos,
} from "@/lib/alumnos";
import { StudentFilters } from "./student-filters";
import { StudentsTable } from "./students-table";

/**
 * Filtros + tabla (HANDOFF §3 Alumnos). Recibe la lista completa por props; la sección y la
 * búsqueda filtran en cliente. "Guardar" actualiza el estado local (sin Firestore: fase 07).
 * Búsqueda sin resultados: vacío con «Buscar en {otra sección}» si allí hay coincidencias (D170).
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
  const vacia =
    visibles.length === 0 && consulta.trim() !== ""
      ? busquedaVacia(
          consulta,
          seccion,
          filtrarAlumnos(
            filas.filter((a) => a.seccion === otraSeccion(seccion)),
            consulta,
          ).length,
        )
      : null;

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
      {vacia ? (
        <Card>
          <EmptyState
            icon={Search}
            headingLevel={2}
            title={vacia.titulo}
            description={vacia.descripcion}
            action={
              vacia.otra ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => vacia.otra && setSeccion(vacia.otra)}
                >
                  Buscar en {vacia.otra}
                </Button>
              ) : null
            }
          />
        </Card>
      ) : (
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
      )}
    </>
  );
}
