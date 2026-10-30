"use client";

import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ImageViewerProps = {
  src: string;
  /** Texto alternativo real: "Respuesta de María a la pregunta 3". */
  alt: string;
  /** Enunciado de la pregunta: título accesible del visor (no se ve). */
  enunciado: string;
  /** Clases del botón "Ampliar" (p. ej. para posicionarlo sobre la imagen). */
  className?: string;
};

/*
 * Visor "Ampliar" — HANDOFF §2.16 (evaluar). Dialog de Radix a pantalla completa: Esc y el
 * botón de cerrar lo cierran, el foco queda dentro mientras está abierto y vuelve al botón
 * "Ampliar" al cerrar (el propio `DialogTrigger`). Monta en el `PortalScope` más cercano (D034).
 * Sin movimiento propio más allá del fundido del diálogo (que ya respeta reduced motion).
 */
export function ImageViewer({
  src,
  alt,
  enunciado,
  className,
}: ImageViewerProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className={cn(className)}>
          <Maximize2 aria-hidden="true" />
          Ampliar
          <span className="sr-only"> imagen de la respuesta</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        aria-describedby={undefined}
        className="inset-0 top-0 mx-0 h-dvh max-h-none max-w-none items-center justify-center rounded-none p-4 md:inset-0 md:my-0 md:h-dvh md:max-h-none md:p-6"
      >
        <DialogTitle className="sr-only">{enunciado}</DialogTitle>
        {/* biome-ignore lint/performance/noImgElement: blobs locales y remotos (D046) */}
        <img
          src={src}
          alt={alt}
          className="max-h-full max-w-full min-h-0 rounded-nav object-contain"
        />
      </DialogContent>
    </Dialog>
  );
}
