"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  CLAVE_EVENTO_INSTALAR,
  type EstadoInstalacion,
  esDispositivoIOS,
  estadoInstalacion,
  navegadorDeIOS,
} from "@/lib/instalar-pwa";

type EventoInstalacion = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/*
 * Almacén de la página (D371): Chrome dispara `beforeinstallprompt` UNA vez por carga, en la
 * primera página que se abre (casi siempre Inicio). Si solo Perfil lo escuchara, al llegar a Perfil
 * navegando ya se habría perdido y el botón no saldría nunca. Por eso se escucha desde que arranca
 * cualquier página (`escucharInstalacion`, llamado por `RegistroServiceWorker`) y Perfil solo lee.
 */
let evento: EventoInstalacion | null = null;
let instalada = false;
let escuchando = false;
let estado: EstadoInstalacion | null = null;
const oyentes = new Set<() => void>();

function recalcular() {
  const nav = navigator as Navigator & { standalone?: boolean };
  estado = instalada
    ? "instalada"
    : estadoInstalacion({
        standalone: window.matchMedia("(display-mode: standalone)").matches,
        iosStandalone: nav.standalone === true,
        esIOS: esDispositivoIOS(
          nav.platform,
          nav.userAgent,
          nav.maxTouchPoints,
        ),
        navegadorIOS: navegadorDeIOS(nav.userAgent),
        hayEvento: evento !== null,
      });
  for (const o of oyentes) o();
}

/** Empieza a escuchar el aviso de instalación; idempotente. Llamarlo al cargar cualquier página. */
export function escucharInstalacion() {
  if (escuchando || typeof window === "undefined") return;
  escuchando = true;
  // Lo que el script del <head> guardó antes de hidratar
  const temprano = (window as unknown as Record<string, unknown>)[
    CLAVE_EVENTO_INSTALAR
  ];
  if (temprano) evento = temprano as EventoInstalacion;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    evento = e as EventoInstalacion;
    recalcular();
  });
  window.addEventListener("appinstalled", () => {
    evento = null;
    instalada = true;
    recalcular();
  });
  recalcular();
}

function suscribir(oyente: () => void) {
  escucharInstalacion();
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

/**
 * Estado de instalación solo en el cliente: en el servidor (y al hidratar) es `null`, así no hay
 * desajuste de hidratación; tras montar pasa al estado real.
 */
export function useInstalarPwa(): {
  estado: EstadoInstalacion | null;
  instalar: () => Promise<void>;
} {
  const actual = useSyncExternalStore(
    suscribir,
    () => estado,
    () => null,
  );

  const instalar = useCallback(async () => {
    const ev = evento;
    if (!ev) return;
    await ev.prompt();
    await ev.userChoice;
    // El evento solo sirve una vez; si aceptó, `appinstalled` oculta el botón
    evento = null;
    recalcular();
  }, []);

  return { estado: actual, instalar };
}
