"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CARGA_LENTA_MS } from "@/lib/estados";

/**
 * Bajo los skeletons: si la carga pasa de 8 s, «Está tardando más de lo normal» + Reintentar
 * (lienzo Vacios.dc.html; D167). Región viva siempre montada para que se anuncie al aparecer.
 */
export function CargaLenta({ ms = CARGA_LENTA_MS }: { ms?: number }) {
  const [lenta, setLenta] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setLenta(true), ms);
    return () => window.clearTimeout(t);
  }, [ms]);

  return (
    <output aria-live="polite">
      {lenta ? (
        <span className="flex flex-wrap items-center gap-3">
          <span className="text-small text-text-2">
            Está tardando más de lo normal
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw aria-hidden="true" />
            Reintentar
          </Button>
        </span>
      ) : null}
    </output>
  );
}
