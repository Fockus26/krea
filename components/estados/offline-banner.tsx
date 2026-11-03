"use client";

import { WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { mensajeSinConexion, TOAST_EN_LINEA_MS } from "@/lib/estados";
import type { Rol } from "@/lib/layout";
import { cn } from "@/lib/utils";

/*
 * Banner «Sin conexión» con datos en pantalla (HANDOFF §5b, D164): no es pantalla, flota sobre la
 * app a 12 px de los bordes bajo la topbar (`z-offline`). Fondo #221D2B, texto #F4F1F8 14/20 600,
 * WifiOff #FFC23D, «Reintentar». Se oculta solo al volver la red y avisa «Volviste a estar en
 * línea» (toast 3 s, en el Toaster del grupo).
 */

/** Presentación (también la usa la galería `/estados`, sin posición fija). */
export function OfflineBannerVista({
  mensaje,
  onRetry,
  className,
}: {
  mensaje: string;
  onRetry: () => void;
  className?: string;
}) {
  return (
    <div
      data-slot="offline-banner"
      className={cn(
        "flex items-center gap-3 rounded-md bg-offline py-2 pr-2 pl-4 text-banner text-offline shadow-3",
        className,
      )}
    >
      <WifiOff
        aria-hidden="true"
        className="size-5 shrink-0 text-offline-icon"
      />
      <p className="min-w-0 flex-1">{mensaje}</p>
      <button
        type="button"
        onClick={onRetry}
        className={cn(
          "inline-flex h-9 shrink-0 cursor-pointer items-center rounded-nav px-3.5 text-button-sm text-current",
          "transition-colors duration-fast ease-krea hover:bg-current/10",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current",
        )}
      >
        Reintentar
      </button>
    </div>
  );
}

/**
 * Escucha la red y pinta el banner mientras no hay conexión. La hora de los datos es la del
 * momento en que se fue la red (lo último cargado en línea); en la fase 07, la de la caché.
 */
export function OfflineBanner({ rol }: { rol: Rol }) {
  const router = useRouter();
  const [desde, setDesde] = useState<Date | null>(null);

  useEffect(() => {
    const sinRed = () => setDesde(new Date());
    const conRed = () => {
      setDesde(null);
      toast("Volviste a estar en línea", { duration: TOAST_EN_LINEA_MS });
    };
    if (!navigator.onLine) sinRed();
    window.addEventListener("offline", sinRed);
    window.addEventListener("online", conRed);
    return () => {
      window.removeEventListener("offline", sinRed);
      window.removeEventListener("online", conRed);
    };
  }, []);

  // La región viva (`<output>`, rol status) existe siempre: así el aviso se anuncia al aparecer
  return (
    <output aria-live="polite">
      {desde ? (
        <OfflineBannerVista
          mensaje={mensajeSinConexion(rol, desde)}
          onRetry={() => router.refresh()}
          className="fixed inset-offline z-offline"
        />
      ) : null}
    </output>
  );
}
