"use client";

import { Share, SquarePlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { EstadoInstalacion } from "@/lib/instalar-pwa";

// PROVISIONAL (CONTENT_CHECKLIST filas 202–204): instalar KREA en iPhone/iPad
const BOTON = "Instalar KREA";
const DESC_BOTON =
  "Ábrela desde tu pantalla de inicio, como cualquier app, y recibe los avisos más fácil.";
const TITULO = "Instalar KREA en tu iPhone o iPad";
const DESC_SAFARI = "Sigue estos pasos en Safari. Toma menos de un minuto.";
const PASOS = [
  {
    icono: Share,
    titulo: "Toca Compartir",
    detalle:
      "Es el botón con un cuadrado y una flecha hacia arriba, en la barra de abajo de Safari (en iPad, arriba a la derecha).",
  },
  {
    icono: SquarePlus,
    titulo: "Elige «Agregar a inicio»",
    detalle:
      "Desliza el menú hacia arriba hasta verlo. En algunos iPhone dice «Añadir a pantalla de inicio».",
  },
  {
    icono: null,
    titulo: "Toca «Agregar»",
    detalle: "Luego abre KREA desde su ícono en la pantalla de inicio.",
  },
] as const;
const TITULO_OTRO = "Ábrela en Safari para instalarla";
const DESC_OTRO_NAV =
  "Este navegador no siempre ofrece «Agregar a inicio». Abre KREA en Safari y sigue los pasos.";
const DESC_EN_APP =
  "Estás viendo KREA dentro de otra app. Abre KREA en Safari para poder instalarla.";
const PASOS_SAFARI = [
  "Toca «Copiar enlace».",
  "Abre Safari y pega el enlace en la barra de direcciones.",
  "Cuando cargue KREA, toca Instalar KREA en Perfil y sigue los pasos.",
];
const COPIAR = "Copiar enlace";
const TOAST_COPIADO = "Enlace copiado. Pégalo en Safari.";
const TOAST_NO_COPIO =
  "No se pudo copiar. Copia la dirección de la barra de tu navegador.";

/** Pasos para Safari de iPhone/iPad. */
function PasosSafari() {
  return (
    <ol className="flex flex-col gap-4">
      {PASOS.map((p, i) => (
        <li key={p.titulo} className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-label text-accent-ink"
          >
            {i + 1}
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <p className="flex items-center gap-2 text-label text-text">
              {p.icono ? (
                <p.icono aria-hidden="true" className="size-5 shrink-0" />
              ) : null}
              <span>
                <span className="sr-only">Paso {i + 1}: </span>
                {p.titulo}
              </span>
            </p>
            <p className="text-small text-text-2">{p.detalle}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** «Ábrela en Safari»: navegador de terceros o integrado en otra app. */
function AbrirEnSafari() {
  async function copiar() {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      toast(TOAST_COPIADO);
    } catch {
      toast(TOAST_NO_COPIO);
    }
  }
  return (
    <div className="flex flex-col gap-4">
      <ol className="list-decimal flex flex-col gap-2 pl-5 text-small text-text">
        {PASOS_SAFARI.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ol>
      <Button variant="secondary" onClick={() => void copiar()}>
        {COPIAR}
      </Button>
    </div>
  );
}

/**
 * Botón «Instalar KREA» de iPhone/iPad (D393): en iOS no hay `beforeinstallprompt`, así que abre un
 * diálogo con los pasos. El contenido depende del navegador (Safari, otro navegador, o dentro de
 * otra app) porque «Agregar a inicio» solo es fiable en Safari.
 */
export function InstalarIOS({ estado }: { estado: EstadoInstalacion }) {
  const [abierto, setAbierto] = useState(false);
  const safari = estado === "ios";
  return (
    <div className="flex flex-col items-start gap-2">
      <p className="text-small text-text-2">{DESC_BOTON}</p>
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogTrigger asChild>
          <Button variant="secondary">{BOTON}</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{safari ? TITULO : TITULO_OTRO}</DialogTitle>
            <DialogDescription>
              {safari
                ? DESC_SAFARI
                : estado === "ios-en-app"
                  ? DESC_EN_APP
                  : DESC_OTRO_NAV}
            </DialogDescription>
          </DialogHeader>
          {safari ? <PasosSafari /> : <AbrirEnSafari />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
