"use client";

import {
  ErrorEntregaRechazada,
  ErrorGuardarNota,
  SesionVencida,
} from "@/components/estados/errores";
import { Card } from "@/components/ui/card";
import { Toaster, toast } from "@/components/ui/sonner";
import { mainClass } from "@/lib/layout";

/** Errores dentro de una pantalla en la galería (D171). Textos de ejemplo del lienzo (fila 119). */
export function GaleriaErrores() {
  return (
    <main id="contenido" tabIndex={-1} className={mainClass("estudiante")}>
      <h1 className="text-h1">Errores dentro de una pantalla</h1>
      <div className="g3">
        <Card className="flex flex-col gap-3">
          <h2 className="text-eyebrow text-text-2">Entrega rechazada</h2>
          <ErrorEntregaRechazada
            pregunta={3}
            motivo="La imagen de la pregunta 3 pesa 30 MB y el máximo es 25 MB."
            href="#pregunta-3"
          />
        </Card>
        <Card className="flex flex-col gap-3">
          <h2 className="text-eyebrow text-text-2">
            Fallo de red al guardar una nota
          </h2>
          <ErrorGuardarNota
            equipo="5A-G2 Repostería"
            onReintentar={() => toast("Reintentando…")}
            onCopiar={() => toast("Comentarios copiados")}
          />
        </Card>
        <Card className="flex flex-col gap-3">
          <h2 className="text-eyebrow text-text-2">Sesión vencida</h2>
          <SesionVencida />
        </Card>
      </div>
      <Toaster />
    </main>
  );
}
