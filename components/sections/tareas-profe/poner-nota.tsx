"use client";

import { PenLine } from "lucide-react";
import { useId, useRef, useState } from "react";
import { ErrorEnPantalla } from "@/components/estados/errores";
import { BotonEnLinea } from "@/components/krea/boton-en-linea";
import { NumberStepper } from "@/components/krea/number-stepper";
import { hayRed } from "@/components/krea/use-en-linea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { joinIds } from "@/components/ui/field";
import { toast } from "@/components/ui/sonner";
import { NOTA_MAX } from "@/lib/grades";
import {
  errorNotaSinEntregaTexto,
  type PonerNotaSinEntrega,
  ponerNotaLabel,
  type ResultadoNotaSinEntrega,
} from "@/lib/nota-sin-entrega";
import { siNoEsDeploy } from "@/lib/recarga-deploy";

export type AccionPonerNota = (
  e: PonerNotaSinEntrega,
) => Promise<ResultadoNotaSinEntrega>;

/*
 * «Poner nota» (D581) en una fila «Sin entregar» de Notas de la tarea: un diálogo con el puntaje
 * sobre 20 (pasos de 0,5) para quien no entregó por la web, sin respuestas ni puntaje por pregunta.
 * Al guardar, el `refresh()` del servidor pone la fila en «Evaluada» (con «Corregir») y el botón
 * desaparece: el foco va al `<h1>`. Sin la acción (galería), guardar solo muestra el toast.
 * Copy PROVISIONAL (CONTENT_CHECKLIST fila 281).
 */
export function PonerNota({
  tareaId,
  titularId,
  nombre,
  tipo,
  poner,
}: {
  tareaId: string;
  titularId: string;
  nombre: string;
  tipo: "individual" | "grupal";
  poner?: AccionPonerNota;
}) {
  const uid = useId();
  const boton = useRef<HTMLButtonElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [puntaje, setPuntaje] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enviando = useRef(false);

  const abrir = () => {
    setPuntaje(null);
    setError(null);
    setAbierto(true);
  };

  const guardar = async () => {
    if (enviando.current) return;
    if (puntaje === null) {
      setError("Elige el puntaje sobre 20.");
      document
        .getElementById(`${uid}-puntaje`)
        ?.querySelector("input")
        ?.focus();
      return;
    }
    if (!hayRed()) return;
    enviando.current = true;
    setGuardando(true);
    setError(null);
    const r: ResultadoNotaSinEntrega = poner
      ? await poner({ tareaId, titularId, puntaje }).catch(
          siNoEsDeploy<ResultadoNotaSinEntrega>({ ok: false, error: "red" }),
        )
      : { ok: true };
    enviando.current = false;
    setGuardando(false);
    if (r.ok) {
      toast.success(`Nota guardada para ${nombre}`);
      setAbierto(false);
      return;
    }
    setError(errorNotaSinEntregaTexto(r.error));
  };

  return (
    <>
      <Button
        ref={boton}
        type="button"
        variant="secondary"
        size="sm"
        aria-haspopup="dialog"
        aria-label={ponerNotaLabel(nombre)}
        onClick={abrir}
      >
        Poner nota
      </Button>
      <Dialog
        open={abierto}
        onOpenChange={(o) => {
          if (!guardando) setAbierto(o);
        }}
      >
        <DialogContent
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            // Guardada, la fila ya no tiene el botón: el foco va al título de la página
            if (boton.current?.isConnected) boton.current.focus();
            else {
              const h1 = document.querySelector<HTMLElement>("main h1");
              if (h1 && !h1.hasAttribute("tabindex")) h1.tabIndex = -1;
              h1?.focus();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Poner nota · {nombre}</DialogTitle>
            {/* PROVISIONAL (CONTENT_CHECKLIST fila 281) */}
            <DialogDescription>
              {tipo === "grupal"
                ? "Para un equipo que no entregó por la web. La reciben sus integrantes de hoy, cada uno con su base."
                : "Para un alumno que no entregó por la web. La nota sale con su base."}
            </DialogDescription>
          </DialogHeader>
          <form
            method="post"
            className="flex min-w-0 flex-col gap-4"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void guardar();
            }}
          >
            <div className="flex flex-col gap-2">
              <span id={`${uid}-titulo`} className="text-label text-text">
                Puntaje
              </span>
              <p id={`${uid}-ayuda`} className="text-small text-text-2">
                Sobre 20, sin puntaje por pregunta. Si después{" "}
                {tipo === "grupal" ? "el capitán sube" : "sube"} las respuestas
                mientras la tarea siga abierta, la nota se queda.
              </p>
              <div id={`${uid}-puntaje`}>
                <NumberStepper
                  value={puntaje}
                  onChange={(n) => {
                    setPuntaje(n);
                    setError(null);
                  }}
                  min={0}
                  max={NOTA_MAX}
                  unit="/ 20"
                  aria-labelledby={`${uid}-titulo`}
                  aria-describedby={joinIds(
                    `${uid}-ayuda`,
                    error ? `${uid}-error` : undefined,
                  )}
                  aria-invalid={error !== null && puntaje === null}
                  emptyText="Sin nota"
                />
              </div>
              {error ? (
                <div id={`${uid}-error`}>
                  <ErrorEnPantalla titulo="No se guardó la nota">
                    {error}
                  </ErrorEnPantalla>
                </div>
              ) : null}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={guardando}>
                  Cancelar
                </Button>
              </DialogClose>
              <BotonEnLinea
                type="submit"
                loading={guardando}
                loadingLabel="Guardando…"
              >
                <PenLine aria-hidden="true" />
                Guardar nota
              </BotonEnLinea>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
