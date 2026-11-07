"use client";

import { ClipboardCheck, Trash2 } from "lucide-react";
import * as React from "react";
import { EmptyState } from "@/components/krea/empty-state";
import { useFlip } from "@/components/krea/use-flip";
import { EliminarEnLote } from "@/components/sections/shared/eliminar-en-lote";
import { useSeleccionLote } from "@/components/sections/shared/use-seleccion-lote";
import { useVista } from "@/components/sections/shared/use-vista";
import { vistaListaId } from "@/components/sections/shared/vista-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { parseCssTime } from "@/lib/flip";
import { type ResultadoLote, TAREAS } from "@/lib/lote";
import {
  ELIMINAR_TAREA_BOTON,
  type ErrorTarea,
  eliminarTareaDescripcion,
  eliminarTareaTitulo,
  type FiltroEstado,
  filtrarTareas,
  filtroVacio,
  mensajeErrorTarea,
  sumarPerdidas,
  type TareaProfe,
  TOAST_TAREA_ELIMINADA,
} from "@/lib/tareas-profe";
import type { ResultadoTarea } from "@/lib/tareas-profe-datos";
import {
  conLaQueSale,
  type Quitando,
  vecinaAlQuitar,
} from "@/lib/tareas-profe-lista";
import { CLAVE_VISTA_TAREAS } from "@/lib/vista";
import { TaskStatusFilter } from "./task-status-filter";
import { TeacherTaskCard, tituloTareaId } from "./teacher-task-card";
import { TeacherTaskTable } from "./teacher-task-table";

/**
 * Lista de tareas del profesor (cliente: el filtro y la eliminación). Recibe todas las tareas por
 * props y filtra en el cliente (D099); el vacío de un filtro sin tareas es provisional (fila 89).
 * Eliminar (D243): un solo diálogo que dice cuántas notas se pierden; al confirmar, la tarjeta se
 * queda en su sitio mientras la acción responde (aunque `refresh()` ya la haya quitado de
 * `tareas`), sale con opacidad y escala y las demás suben con el FLIP del ranking. Con reduced
 * motion (duraciones a 0) desaparece al instante. El foco pasa al título de la siguiente tarjeta
 * (o de la anterior; sin ninguna, al `<h1>`). Sin `eliminar` (vista previa) no hay botón.
 * Vista Lista (D313, el interruptor de la cabecera): la misma lista y el mismo filtro en una
 * tabla; con `eliminarVarias`, casillas y la barra del lote (D314). El lote no anima: con
 * `refresh()` las filas borradas desaparecen; si no queda selección, el foco va a «Lista».
 */
