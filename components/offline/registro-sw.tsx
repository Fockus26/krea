"use client";

import { useEffect } from "react";
import { registrarServiceWorker } from "@/lib/offline/sw-cliente";

/** Registra el service worker al cargar cualquier página (D291). No pinta nada. */
export function RegistroServiceWorker() {
  useEffect(() => {
    registrarServiceWorker();
  }, []);
  return null;
}
