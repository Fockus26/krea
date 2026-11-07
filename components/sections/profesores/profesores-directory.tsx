"use client";
// Lista de la pantalla Profesores (D233). Las filas llegan del servidor por props: cada Server
// Action termina con `refresh()` y la lista se vuelve a pintar con los datos guardados, sin
// copia local que se desfase. La contraseña temporal vive solo en el estado de esta pantalla.
import { useState } from "react";
import { UserAvatar } from "@/components/krea/user-avatar";
import { PageHeader } from "@/components/sections/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  contadorProfesores,
  detalleProfesor,
  type FilaProfesor,
  nombreProfesor,
} from "@/lib/cuentas-datos";
import { estiloDe } from "@/lib/vistas-estudiante";
import {
  type AccionesProfesores,
  CrearProfesorDialog,
  EditarProfesorDialog,
  EliminarProfesorDialog,
  PasswordTemporalDialog,
} from "./profesor-dialogs";

export function ProfesoresDirectory({
  profesores,
  acciones,
}: {
  profesores: readonly FilaProfesor[];
  acciones: AccionesProfesores;
}) {
  const [creado, setCreado] = useState<{
    nombre: string;
    passwordTemporal: string;
  } | null>(null);

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
        <ul className="divide-y divide-divider">
          {profesores.map((p) => (
            <li
              key={p.cedula}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 md:px-5"
            >
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
