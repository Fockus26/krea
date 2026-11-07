import type { ReactNode } from "react";
import { GradePill } from "@/components/krea/grade-pill";
import { UserAvatar } from "@/components/krea/user-avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  cedulaConPuntos,
  contadorTexto,
  type FilaAlumno,
  nombreAlumno,
  notaParaFiltro,
  type SeccionAlumnos,
  tablaLabel,
} from "@/lib/alumnos";
import { formatNota } from "@/lib/grades";
import { formatDecimal } from "@/lib/stepper";
import {
  type CambiosAlumno,
  EditStudentDialog,
  type GuardarAlumno,
} from "./edit-student-dialog";

const COLUMNAS = 7;

/**
 * Tabla de alumnos (HANDOFF §2.15, §3 Alumnos): Alumno · Cédula · Equipo · Base · Nota
 * individual · Puntos · Editar. La región desplazable, el `position: relative` para el `sr-only` y
 * la pista bajo 1024 los pone `Table` (D044). Nota `null` = Pendiente (D003); Raspado = ícono
 * con nombre accesible (`GradePill table`). Base ≠ 20 con chip, no solo con un número distinto.
 */
export function StudentsTable({
  seccion,
  filas,
  consulta,
  vacioTexto,
  tarea,
  abierto,
  onAbierto,
  guardar,
  onGuardado,
  eliminar,
}: {
  seccion: SeccionAlumnos;
  filas: readonly FilaAlumno[];
  consulta: string;
  /** Frase del vacío cuando lo causa el filtro de estado (en vez de la de la búsqueda). */
  vacioTexto?: string;
  /** Con tarea elegida, la columna de nota es la de esa tarea (D252). */
  tarea?: { id: string; titulo: string };
  /** Cédula del alumno cuya ficha está abierta (viene de la URL). */
  abierto?: string;
  onAbierto?: (cedula: string, abierto: boolean) => void;
  guardar?: GuardarAlumno;
  onGuardado: (cedula: string, cambios: CambiosAlumno) => void;
  /** «Eliminar alumno» de la ficha de cada fila (D268). */
  eliminar?: (a: FilaAlumno) => ReactNode;
}) {
  return (
    <Table label={tablaLabel(seccion)}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead scope="col">Alumno</TableHead>
          <TableHead scope="col">Cédula</TableHead>
          <TableHead scope="col">Equipo</TableHead>
          <TableHead scope="col" className="text-center">
            Base
          </TableHead>
          <TableHead scope="col" className="text-center">
            {tarea ? "Nota en la tarea" : "Nota individual"}
          </TableHead>
          <TableHead scope="col" numeric>
            Puntos
          </TableHead>
          <TableHead scope="col" numeric>
            <span className="sr-only">Acciones</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filas.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={COLUMNAS} className="h-auto py-8 text-center">
              <span className="text-body text-text-2">
                {vacioTexto ??
                  `${contadorTexto(0, consulta, seccion)}. Prueba con otro nombre, apellido o cédula.`}
              </span>
            </TableCell>
          </TableRow>
        ) : (
          filas.map((a) => (
            <TableRow key={a.cedula}>
              <TableCell>
                <span className="flex items-center gap-3">
                  <UserAvatar
                    estilo={a.estilo}
                    seed={a.semilla ?? a.cedula}
                    nombre={nombreAlumno(a)}
                    size={36}
                  />
                  <span className="text-label text-text">
                    {nombreAlumno(a)}
                  </span>
                </span>
              </TableCell>
              <TableCell className="nums whitespace-nowrap">
                {cedulaConPuntos(a.cedula)}
              </TableCell>
              <TableCell>
                {a.equipo ? a.equipo : <Badge variant="warn">Sin equipo</Badge>}
              </TableCell>
              <TableCell className="nums text-center">
                {a.base === 20 ? (
                  formatNota(a.base)
                ) : (
                  <Badge variant="base">{formatNota(a.base)}</Badge>
                )}
              </TableCell>
              <TableCell className="text-center">
                <GradePill
                  nota={notaParaFiltro(a, tarea?.id)}
                  size="sm"
                  table
                />
              </TableCell>
              <TableCell numeric className="text-small-b">
                {formatDecimal(a.puntos)}
              </TableCell>
              <TableCell numeric>
                <EditStudentDialog
                  alumno={a}
                  abiertoInicial={abierto === a.cedula}
                  onAbierto={onAbierto}
                  guardar={guardar}
                  onGuardado={onGuardado}
                  eliminar={eliminar?.(a)}
                />
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
