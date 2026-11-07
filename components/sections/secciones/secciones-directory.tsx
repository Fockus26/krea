"use client";
// Pantalla Años y secciones (D319): una tarjeta por año y, dentro, sus secciones con lo que tienen
// guardado. Los datos llegan del servidor por props; cada Server Action termina con `refresh()` y
// la lista se vuelve a pintar. Un solo diálogo para toda la pantalla (fuera de las tarjetas): al
// renombrar o eliminar, la tarjeta o la fila desaparecen con el refresh y el diálogo no se va con
// ellas; el foco vuelve al botón que lo abrió o, si ya no está, a uno que siga (D318).
import { Pencil, Plus, School, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { EmptyState } from "@/components/krea/empty-state";
import { PageHeader } from "@/components/sections/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  type CatalogoSecciones,
  type FilaAnio,
  resumenCatalogo,
  usoTexto,
} from "@/lib/secciones";
import {
  type AccionesSecciones,
  type Dialogo,
  DialogoSecciones,
  idAgregarSeccion,
  idEditarAnio,
  idEditarSeccion,
  idEliminarAnio,
  idEliminarSeccion,
  NUEVO_ANIO_ID,
} from "./seccion-dialogs";

export function SeccionesDirectory({
  catalogo,
  anios,
  acciones,
}: {
  catalogo: CatalogoSecciones;
  anios: readonly FilaAnio[];
  acciones: AccionesSecciones;
}) {
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const [abierto, setAbierto] = useState(false);
  // Cada apertura monta el formulario de cero (sin lo escrito la vez anterior)
  const [vez, setVez] = useState(0);
  // Ids a enfocar al cerrar, en orden: el primero que siga en la página
  const foco = useRef<string[]>([NUEVO_ANIO_ID]);

  function abrir(d: Dialogo, ids: string[]) {
    foco.current = [...ids, NUEVO_ANIO_ID];
    setDialogo(d);
    setVez((v) => v + 1);
    setAbierto(true);
  }

  return (
    <>
      <PageHeader
        eyebrow={resumenCatalogo(catalogo)}
        title="Años y secciones"
        // PROVISIONAL (CONTENT_CHECKLIST fila 166)
        description="Los años de la escuela y sus secciones. Una sección se cambia o se elimina solo mientras está vacía."
        actions={
          <Button
            id={NUEVO_ANIO_ID}
            onClick={() => abrir({ tipo: "nuevo-anio" }, [NUEVO_ANIO_ID])}
          >
            <Plus aria-hidden="true" />
            Nuevo año
          </Button>
        }
      />
      {anios.length === 0 ? (
        <Card>
          <EmptyState
            icon={School}
            headingLevel={2}
            // PROVISIONAL (CONTENT_CHECKLIST fila 166)
            title="Todavía no hay años"
            description="Crea el primero con «Nuevo año» y agrégale sus secciones."
          />
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {anios.map((a) => (
            <li key={a.numero}>
              <Card className="overflow-hidden p-0 md:p-0">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-divider px-4 py-3 md:px-5">
                  <div className="flex min-w-0 flex-1 basis-48 flex-col gap-1">
                    <h2 className="text-h3 text-text">{a.nombre}</h2>
                    <p className="text-small break-words text-text-2">
                      {a.secciones.length === 0
                        ? "Sin secciones todavía"
                        : usoTexto(a.uso)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      id={idAgregarSeccion(a.numero)}
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        abrir({ tipo: "agregar-seccion", anio: a }, [
                          idAgregarSeccion(a.numero),
                        ])
                      }
                    >
                      <Plus aria-hidden="true" />
                      <span aria-hidden="true">Agregar sección</span>
                      <span className="sr-only">
                        Agregar sección a {a.nombre}
                      </span>
                    </Button>
                    <Button
                      id={idEditarAnio(a.numero)}
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        abrir({ tipo: "editar-anio", anio: a }, [
                          idEditarAnio(a.numero),
                        ])
                      }
                    >
                      <Pencil aria-hidden="true" />
                      <span aria-hidden="true">Editar</span>
                      <span className="sr-only">Editar {a.nombre}</span>
                    </Button>
                    <Button
                      id={idEliminarAnio(a.numero)}
                      variant="ghost-danger"
                      size="sm"
                      onClick={() =>
                        abrir({ tipo: "eliminar-anio", anio: a }, [
                          idEliminarAnio(a.numero),
                        ])
                      }
                    >
                      <Trash2 aria-hidden="true" />
                      <span aria-hidden="true">Eliminar</span>
                      <span className="sr-only">Eliminar {a.nombre}</span>
                    </Button>
                  </div>
                </div>
                {a.secciones.length === 0 ? (
                  <p className="px-4 py-3 text-small text-text-2 md:px-5">
                    {/* PROVISIONAL (CONTENT_CHECKLIST fila 166) */}
                    Agrega su primera sección con «Agregar sección».
                  </p>
                ) : (
                  <ul
                    aria-label={`Secciones de ${a.nombre}`}
                    className="divide-y divide-divider"
                  >
                    {a.secciones.map((s) => (
                      <li
                        key={s.codigo}
                        className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 md:px-5"
                      >
                        <div className="flex min-w-0 flex-1 basis-48 items-center gap-3">
                          <Badge>
                            <span className="sr-only">Sección </span>
                            {s.codigo}
                          </Badge>
                          <p className="min-w-0 text-small break-words text-text-2">
                            {usoTexto(s.uso)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          <Button
                            id={idEditarSeccion(s.codigo)}
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              abrir(
                                { tipo: "editar-seccion", anio: a, seccion: s },
                                [
                                  idEditarSeccion(s.codigo),
                                  idAgregarSeccion(a.numero),
                                ],
                              )
                            }
                          >
                            <Pencil aria-hidden="true" />
                            <span aria-hidden="true">Editar</span>
                            <span className="sr-only">Editar {s.codigo}</span>
                          </Button>
                          <Button
                            id={idEliminarSeccion(s.codigo)}
                            variant="ghost-danger"
                            size="sm"
                            onClick={() =>
                              abrir(
                                {
                                  tipo: "eliminar-seccion",
                                  anio: a,
                                  seccion: s,
                                },
                                [
                                  idEliminarSeccion(s.codigo),
                                  idAgregarSeccion(a.numero),
                                ],
                              )
                            }
                          >
                            <Trash2 aria-hidden="true" />
                            <span aria-hidden="true">Eliminar</span>
                            <span className="sr-only">Eliminar {s.codigo}</span>
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent
          onCloseAutoFocus={(e) => {
            // Lo que lo abrió puede haberse ido con el refresh: el primero que siga
            e.preventDefault();
            for (const id of foco.current) {
              const el = document.getElementById(id);
              if (el) {
                el.focus();
                break;
              }
            }
          }}
        >
          {dialogo ? (
            <DialogoSecciones
              key={vez}
              dialogo={dialogo}
              catalogo={catalogo}
              acciones={acciones}
              cerrar={() => setAbierto(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
