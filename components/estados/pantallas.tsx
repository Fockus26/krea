"use client";

import { Check, Clock, Copy, RefreshCw, WifiOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRutaActual } from "@/components/krea/use-en-linea";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "@/components/ui/sonner";
import {
  accionesNotFound,
  formatFechaHora,
  formatUltimaActualizacion,
  inicioDe,
  type SesionEstado,
  sesionPorRuta,
} from "@/lib/estados";
import { accionEstadoClases, StatusScreen } from "./status-screen";

/*
 * Variantes de la familia de pantallas de estado (HANDOFF §5b, D160–D162). Cliente: el 404 lee la
 * dirección pedida (sesión supuesta, D160), el 500 copia el código y las dos reintentan.
 */

const recargar = () => window.location.reload();

/**
 * 404. Sin `sesion`, la deduce de la dirección en el cliente (el 404 estático no la conoce:
 * en el servidor sale «sin sesión» y al hidratar cambia; fase 07: sesión real en el servidor).
 */
export function PantallaNotFound({ sesion }: { sesion?: SesionEstado }) {
  const ruta = useRutaActual();
  const s = sesion !== undefined ? sesion : ruta ? sesionPorRuta(ruta) : null;
  const [principal, secundaria] = accionesNotFound(s);
  return (
    <StatusScreen
      sesion={s}
      codigo="404"
      eyebrow="Error 404"
      titulo="Esta página se fue de recreo"
      linea="La dirección no existe o esa tarea ya no está publicada."
      acciones={
        <>
          <Button asChild className={accionEstadoClases}>
            <Link href={principal.href}>{principal.label}</Link>
          </Button>
          <Button asChild variant="secondary" className={accionEstadoClases}>
            <Link href={secundaria.href}>{secundaria.label}</Link>
          </Button>
        </>
      }
    />
  );
}

function BotonReintentar({ onRetry }: { onRetry: () => void }) {
  return (
    <Button type="button" onClick={onRetry} className={accionEstadoClases}>
      <RefreshCw aria-hidden="true" />
      Reintentar
    </Button>
  );
}

/** Caja del código de soporte + copiar (toast «Código copiado») + fecha y hora del fallo. */
function CodigoSoporte({ codigo }: { codigo: string }) {
  // Hora del fallo: la del primer render de la pantalla
  const [cuando] = useState(() => new Date());
  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
      toast("Código copiado");
    } catch {
      toast.error("No se pudo copiar. Anótalo a mano.");
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex h-11 items-center gap-2 rounded-nav bg-surface-2 pr-1.5 pl-3.5 text-code text-text">
        {codigo}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon
          aria-label={`Copiar código ${codigo}`}
          onClick={copiar}
        >
          <Copy aria-hidden="true" />
        </Button>
      </span>
      <time
        dateTime={cuando.toISOString()}
        suppressHydrationWarning
        className="text-small text-text-2"
      >
        {formatFechaHora(cuando)}
      </time>
    </div>
  );
}

/** 500 con código (`codigo`) o sin código. Monta su propio Toaster: no vive dentro del shell. */
export function Pantalla500({
  sesion = null,
  codigo,
  onRetry = recargar,
}: {
  sesion?: SesionEstado;
  codigo: string | null;
  onRetry?: () => void;
}) {
  return (
    <>
      <StatusScreen
        sesion={sesion}
        codigo="500"
        eyebrow="Error 500"
        titulo="Algo se nos rompió por dentro"
        linea={
          codigo
            ? "No es tu culpa. Intenta de nuevo; si sigue pasando, mándale este código a tu profe."
            : "No es tu culpa. Intenta de nuevo en un momento."
        }
        extra={codigo ? <CodigoSoporte codigo={codigo} /> : null}
        acciones={
          <>
            <BotonReintentar onRetry={onRetry} />
            <Button asChild variant="secondary" className={accionEstadoClases}>
              <Link href={inicioDe(sesion)}>Ir al inicio</Link>
            </Button>
          </>
        }
      />
      <Toaster />
    </>
  );
}

/** Sin conexión y nada en caché. `ultimaActualizacion`: hora de los datos guardados, si hay. */
export function PantallaSinConexion({
  sesion = null,
  ultimaActualizacion,
  onRetry = recargar,
}: {
  sesion?: SesionEstado;
  ultimaActualizacion?: Date;
  onRetry?: () => void;
}) {
  return (
    <StatusScreen
      sesion={sesion}
      icono={WifiOff}
      eyebrow="Sin conexión"
      titulo="Se te fue la señal"
      linea="Revisa esto y vuelve a intentar:"
      extra={
        <ul className="flex flex-col gap-2 text-small text-text">
          <li className="flex items-center gap-2">
            <Check
              aria-hidden="true"
              className="size-4 shrink-0 text-accent-ink"
            />
            Activa los datos o conéctate a un wifi.
          </li>
          <li className="flex items-center gap-2">
            <Check
              aria-hidden="true"
              className="size-4 shrink-0 text-accent-ink"
            />
            Si te queda poco saldo, prueba más tarde.
          </li>
          {ultimaActualizacion ? (
            <li className="flex items-center gap-2">
              <Clock
                aria-hidden="true"
                className="size-4 shrink-0 text-accent-ink"
              />
              <span suppressHydrationWarning>
                Última actualización:{" "}
                {formatUltimaActualizacion(ultimaActualizacion, new Date())}
              </span>
            </li>
          ) : null}
        </ul>
      }
      acciones={<BotonReintentar onRetry={onRetry} />}
    />
  );
}
