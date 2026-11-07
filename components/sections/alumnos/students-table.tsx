"use client";

import { UserPen } from "lucide-react";
import type { ReactNode } from "react";
import { GradePill } from "@/components/krea/grade-pill";
import { useFlip } from "@/components/krea/use-flip";
import { UserAvatar } from "@/components/krea/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  estadoTodos,
  SELECCIONAR_TODOS_ALUMNOS,
  seleccionarLabel,
} from "@/lib/lote";
import { presenciaTexto } from "@/lib/presencia";
import { formatDecimal } from "@/lib/stepper";
import {
  type CambiosAlumno,
  EditStudentDialog,
  type GuardarAlumno,
} from "./edit-student-dialog";
import type { Presencia } from "./use-presencia";

const COLUMNAS = 7;

/** «Ana Pérez está editando» bajo el nombre (texto vacío: nada). */
function EditandoChip({ texto }: { texto: string }) {
  if (!texto) return null;
  return (
    <Badge variant="acc">
      <UserPen aria-hidden="true" />
      {texto}
    </Badge>
  );
}

/**
 * Tabla de alumnos (HANDOFF §2.15, §3 Alumnos): Alumno · Cédula · Equipo · Base · Nota
 * individual · Puntos · Editar (y Eliminar, D298). Con `seleccion`, una casilla al inicio de cada
 * fila y «todos los visibles» en la cabecera, para eliminar en lote. La región desplazable, el `position: relative` para el `sr-only` y
 * la pista bajo 1024 los pone `Table` (D044). Nota `null` = Pendiente (D003); Raspado = ícono
 * con nombre accesible (`GradePill table`). Base ≠ 20 con chip, no solo con un número distinto.
 * Al filtrar, buscar o dar de alta, las filas que quedan viajan a su sitio y las que aparecen
 * entran con opacidad (`useFlip`, D281); con reduced motion, cambio directo.
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
  presencia,
  eliminarFila,
  seleccion,
  onYaNoExiste,
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
  /** Quién edita a cada alumno (W14, D277); sin ella (vista previa), nada. */
  presencia?: Presencia | null;
  /** Otro profe lo eliminó mientras su ficha estaba abierta (D298): la ficha se cierra. */
  onYaNoExiste?: (cedula: string) => void;
  /** Eliminar de un toque junto a «Editar» (W22, D298). */
  eliminarFila?: (a: FilaAlumno) => ReactNode;
  /** Casillas para eliminar en lote (D298); «todos» = las filas visibles. */
  seleccion?: {
    marcadas: ReadonlySet<string>;
    onUno: (cedula: string, marcada: boolean) => void;
    onTodos: () => void;
  };
}) {
  const { registrar } = useFlip<HTMLTableRowElement>({
    duracion: "--d-normal",
    entrada: true,
  });
  const editores = (cedula: string) => presencia?.editoresDe(cedula) ?? [];
  return (
    <Table label={tablaLabel(seccion)}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {seleccion ? (
            <TableHead scope="col" className="w-12 pr-0">
              <Checkbox
                checked={estadoTodos(
                  filas.map((a) => a.cedula),
                  seleccion.marcadas,
                )}
                onCheckedChange={() => seleccion.onTodos()}
                disabled={filas.length === 0}
                aria-label={SELECCIONAR_TODOS_ALUMNOS}
              />
            </TableHead>
          ) : null}
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
            <TableCell
              colSpan={COLUMNAS + (seleccion ? 1 : 0)}
              className="h-auto py-8 text-center"
            >
              <span className="animate-fade-in text-body text-text-2">
                {vacioTexto ??
                  `${contadorTexto(0, consulta, seccion)}. Prueba con otro nombre, apellido o cédula.`}
              </span>
            </TableCell>
          </TableRow>
        ) : (
          filas.map((a) => (
            <TableRow key={a.cedula} ref={registrar(a.cedula)}>
              {seleccion ? (
                <TableCell className="w-12 pr-0">
                  <Checkbox
                    checked={seleccion.marcadas.has(a.cedula)}
                    onCheckedChange={(v) =>
                      seleccion.onUno(a.cedula, v === true)
                    }
                    aria-label={seleccionarLabel(nombreAlumno(a))}
                  />
                </TableCell>
              ) : null}
              <TableCell>
                <span className="flex items-center gap-3">
                  <UserAvatar
                    estilo={a.estilo}
                    seed={a.semilla ?? a.cedula}
                    nombre={nombreAlumno(a)}
                    size={36}
                  />
                  <span className="flex flex-col items-start gap-1">
                    <span className="text-label text-text">
                      {nombreAlumno(a)}
                    </span>
                    {/* Otro profe con su ficha abierta (D277): ícono + texto, nunca solo color */}
                    <EditandoChip texto={presenciaTexto(editores(a.cedula))} />
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
                <span className="flex items-center justify-end gap-1">
                  <EditStudentDialog
                    alumno={a}
                    abiertoInicial={abierto === a.cedula}
                    onAbierto={onAbierto}
                    guardar={guardar}
                    onGuardado={onGuardado}
                    eliminar={eliminar?.(a)}
                    presencia={presencia}
                    onYaNoExiste={onYaNoExiste}
                  />
                  {eliminarFila?.(a)}
                </span>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
