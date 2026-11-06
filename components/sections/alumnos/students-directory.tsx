"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/krea/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  busquedaVacia,
  contadorEstadoTexto,
  contadorTexto,
  type EstadoAlumnos,
  type FilaAlumno,
  type FiltrosAlumnos,
  filtrarAlumnos,
  filtrarPorEstado,
  otraSeccion,
  rutaAlumnos,
  type SeccionAlumnos,
} from "@/lib/alumnos";
import type { EditarAlumno, ResultadoAlumno } from "@/lib/alumnos-datos";
import { StudentFilters } from "./student-filters";
import { StudentsTable } from "./students-table";

/**
 * Filtros + tabla (HANDOFF §3 Alumnos). Recibe la lista completa por props; la sección y la
 * búsqueda filtran en cliente. Con `guardar` (la Server Action, D209) «Guardar cambios» escribe en
 * Firestore y la fila cambia solo si se guardó; sin él (vista previa) solo cambia el estado local.
 * Búsqueda sin resultados: vacío con «Buscar en {otra sección}» si allí hay coincidencias (D170).
 * Sección, estado, tarea y ficha abierta se leen de la URL al entrar y la URL se actualiza al
 * cambiarlos con `history.replaceState` (sin recargar ni ensuciar el historial, D252).
 */
export function StudentsDirectory({
  alumnos,
  seccionInicial = "5A",
  guardar,
  filtrosIniciales = {},
  tarea,
}: {
  alumnos: readonly FilaAlumno[];
  seccionInicial?: SeccionAlumnos;
  guardar?: (entrada: EditarAlumno) => Promise<ResultadoAlumno>;
  /** Filtros ya validados que llegaron por la URL. */
  filtrosIniciales?: FiltrosAlumnos;
  /** La tarea de `filtrosIniciales.tarea`, con su título (si existe). */
  tarea?: { id: string; titulo: string };
}) {
  const [filas, setFilas] = useState<readonly FilaAlumno[]>(alumnos);
  // Con `alumno`, la lista se abre en la sección de ese alumno para que su fila sea visible.
  const seccionDelAlumno = alumnos.find(
    (a) => a.cedula === filtrosIniciales.alumno,
  )?.seccion;
  const [seccion, setSeccion] = useState<SeccionAlumnos>(
    seccionDelAlumno ?? filtrosIniciales.seccion ?? seccionInicial,
  );
  const [estado, setEstado] = useState<EstadoAlumnos | undefined>(
    filtrosIniciales.estado,
  );
  const [tareaId, setTareaId] = useState<string | undefined>(tarea?.id);
  const [alumnoAbierto, setAlumnoAbierto] = useState<string | undefined>(
    filtrosIniciales.alumno,
  );
  const [consulta, setConsulta] = useState("");

  // Refleja el filtro en la URL sin navegar. La búsqueda por texto no viaja (es efímera).
  function sincronizar(c: FiltrosAlumnos) {
    try {
      window.history.replaceState(window.history.state, "", rutaAlumnos(c));
    } catch {
      // Sin History API (entorno raro): la pantalla sigue funcionando.
    }
  }
  const actuales = (): FiltrosAlumnos => ({
    seccion,
    estado,
    tarea: tareaId,
    alumno: alumnoAbierto,
  });
  function cambiarSeccion(s: SeccionAlumnos) {
    setSeccion(s);
    sincronizar({ ...actuales(), seccion: s });
  }
  function quitarFiltro() {
    setEstado(undefined);
    setTareaId(undefined);
    sincronizar({ seccion, alumno: alumnoAbierto });
  }
  function cambiarAbierto(cedula: string, abierto: boolean) {
    const alumno = abierto ? cedula : undefined;
    setAlumnoAbierto(alumno);
    sincronizar({ ...actuales(), alumno });
  }
  const porEstado = (s: SeccionAlumnos) =>
    filtrarPorEstado(
      filas.filter((a) => a.seccion === s),
      estado,
      tareaId,
      alumnoAbierto,
    );

  const conteos: Record<SeccionAlumnos, number> = {
    "5A": porEstado("5A").length,
    "5C": porEstado("5C").length,
  };
  const visibles = filtrarAlumnos(porEstado(seccion), consulta);
  const contador =
    estado && consulta.trim() === ""
      ? contadorEstadoTexto(visibles.length, estado, seccion, tarea?.titulo)
      : contadorTexto(visibles.length, consulta, seccion);
  const vacia =
    visibles.length === 0 && consulta.trim() !== ""
      ? busquedaVacia(
          consulta,
          seccion,
          filtrarAlumnos(porEstado(otraSeccion(seccion)), consulta).length,
        )
      : null;

  return (
    <>
      <StudentFilters
        seccion={seccion}
        onSeccion={cambiarSeccion}
        conteos={conteos}
        consulta={consulta}
        onConsulta={setConsulta}
        contador={contador}
        filtroActivo={
          estado || tareaId
            ? { estado, tarea: tarea?.titulo, onQuitar: quitarFiltro }
            : undefined
        }
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
                  onClick={() => vacia.otra && cambiarSeccion(vacia.otra)}
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
          vacioTexto={
            estado && consulta.trim() === ""
              ? `${contador}. Quita el filtro para ver a todos.`
              : undefined
          }
          tarea={tareaId ? tarea : undefined}
          abierto={alumnoAbierto}
          onAbierto={cambiarAbierto}
          guardar={guardar}
          onGuardado={(cedula, cambios) =>
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
