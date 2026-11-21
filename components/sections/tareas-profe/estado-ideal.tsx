"use client";
import { PencilLine, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { ErrorEnPantalla } from "@/components/estados/errores";
// Estado de la entrega ideal en la lista de entregas de una tarea (tanda 11-14 Z2, D430–D435):
// ninguna (con «Escribir la respuesta ideal»), vigente (de quién, «Editar» y «Quitar») o caducada
// (la entrega elegida ya no tiene 20 / 20 o se eliminó: aviso y las mismas salidas). «Quitar» pide
// confirmación; si falla, el diálogo sigue abierto con el error (D171).
import { BotonEnLinea } from "@/components/krea/boton-en-linea";
import { Alert } from "@/components/ui/alert";
import { BOTON_LARGO_SM, Button } from "@/components/ui/button";
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
import {
  EDITAR_IDEAL_TEXTO,
  ESCRIBIR_IDEAL_TEXTO,
  type EstadoIdealProfe,
  errorIdealTexto,
  estadoIdealTexto,
  estadoIdealTitulo,
  IDEAL_QUITADA_TEXTO,
  QUITAR_IDEAL_CAMBIO_TEXTO,
  QUITAR_IDEAL_DESCRIPCION,
  QUITAR_IDEAL_TEXTO,
  QUITAR_IDEAL_TITULO,
  type QuitarIdeal,
  type ResultadoIdeal,
  rutaIdealProfe,
} from "@/lib/ideal";
import { siNoEsDeploy } from "@/lib/recarga-deploy";

export function EstadoIdeal({
  tareaId,
  estado,
  tareaAbierta,
  version,
  quitar,
}: {
  tareaId: string;
  estado: EstadoIdealProfe;
  tareaAbierta: boolean;
  /** Versión de la ideal que ve esta lista (`VERSION_IDEAL_SIN_FILA` si no hay): D551. */
  version: number;
  /** Server Action; sin ella (galería) solo se cierra con el toast. */
  quitar?: (e: QuitarIdeal) => Promise<ResultadoIdeal>;
}) {
  const [abierto, setAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ocupado = useRef(false);

  async function confirmar() {
    if (ocupado.current) return;
    ocupado.current = true;
    setEnviando(true);
    setError(null);
    const r: ResultadoIdeal = quitar
      ? await quitar({ tareaId, version }).catch(
          siNoEsDeploy<ResultadoIdeal>({ ok: false, error: "red" }),
        )
      : { ok: true };
    ocupado.current = false;
    setEnviando(false);
    if (!r.ok) {
      setError(
        r.error === "cambio"
          ? QUITAR_IDEAL_CAMBIO_TEXTO
          : errorIdealTexto(r.error),
      );
      return;
    }
    setAbierto(false);
    toast.success(IDEAL_QUITADA_TEXTO);
  }

  const titulo = estadoIdealTitulo(estado);
  const texto = estadoIdealTexto(estado, tareaAbierta);
  const hay = estado.tipo !== "ninguna";

  return (
    <section aria-labelledby="entrega-ideal-titulo">
      <Card variant="flat" className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <Star
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-accent-ink"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2 id="entrega-ideal-titulo" className="text-h4 text-text">
              {titulo}
            </h2>
            {estado.tipo === "caducada" ? null : (
              <p className="text-small text-text-2">{texto}</p>
            )}
          </div>
        </div>
        {estado.tipo === "caducada" ? (
          <Alert variant="warn" role="status">
            {texto}
          </Alert>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {estado.tipo === "vigente" ? (
            <Button
              asChild
              variant="secondary"
              size="sm"
              className={BOTON_LARGO_SM}
            >
              <Link href={rutaIdealProfe(tareaId)}>
                <PencilLine aria-hidden="true" />
                {EDITAR_IDEAL_TEXTO}
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              variant="secondary"
              size="sm"
              className={BOTON_LARGO_SM}
            >
              <Link href={rutaIdealProfe(tareaId, { forma: "profe" })}>
                <PencilLine aria-hidden="true" />
                {ESCRIBIR_IDEAL_TEXTO}
              </Link>
            </Button>
          )}
          {hay ? (
            <Button
              type="button"
              variant="ghost-danger"
              size="sm"
              className={BOTON_LARGO_SM}
              onClick={() => {
                setError(null);
                setAbierto(true);
              }}
            >
              <Trash2 aria-hidden="true" />
              {QUITAR_IDEAL_TEXTO}
            </Button>
          ) : null}
        </div>
      </Card>

      <Dialog
        open={abierto}
        onOpenChange={(v) => {
          if (!v && !ocupado.current) setAbierto(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{QUITAR_IDEAL_TITULO}</DialogTitle>
            <DialogDescription>{QUITAR_IDEAL_DESCRIPCION}</DialogDescription>
          </DialogHeader>
          {error ? (
            <ErrorEnPantalla titulo="No se quitó">{error}</ErrorEnPantalla>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </DialogClose>
            <BotonEnLinea
              type="button"
              variant="danger"
              loading={enviando}
              loadingLabel="Quitando…"
              onClick={confirmar}
            >
              <Trash2 aria-hidden="true" />
              {QUITAR_IDEAL_TEXTO}
            </BotonEnLinea>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
