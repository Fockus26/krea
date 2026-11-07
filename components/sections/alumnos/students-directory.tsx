"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/krea/empty-state";
import { PageHeader } from "@/components/sections/shared/page-header";
import {
  type CuentaCreada,
  PasswordTemporalDialog,
} from "@/components/sections/shared/password-temporal-dialog";
import { useSeleccionLote } from "@/components/sections/shared/use-seleccion-lote";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import {
  busquedaVacia,
  contadorEstadoTexto,
  contadorTexto,
  type EstadoAlumnos,
  type FilaAlumno,
  type FiltrosAlumnos,
  filtrarAlumnos,
  filtrarPorEstado,
  nombreAlumno,
  otraSeccion,
  rutaAlumnos,
  type SeccionAlumnos,
} from "@/lib/alumnos";
import { ALTA_SIN_EQUIPO, type OpcionEquipo } from "@/lib/alumnos-alta";
import type { EditarAlumno, ResultadoAlumno } from "@/lib/alumnos-datos";
import {
  AddStudentDialog,
  AGREGAR_ALUMNO_ID,
  type AlumnoCreado,
  type CrearAlumnoAccion,
} from "./add-student-dialog";
import {
  type AccionesBorrarAlumno,
  DeleteStudentDialog,
} from "./delete-student-dialog";
import { DeleteStudentsBatch } from "./delete-students-batch";
import { StudentFilters } from "./student-filters";
import { StudentsTable } from "./students-table";
import { usePresenciaAlumnos, type YoPresencia } from "./use-presencia";

/** Agregar y eliminar alumnos (W12, D267, D268): las Server Actions y los equipos para el alta. */
export type AltaAlumnos = AccionesBorrarAlumno & {
  crear: CrearAlumnoAccion;
  equipos: readonly OpcionEquipo[];
};

/**
 * Filtros + tabla (HANDOFF §3 Alumnos). Recibe la lista completa por props; la sección y la
 * búsqueda filtran en cliente. Con `guardar` (la Server Action, D209) «Guardar cambios» escribe en
 * Firestore y la fila cambia solo si se guardó; sin él (vista previa) solo cambia el estado local.
 * Búsqueda sin resultados: vacío con «Buscar en {otra sección}» si allí hay coincidencias (D170).
 * Sección, estado, tarea y ficha abierta se leen de la URL al entrar y la URL se actualiza al
 * cambiarlos con `history.replaceState` (sin recargar ni ensuciar el historial, D252).
 * Con `encabezado` pinta también el `PageHeader`, y con `alta` su «Agregar alumno»: tras crear,
 * la contraseña temporal (una sola vez, D232) y luego la ficha del alumno nuevo (D267). Cada acción
 * termina con `refresh()`: cuando llega la lista nueva del servidor, reemplaza a la local.
 * Con `yo`, una sola suscripción a la presencia (D277) para todas las filas y fichas.
 */
