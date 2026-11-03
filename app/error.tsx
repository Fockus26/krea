"use client";

import { useEffect } from "react";
import {
  Pantalla500,
  PantallaSinConexion,
} from "@/components/estados/pantallas";
import { useEnLinea, useRutaActual } from "@/components/krea/use-en-linea";
import { codigoError, digestDe, sesionPorRuta } from "@/lib/estados";

/**
 * Error de cualquier página (HANDOFF §5b). En la raíz: reemplaza al shell, sin barras. Elige por
 * la red (D161): sin conexión → «Se te fue la señal»; con red → 500 con código (`KR-500-…` del
 * `digest`, si lo hay) o sin código. «Reintentar» vuelve a pedir y pintar el segmento (`retry`).
 */
export default function ErrorPagina({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const enLinea = useEnLinea();
  const ruta = useRutaActual();
  const sesion = ruta ? sesionPorRuta(ruta) : null;

  useEffect(() => {
    // Hasta la fase 07 no hay servicio de registro: queda en la consola del navegador
    console.error(error);
  }, [error]);

  if (!enLinea) return <PantallaSinConexion sesion={sesion} onRetry={retry} />;
  return (
    <Pantalla500
      sesion={sesion}
      codigo={codigoError(500, digestDe(error))}
      onRetry={retry}
    />
  );
}
