"use client";
// Lista de la pantalla Profesores (D233). Las filas llegan del servidor por props: cada Server
// Action termina con `refresh()` y la lista se vuelve a pintar con los datos guardados, sin
// copia local que se desfase. La contraseña temporal vive solo en el estado de esta pantalla.
// Eliminar en lote (W22, D298): una casilla por profe salvo el propio admin (no puede borrarse).
import { useState } from "react";
import { UserAvatar } from "@/components/krea/user-avatar";
import { EliminarEnLote } from "@/components/sections/shared/eliminar-en-lote";
import { PageHeader } from "@/components/sections/shared/page-header";
import {
  type CuentaCreada,
  PasswordTemporalDialog,
} from "@/components/sections/shared/password-temporal-dialog";
import { useSeleccionLote } from "@/components/sections/shared/use-seleccion-lote";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  contadorProfesores,
  detalleProfesor,
  type ErrorProfesor,
  errorProfesorTexto,
  type FilaProfesor,
  nombreProfesor,
} from "@/lib/cuentas-datos";
import {
  estadoTodos,
  PROFESORES,
  SELECCIONAR_TODOS_PROFESORES,
  seleccionarLabel,
} from "@/lib/lote";
import { estiloDe } from "@/lib/vistas-estudiante";
import {
  type AccionesProfesores,
  CrearProfesorDialog,
  EditarProfesorDialog,
  EliminarProfesorDialog,
  NUEVO_PROFESOR_ID,
} from "./profesor-dialogs";

// PROVISIONAL (CONTENT_CHECKLIST fila 159)
const BORRADO_PROFESORES =
  "Se borran sus cuentas y sus perfiles: ya no podrán entrar. Las tareas, evaluaciones y ajustes que hicieron se quedan.";

export function ProfesoresDirectory({
  profesores,
  acciones,
}: {
  profesores: readonly FilaProfesor[];
  acciones: AccionesProfesores;
}) {
  const [creado, setCreado] = useState<CuentaCreada | null>(null);
  // El admin no se selecciona a sí mismo: «todos» son los demás
  const seleccionables = profesores.filter((p) => !p.tu).map((p) => p.cedula);
  const seleccion = useSeleccionLote(seleccionables);
  const marcadas = seleccion.marcadas;
  // La lista nueva del servidor (tras `refresh()`) poda la selección: lo borrado ya no está
  const [antes, setAntes] = useState(profesores);
  if (profesores !== antes) {
    setAntes(profesores);
    seleccion.podar(profesores.map((p) => p.cedula));
  }
  const eliminarVarios = acciones.eliminarVarios;
  const conLote = eliminarVarios !== undefined && seleccionables.length > 0;
  const seleccionados = profesores
    .filter((p) => !p.tu && marcadas.has(p.cedula))
    .map((p) => ({ id: p.cedula, nombre: nombreProfesor(p) }));

  return (
    <>
      <PageHeader
        eyebrow={contadorProfesores(profesores.length)}
        title="Profesores"
        // PROVISIONAL (CONTENT_CHECKLIST fila 137)
        description="Crea las cuentas de los profes y corrige sus datos. Cada profe cambia su avatar y su contraseña en su Perfil."
        actions={
          <CrearProfesorDialog crear={acciones.crear} onCreado={setCreado} />
        }
      />
      <Card className="overflow-hidden p-0 md:p-0">
        {conLote && eliminarVarios ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-divider px-4 py-3 md:px-5">
            <span className="flex items-center gap-3">
              <Checkbox
                checked={estadoTodos(seleccionables, marcadas)}
                onCheckedChange={seleccion.alternarTodos}
                aria-label={SELECCIONAR_TODOS_PROFESORES}
              />
              <span aria-hidden="true" className="text-label text-text-2">
                Todos
              </span>
            </span>
            <EliminarEnLote<ErrorProfesor>
              seleccionados={seleccionados}
              sustantivo={PROFESORES}
              onLimpiar={seleccion.limpiar}
              descripcion={BORRADO_PROFESORES}
              eliminar={eliminarVarios}
              errorTexto={errorProfesorTexto}
              errorRed="red"
              onEliminados={seleccion.quitar}
              focoAlTerminar={NUEVO_PROFESOR_ID}
            />
          </div>
        ) : null}
        <ul className="divide-y divide-divider">
          {profesores.map((p) => (
            <li
              key={p.cedula}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 md:px-5"
            >
              {conLote ? (
                // El propio admin no tiene casilla; el hueco mantiene alineadas las filas
                <span className="flex w-5 shrink-0 justify-center">
                  {p.tu ? null : (
                    <Checkbox
                      {...seleccion.casilla(p.cedula)}
                      aria-label={seleccionarLabel(nombreProfesor(p))}
                    />
                  )}
                </span>
              ) : null}
              <UserAvatar
                estilo={estiloDe(p.estilo)}
                seed={p.semilla}
                nombre={nombreProfesor(p)}
                size={40}
              />
              <div className="flex min-w-0 flex-1 basis-48 flex-col gap-1">
                <p className="flex flex-wrap items-center gap-2 text-body-strong text-text">
                  <span className="min-w-0 break-words">
                    {nombreProfesor(p)}
                  </span>
                  {p.tu ? <Badge variant="tu">Tú</Badge> : null}
                  {p.admin ? <Badge variant="acc">Admin</Badge> : null}
                  {p.pendiente ? (
                    <Badge variant="warn">Contraseña temporal</Badge>
                  ) : null}
                </p>
                <p className="text-small break-words text-text-2">
                  {detalleProfesor(p)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <EditarProfesorDialog profesor={p} editar={acciones.editar} />
                {p.tu ? null : (
                  <EliminarProfesorDialog
                    profesor={p}
                    eliminar={acciones.eliminar}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>
      <PasswordTemporalDialog
        creado={creado}
        onCerrar={() => setCreado(null)}
      />
    </>
  );
}