export function StudentsDirectory({
  alumnos,
  seccionInicial = "5A",
  guardar,
  filtrosIniciales = {},
  tarea,
  encabezado,
  alta,
  yo,
}: {
  alumnos: readonly FilaAlumno[];
  seccionInicial?: SeccionAlumnos;
  guardar?: (entrada: EditarAlumno) => Promise<ResultadoAlumno>;
  /** Filtros ya validados que llegaron por la URL. */
  filtrosIniciales?: FiltrosAlumnos;
  /** La tarea de `filtrosIniciales.tarea`, con su título (si existe). */
  tarea?: { id: string; titulo: string };
  encabezado?: { eyebrow: string };
  alta?: AltaAlumnos;
  /** El profe que mira: con él, presencia en vivo al editar (W14, D275–D277). */
  yo?: YoPresencia;
}) {
  const presencia = usePresenciaAlumnos(yo);
  const [filas, setFilas] = useState<readonly FilaAlumno[]>(alumnos);
  // La lista del servidor manda cuando cambia (tras crear, eliminar o editar: `refresh()`)
  const [alumnosAntes, setAlumnosAntes] = useState(alumnos);
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
  const [creado, setCreado] = useState<
    (CuentaCreada & { cedula: string }) | null
  >(null);

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
  const limpiarSeleccion = () => seleccion.limpiar();
  function cambiarSeccion(s: SeccionAlumnos) {
    setSeccion(s);
    limpiarSeleccion();
    sincronizar({ ...actuales(), seccion: s });
  }
  function quitarFiltro() {
    setEstado(undefined);
    setTareaId(undefined);
    limpiarSeleccion();
    sincronizar({ seccion, alumno: alumnoAbierto });
  }
  function cambiarConsulta(q: string) {
    setConsulta(q);
    limpiarSeleccion();
  }
  function cambiarAbierto(cedula: string, abierto: boolean) {
    const alumno = abierto ? cedula : undefined;
    setAlumnoAbierto(alumno);
    sincronizar({ ...actuales(), alumno });
  }
  function alCrear(a: AlumnoCreado) {
    // Su fila tiene que verse al abrir la ficha: su sección y sin búsqueda
    setConsulta("");
    setSeccion(a.seccion);
    limpiarSeleccion();
    sincronizar({ ...actuales(), seccion: a.seccion });
    setCreado({
      cedula: a.cedula,
      nombre: a.nombre,
      passwordTemporal: a.passwordTemporal,
    });
    if (a.sinEquipo) toast.error(ALTA_SIN_EQUIPO);
  }
  function alCerrarCreado() {
    const cedula = creado?.cedula;
    setCreado(null);
    // Después de la contraseña, la ficha del alumno nuevo (D267)
    if (cedula) cambiarAbierto(cedula, true);
  }
  /** Quita filas de la lista local y de la selección (la del servidor llega con `refresh()`). */
  function quitarFilas(cedulas: readonly string[]) {
    const fuera = new Set(cedulas);
    setFilas((actuales) => actuales.filter((a) => !fuera.has(a.cedula)));
    seleccion.quitar(cedulas);
    if (alumnoAbierto && fuera.has(alumnoAbierto)) {
      setAlumnoAbierto(undefined);
      sincronizar({ ...actuales(), alumno: undefined });
    }
  }
  function alEliminar(cedula: string, aviso?: (nombre: string) => string) {
    const fila = filas.find((a) => a.cedula === cedula);
    quitarFilas([cedula]);
    if (fila) {
      const nombre = nombreAlumno(fila);
      toast(aviso ? aviso(nombre) : `Eliminaste a ${nombre}`);
    }
    // Su fila (y el botón que abrió la ficha) ya no existe: el foco va a «Agregar alumno»
    requestAnimationFrame(() =>
      document.getElementById(AGREGAR_ALUMNO_ID)?.focus(),
    );
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
  // Casillas del lote (D298, D310): solo de lo visible; se vacían al cambiar de sección o de filtro
  const seleccion = useSeleccionLote(visibles.map((a) => a.cedula));
  const marcadas = seleccion.marcadas;
  if (alumnos !== alumnosAntes) {
    setAlumnosAntes(alumnos);
    setFilas(alumnos);
    seleccion.podar(alumnos.map((a) => a.cedula));
  }
  const lote =
    alta?.resumirVarios && alta.eliminarVarios
      ? { resumir: alta.resumirVarios, eliminar: alta.eliminarVarios }
      : null;
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
      {encabezado ? (
        <PageHeader
          eyebrow={encabezado.eyebrow}
          title="Alumnos"
          actions={
            alta ? (
              <AddStudentDialog
                equipos={alta.equipos}
                seccionInicial={seccion}
                crear={alta.crear}
                onCreado={alCrear}
              />
            ) : undefined
          }
        />
      ) : null}
      <StudentFilters
        seccion={seccion}
        onSeccion={cambiarSeccion}
        conteos={conteos}
        consulta={consulta}
        onConsulta={cambiarConsulta}
        contador={contador}
        filtroActivo={
          estado || tareaId
            ? { estado, tarea: tarea?.titulo, onQuitar: quitarFiltro }
            : undefined
        }
      />
      {lote && !vacia ? (
        <DeleteStudentsBatch
          seleccionados={visibles
            .filter((a) => marcadas.has(a.cedula))
            .map((a) => ({ cedula: a.cedula, nombre: nombreAlumno(a) }))}
          onLimpiar={limpiarSeleccion}
          resumir={lote.resumir}
          eliminar={lote.eliminar}
          onEliminados={quitarFilas}
          focoAlTerminar={AGREGAR_ALUMNO_ID}
        />
      ) : null}
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
          presencia={presencia}
          onGuardado={(cedula, cambios) =>
            setFilas((actuales) =>
              actuales.map((a) =>
                a.cedula === cedula ? { ...a, ...cambios } : a,
              ),
            )
          }
          onYaNoExiste={(cedula) =>
            alEliminar(cedula, (nombre) => `${nombre} ya no está en la lista`)
          }
          seleccion={
            lote
              ? {
                  marcadas,
                  casilla: seleccion.casilla,
                  onTodos: seleccion.alternarTodos,
                }
              : undefined
          }
          eliminarFila={
            alta
              ? (a) => (
                  <DeleteStudentDialog
                    alumno={a}
                    acciones={alta}
                    onEliminado={alEliminar}
                    compacto
                  />
                )
              : undefined
          }
          eliminar={
            alta
              ? (a) => (
                  <DeleteStudentDialog
                    alumno={a}
                    acciones={alta}
                    onEliminado={alEliminar}
                  />
                )
              : undefined
          }
        />
      )}
      {alta ? (
        <PasswordTemporalDialog creado={creado} onCerrar={alCerrarCreado} />
      ) : null}
    </>
  );
}
