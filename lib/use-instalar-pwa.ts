"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type EstadoInstalacion,
  esDispositivoIOS,
  estadoInstalacion,
} from "@/lib/instalar-pwa";

type EventoInstalacion = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Estado de instalación solo en el cliente: el primer render (y el del servidor) es `null`, así no
 * hay desajuste de hidratación; tras montar pasa al estado real.
 */
export function useInstalarPwa(): {
  estado: EstadoInstalacion | null;
  instalar: () => Promise<void>;
} {
  const [estado, setEstado] = useState<EstadoInstalacion | null>(null);
  const evento = useRef<EventoInstalacion | null>(null);

  const calcular = useCallback(() => {
    const nav = navigator as Navigator & { standalone?: boolean };
    setEstado(
      estadoInstalacion({
        standalone: window.matchMedia("(display-mode: standalone)").matches,
        iosStandalone: nav.standalone === true,
        esIOS: esDispositivoIOS(
          nav.platform,
          nav.userAgent,
          nav.maxTouchPoints,
        ),
        hayEvento: evento.current !== null,
      }),
    );
  }, []);

  useEffect(() => {
    const alLlegar = (e: Event) => {
      e.preventDefault();
      evento.current = e as EventoInstalacion;
      calcular();
    };
    const alInstalar = () => {
      evento.current = null;
      setEstado("instalada");
    };
    window.addEventListener("beforeinstallprompt", alLlegar);
    window.addEventListener("appinstalled", alInstalar);
    calcular();
    return () => {
      window.removeEventListener("beforeinstallprompt", alLlegar);
      window.removeEventListener("appinstalled", alInstalar);
    };
  }, [calcular]);

  const instalar = useCallback(async () => {
    const ev = evento.current;
    if (!ev) return;
    await ev.prompt();
    await ev.userChoice;
    // El evento solo sirve una vez; si aceptó, `appinstalled` oculta el botón
    evento.current = null;
    calcular();
  }, [calcular]);

  return { estado, instalar };
}
