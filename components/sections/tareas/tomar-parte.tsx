"use client";

import { Hand } from "lucide-react";
import { useState, useTransition } from "react";
import { BotonEnLinea } from "@/components/krea/boton-en-linea";
import { BOTON_LARGO_SM, Button } from "@/components/ui/button";
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
import { toast } from "@/components/ui/sonner";
import type { ResultadoParte } from "@/lib/acciones/partes";
import {
  mensajeErrorParte,
  PARTE_TOMADA_TOAST,
  TOMAR_PARTE,
  TOMAR_PARTE_TITULO,
  tomarParteAviso,
} from "@/lib/partes";
import { relanzarSiEsDeploy } from "@/lib/recarga-deploy";

/** Server Action «La respondo yo» (D461). */
export type AccionTomar = (e: {
  tareaId: string;
  preguntaId: string;
}) => Promise<ResultadoParte>;

// La pregunta recién tomada: su tarjeta del formulario se abre con el refresco y recibe el foco
// (el botón tocado desaparece). Un valor del módulo: el panel y el formulario son hermanos.
let focoPendiente: string | null = null;

/** ¿Esta pregunta se acaba de tomar? Lo consume: solo la primera tarjeta que se abre lo usa. */
export function tomarFocoPendiente(preguntaId: string): boolean {
  if (focoPendiente !== preguntaId) return false;
  focoPendiente = null;
  return true;
}

/**
 * «La respondo yo» (D461): en la fila del Reparto y en la tarjeta bloqueada del formulario del
 * capitán, solo con una parte asignada o devuelta. Pide confirmar (el integrante ya no podrá
 * entregarla y puede quedar «No participó», D420). Solo en línea (D424).
 */
export function TomarParte({
  tareaId,
  preguntaId,
  numero,
  nombre,
  accion,
}: {
  tareaId: string;
  preguntaId: string;
  numero: number;
  /** Nombre corto de quien la tenía. */
  nombre: string;
  accion: AccionTomar;
}) {
  const [abierto, setAbierto] = useState(false);
  const [pendiente, start] = useTransition();

  function tomar() {
    if (!navigator.onLine) {
      setAbierto(false);
      toast.error(mensajeErrorParte("red"));
      return;
    }
    start(async () => {
      let r: ResultadoParte;
      try {
        r = await accion({ tareaId, preguntaId });
      } catch (fallo) {
        relanzarSiEsDeploy(fallo);
        r = { ok: false, error: "red" };
      }
      setAbierto(false);
      if (r.ok) {
        focoPendiente = preguntaId;
        toast.success(PARTE_TOMADA_TOAST);
      } else toast.error(mensajeErrorParte(r.error));
    });
  }

  return (
    <Dialog
      open={abierto}
      onOpenChange={(o) => {
        if (!pendiente) setAbierto(o);
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          disabled={pendiente}
          className={BOTON_LARGO_SM}
        >
          <Hand aria-hidden="true" />
          {TOMAR_PARTE}
          {/* Con varias preguntas, cada botón se distingue con lector de pantalla */}
          <span className="sr-only">{` (pregunta ${numero})`}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{TOMAR_PARTE_TITULO}</DialogTitle>
          <DialogDescription>{tomarParteAviso(nombre)}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" disabled={pendiente}>
              Cancelar
            </Button>
          </DialogClose>
          <BotonEnLinea
            onClick={tomar}
            loading={pendiente}
            loadingLabel="Tomándola…"
          >
            <Hand aria-hidden="true" />
            {TOMAR_PARTE}
          </BotonEnLinea>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
