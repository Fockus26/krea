"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  type EstadoCola,
  estadoDe,
  type FiltrosEvaluar,
  rutaPrimera,
} from "@/lib/evaluar-datos";
import { ColaFiltros, type OpcionFiltro } from "./cola-filtros";

/** Opciones de Tarea y Alumno de cada lista (D387): cambian con el estado elegido. */
export type OpcionesPorEstado = Record<
  EstadoCola,
  { tareas: OpcionFiltro[]; alumnos: OpcionFiltro[] }
>;

/** PROVISIONAL (CONTENT_CHECKLIST fila 247): diálogo «Cambiar» de una entrega (D442). */
const TITULO = "Cambiar la cola";
const DESCRIPCION =
  "Elige qué entregas recorrer. Al aplicar, abrimos la primera de la cola nueva.";
const APLICAR = "Aplicar";
const CANCELAR = "Cancelar";

/**
 * «Cambiar» en la cabecera de una entrega (D442): abre los mismos filtros de la cola en un
 * diálogo, sin navegar en cada cambio. «Aplicar» va a `rutaPrimera` (la cola salta a la primera
 * entrega que cumple; si no hay, se queda en la cola con su vacío). Radix pone el foco en el
 * primer control al abrir y lo devuelve a «Cambiar» al cerrar.
 */
export function CambiarFiltros({
  filtros,
  secciones,
  opciones,
}: {
  filtros: FiltrosEvaluar;
  secciones: readonly string[];
  opciones: OpcionesPorEstado;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [borrador, setBorrador] = useState<FiltrosEvaluar>(filtros);
  const [pendiente, empezar] = useTransition();
  const lista = opciones[estadoDe(borrador)];

  return (
    <Dialog
      open={abierto}
      onOpenChange={(v) => {
        // Cada vez que se abre, desde los filtros de la entrega
        if (v) setBorrador(filtros);
        setAbierto(v);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm">
          Cambiar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{TITULO}</DialogTitle>
          <DialogDescription>{DESCRIPCION}</DialogDescription>
        </DialogHeader>
        <ColaFiltros
          filtros={borrador}
          secciones={secciones}
          tareas={conElegida(lista.tareas, borrador.tarea, opciones, "tareas")}
          alumnos={conElegida(
            lista.alumnos,
            borrador.alumno,
            opciones,
            "alumnos",
          )}
          onCambio={setBorrador}
          compacto
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              {CANCELAR}
            </Button>
          </DialogClose>
          <Button
            type="button"
            disabled={pendiente}
            onClick={() =>
              empezar(() => {
                router.push(rutaPrimera(borrador));
                setAbierto(false);
              })
            }
          >
            {APLICAR}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** La opción elegida sigue en la lista aunque el estado nuevo no la tenga (texto de otra lista). */
function conElegida(
  lista: OpcionFiltro[],
  valor: string | undefined,
  todas: OpcionesPorEstado,
  campo: "tareas" | "alumnos",
): OpcionFiltro[] {
  if (!valor || lista.some((o) => o.valor === valor)) return lista;
  const o = Object.values(todas)
    .flatMap((x) => x[campo])
    .find((x) => x.valor === valor);
  return o ? [...lista, o] : lista;
}
