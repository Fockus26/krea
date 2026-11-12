"use client";

import { useEffect } from "react";
import { registrarServiceWorker } from "@/lib/offline/sw-cliente";
import { escucharInstalacion } from "@/lib/use-instalar-pwa";

/**
 * Registra el service worker al cargar cualquier página (D291) y empieza a escuchar el aviso de
 * instalación de Chrome, que llega una sola vez por carga (D371). No pinta nada.
 */
export function RegistroServiceWorker() {
  useEffect(() => {
    escucharInstalacion();
    registrarServiceWorker();
  }, []);
  return null;
}
