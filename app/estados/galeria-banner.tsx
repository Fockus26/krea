"use client";

import { OfflineBannerVista } from "@/components/estados/offline-banner";
import { Toaster, toast } from "@/components/ui/sonner";
import { mensajeSinConexion, TOAST_EN_LINEA_MS } from "@/lib/estados";

/** Banner sin conexión en la galería (D164): en su sitio, sin posición fija, para estudiante y profe. */
export function GaleriaBanner() {
  const hora = new Date();
  hora.setHours(16, 20, 0, 0);
  const avisar = () =>
    toast("Volviste a estar en línea", { duration: TOAST_EN_LINEA_MS });
  return (
    <main
      id="contenido"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-status flex-1 flex-col gap-4 px-5 py-8 md:px-6 md:py-10"
    >
      <h1 className="text-h1">Banner sin conexión</h1>
      <p className="text-body text-text-2">
        Flota a 12 px de los bordes bajo la barra superior mientras no hay red.
        «Reintentar» aquí muestra el aviso de vuelta en línea.
      </p>
      <OfflineBannerVista
        mensaje={mensajeSinConexion("estudiante", hora)}
        onRetry={avisar}
      />
      <OfflineBannerVista
        mensaje={mensajeSinConexion("profesor", hora)}
        onRetry={avisar}
      />
      <Toaster />
    </main>
  );
}