export function TeacherTaskList({
  tareas,
  hoy,
  filtroInicial = "todas",
  eliminar,
  eliminarVarias,
}: {
  tareas: readonly TareaProfe[];
  hoy: string;
  filtroInicial?: FiltroEstado;
  /** Server Action de la página real; sin ella (galería) no hay «Eliminar». */
  eliminar?: (id: string) => Promise<ResultadoTarea>;
  /** Eliminar en lote desde la vista Lista (D314); sin ella, la Lista no lleva casillas. */
  eliminarVarias?: (ids: string[]) => Promise<ResultadoLote<ErrorTarea>>;
}) {
  const [vista] = useVista(CLAVE_VISTA_TAREAS);
  const [filtro, setFiltro] = React.useState<FiltroEstado>(filtroInicial);
  const [confirmar, setConfirmar] = React.useState<TareaProfe | null>(null);
  // `confirmar` se queda con la última tarea: el diálogo no se vacía mientras se cierra
  const [abierto, setAbierto] = React.useState(false);
  const [quitando, setQuitando] = React.useState<Quitando<TareaProfe> | null>(
    null,
  );
  const [pendiente, startTransition] = React.useTransition();
  const abrio = React.useRef<HTMLButtonElement | null>(null);
  const nodos = React.useRef(new Map<string, HTMLLIElement>());
  const { registrar } = useFlip<HTMLLIElement>();

  const visibles = conLaQueSale(filtrarTareas(tareas, filtro), quitando);

  // Lote (D314): solo en Lista y solo lo visible. Al cambiar de filtro o de vista, o cuando
  // `refresh()` trae la lista sin las borradas, lo que ya no se ve sale de la selección
  const conLote = vista === "lista" && eliminarVarias !== undefined;
  const idsLote = conLote ? visibles.map((t) => t.id) : [];
  const seleccion = useSeleccionLote(idsLote);
  const claveLote = idsLote.join("\n");
  const [claveAntes, setClaveAntes] = React.useState(claveLote);
  if (claveLote !== claveAntes) {
    setClaveAntes(claveLote);
    seleccion.podar(idsLote);
  }
  const marcadas = visibles.filter((t) => seleccion.marcadas.has(t.id));

  const abrirEliminar = (t: TareaProfe, boton: HTMLButtonElement) => {
    abrio.current = boton;
    setConfirmar(t);
    setAbierto(true);
  };

  const refDe = (id: string) => {
    const flip = registrar(id);
    return (el: HTMLLIElement | null) => {
      flip(el);
      if (el) nodos.current.set(id, el);
      else nodos.current.delete(id);
    };
  };

  /** Título que recibe el foco cuando se va `id`: la siguiente, la anterior o el `<h1>`. */
  const destinoFoco = (id: string): HTMLElement | null => {
    const otra = vecinaAlQuitar(visibles, id);
    if (otra) return document.getElementById(tituloTareaId(otra.id));
    const h1 = document.querySelector<HTMLElement>("main h1");
    if (h1 && !h1.hasAttribute("tabindex")) h1.tabIndex = -1;
    return h1;
  };

  /** Anima la salida de la tarjeta (solo opacidad y escala) y después la quita. */
  const salir = (id: string) => {
    const el = nodos.current.get(id);
    const estilo = getComputedStyle(document.documentElement);
    // Con prefers-reduced-motion las duraciones valen 0 (globals.css)
    const duracion = parseCssTime(estilo.getPropertyValue("--d-normal"), 0);
    const reducido = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!el || reducido || duracion <= 0) {
      setQuitando(null);
      return;
    }
    const easing = estilo.getPropertyValue("--ease").trim() || "ease";
    el.animate(
      [
        { opacity: 1, transform: "scale(1)" },
        { opacity: 0, transform: "scale(0.96)" },
      ],
      { duration: duracion, easing, fill: "forwards" },
    ).finished.then(
      () => setQuitando(null),
      () => setQuitando(null),
    );
  };

  const confirmarEliminar = () => {
    const t = confirmar;
    if (!t || !abierto || !eliminar || pendiente) return;
    const indice = visibles.findIndex((v) => v.id === t.id);
    setQuitando({ tarea: t, indice, hecha: false });
    startTransition(async () => {
      let r: ResultadoTarea;
      try {
        r = await eliminar(t.id);
      } catch {
        r = { ok: false, error: "red" };
      }
      // «No existe»: otro profe ya la borró; para quien mira, el resultado es el mismo
      if (r.ok || r.error === "no-existe") {
        setQuitando({ tarea: t, indice, hecha: true });
        setAbierto(false);
        toast.success(TOAST_TAREA_ELIMINADA);
        return;
      }
      setQuitando(null);
      toast.error(mensajeErrorTarea(r.error));
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <TaskStatusFilter filtro={filtro} onFiltro={setFiltro} />
      {visibles.length > 0 && vista === "lista" ? (
        <div className="flex flex-col gap-3">
          {conLote && eliminarVarias ? (
            <EliminarEnLote<ErrorTarea>
              seleccionados={marcadas.map((t) => ({
                id: t.id,
                nombre: t.titulo,
              }))}
              sustantivo={TAREAS}
              onLimpiar={seleccion.limpiar}
              descripcion={eliminarTareaDescripcion(
                sumarPerdidas(marcadas.map((t) => t.perdida)),
                true,
              )}
              eliminar={eliminarVarias}
              errorTexto={mensajeErrorTarea}
              errorRed="red"
              onEliminados={seleccion.quitar}
              focoAlTerminar={vistaListaId(CLAVE_VISTA_TAREAS)}
            />
          ) : null}
          <TeacherTaskTable
            tareas={visibles}
            hoy={hoy}
            seleccion={
              conLote
                ? {
                    marcadas: seleccion.marcadas,
                    casilla: seleccion.casilla,
                    onTodas: seleccion.alternarTodos,
                  }
                : undefined
            }
            onEliminar={eliminar ? abrirEliminar : undefined}
          />
        </div>
      ) : visibles.length > 0 ? (
        <ul className="flex flex-col gap-6">
          {visibles.map((t) => (
            <TeacherTaskCard
              key={t.id}
              ref={refDe(t.id)}
              tarea={t}
              hoy={hoy}
              saliendo={quitando?.hecha === true && quitando.tarea.id === t.id}
              onEliminar={
                eliminar ? (boton) => abrirEliminar(t, boton) : undefined
              }
            />
          ))}
        </ul>
      ) : (
        <Card>
          <EmptyState
            icon={ClipboardCheck}
            headingLevel={2}
            title={filtroVacio(filtro)}
          />
        </Card>
      )}

      {eliminar ? (
        <Dialog
          open={abierto}
          onOpenChange={(o) => {
            if (!o && !pendiente) setAbierto(false);
          }}
        >
          <DialogContent
            onCloseAutoFocus={(e) => {
              // Eliminada: el foco va a la vecina y empieza la salida; cancelada, vuelve al botón
              e.preventDefault();
              if (quitando?.hecha) {
                destinoFoco(quitando.tarea.id)?.focus();
                salir(quitando.tarea.id);
              } else abrio.current?.focus();
            }}
          >
            {confirmar ? (
              <>
                <DialogHeader>
                  <DialogTitle>
                    {eliminarTareaTitulo(confirmar.titulo)}
                  </DialogTitle>
                  <DialogDescription>
                    {eliminarTareaDescripcion(confirmar.perdida)}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="secondary" disabled={pendiente}>
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button
                    variant="danger"
                    onClick={confirmarEliminar}
                    disabled={pendiente}
                    aria-busy={pendiente || undefined}
                  >
                    <Trash2 aria-hidden="true" />
                    {pendiente ? "Eliminando…" : ELIMINAR_TAREA_BOTON}
                  </Button>
                </DialogFooter>
              </>
            ) : null}
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
