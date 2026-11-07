"use client";
// Contraseña temporal de una cuenta recién creada (D232): Profesores (D233) y Alumnos (W12, D267).

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/alert";
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

export type CuentaCreada = { nombre: string; passwordTemporal: string };

/**
 * Muestra la contraseña temporal recién creada. Vive solo en el estado de este navegador: al
 * cerrar se descarta y no hay forma de volver a verla (D232). Un clic fuera no lo cierra (sería
 * perderla sin querer); Esc y «Listo» sí.
 */
export function PasswordTemporalDialog({
  creado,
  onCerrar,
}: {
  creado: CuentaCreada | null;
  onCerrar: () => void;
}) {
  async function copiar(pw: string) {
    try {
      await navigator.clipboard.writeText(pw);
      toast("Contraseña copiada");
    } catch {
      toast.error("No se pudo copiar. Anótala a mano.");
    }
  }
  return (
    <Dialog
      open={creado !== null}
      onOpenChange={(abierto) => {
        if (!abierto) onCerrar();
      }}
    >
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        {creado ? (
          <>
            <DialogHeader>
              <DialogTitle>Cuenta creada</DialogTitle>
              <DialogDescription>
                Contraseña temporal de {creado.nombre}. Al entrar con su cédula
                y esta contraseña, la app le pedirá crear la suya.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex min-h-11 items-center rounded-nav bg-surface-2 px-3.5 text-code break-all text-text">
                {creado.passwordTemporal}
              </span>
              <Button
                type="button"
                variant="secondary"
                onClick={() => copiar(creado.passwordTemporal)}
              >
                <Copy aria-hidden="true" />
                Copiar<span className="sr-only"> contraseña</span>
              </Button>
            </div>
            <Alert variant="warn">
              <p className="text-small">
                <strong>No se vuelve a mostrar.</strong> Cópiala o anótala ahora
                y dásela en persona.
              </p>
            </Alert>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button">Listo</Button>
              </DialogClose>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
