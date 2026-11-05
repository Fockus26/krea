"use client";

import { useEffect } from "react";
import {
  Pantalla500,
  PantallaSinConexion,
  useSesionPantalla,
} from "@/components/estados/pantallas";
import { useEnLinea } from "@/components/krea/use-en-linea";
import { codigoError, digestDe } from "@/lib/estados";

/**
 * Error de cualquier página (HANDOFF §5b). En la raíz: reemplaza al shell, sin barras. Elige por
 * la red (D161): sin conexión → «Se te fue la señal»; con red → 500 con código (`KR-500-…` del
 * `digest`, si lo hay) o sin código. «Reintentar» vuelve a pedir y pintar el segmento (`retry`).
 * La cabecera lleva la sesión real, que se pide al servidor al montar (D213).
 */
export default function ErrorPagina({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const enLinea = useEnLinea();
  const { sesion, usuario } = useSesionPantalla();

  useEffect(() => {
    // Hasta la fase 07 no hay servicio de registro: queda en la consola del navegador
    console.error(error);
  }, [error]);

  if (!enLinea)
    return (
      <PantallaSinConexion sesion={sesion} usuario={usuario} onRetry={retry} />
    );
  return (
    <Pantalla500
      sesion={sesion}
      usuario={usuario}
      codigo={codigoError(500, digestDe(error))}
      onRetry={retry}
    />
  );
}
