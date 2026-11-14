"use client";

import { Pencil } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  TaskAnswerForm,
  type TaskAnswerFormProps,
} from "@/components/sections/tareas/task-answer-form";
import { Button } from "@/components/ui/button";
import { claveEntrega } from "@/lib/offline/cola";
import { useOpCola } from "@/lib/offline/navegador";

const ID_BOTON = "editar-entrega";

/** Abre la edición; `null` fuera de `EntregaEditable` o si ya no se puede editar. */
const AbrirEdicion = createContext<(() => void) | null>(null);

/**
 * Entrega ya enviada que se puede editar (D395): muestra `children` («¡Tarea entregada!» y las
 * respuestas, pintadas en el servidor) y, al tocar «Editar entrega», el mismo formulario precargado
 * con lo enviado. Si hay una edición en la cola sin conexión (pendiente o rechazada), el formulario
 * sigue a la vista con su aviso. `editable` lo decide el servidor (`puedeEditar`): si cambia al
 * refrescar (el profe la evaluó, la tarea cerró), vuelve a la vista entregada.
 */
export function EntregaEditable({
  editable,
  formulario,
  children,
}: {
  editable: boolean;
  formulario: Omit<TaskAnswerFormProps, "edicion">;
  children: ReactNode;
}) {
  const [abierta, setAbierta] = useState(false);
  const enCola = useOpCola(
    claveEntrega(formulario.tareaId, formulario.titular ?? ""),
  );
  // Al salir de la edición, el foco vuelve a «Editar entrega»
  const volver = useRef(false);
  const editando = editable && (abierta || Boolean(enCola));

  useEffect(() => {
    if (editando || !volver.current) return;
    volver.current = false;
    document.getElementById(ID_BOTON)?.focus();
  }, [editando]);

  if (editando) {
    return (
      <TaskAnswerForm
        {...formulario}
        edicion={{
          enfocar: abierta,
          alSalir: (enfocar = true) => {
            volver.current = enfocar;
            setAbierta(false);
          },
        }}
      />
    );
  }
  return (
    <AbrirEdicion.Provider value={editable ? () => setAbierta(true) : null}>
      {children}
    </AbrirEdicion.Provider>
  );
}

/** «Editar entrega» dentro de `TaskDelivered`; no se pinta si no se puede editar. */
export function BotonEditarEntrega() {
  const abrir = useContext(AbrirEdicion);
  if (!abrir) return null;
  return (
    <Button id={ID_BOTON} variant="secondary" onClick={abrir}>
      <Pencil aria-hidden="true" />
      {/* PROVISIONAL (CONTENT_CHECKLIST fila 205) */}
      Editar entrega
    </Button>
  );
}
