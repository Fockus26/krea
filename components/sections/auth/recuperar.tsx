"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { pedirEnlace } from "@/lib/acciones/recuperar";
// Recuperar conectado (fase 07, D186): pide el enlace a la Server Action y pasa a «Revisa tu
// correo» en el sitio (la cédula queda en memoria para «Reenviar enlace»). La respuesta es la
// misma exista o no la cuenta; solo un fallo de red se ve como error.
import { relanzarSiEsDeploy, siNoEsDeploy } from "@/lib/recarga-deploy";
import { ERROR_PEDIR_ENLACE } from "@/lib/recuperar";
import { RecoverForm } from "./recover-form";
import { RecoverSent } from "./recover-sent";

export function Recuperar({ volverHref }: { volverHref: string }) {
  const [enviadoA, setEnviadoA] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const vista = useRef<HTMLDivElement>(null);

  // Al cambiar de pantalla sin cambiar de ruta, el foco va al inicio de la nueva.
  useEffect(() => {
    if (enviadoA) vista.current?.focus();
  }, [enviadoA]);

  function pedir(cedula: string) {
    setError(null);
    startTransition(async () => {
      try {
        await pedirEnlace({ cedula });
        setEnviadoA(cedula);
      } catch (e) {
        relanzarSiEsDeploy(e);
        setError(ERROR_PEDIR_ENLACE);
      }
    });
  }

  if (enviadoA) {
    return (
      <div ref={vista} tabIndex={-1} className="outline-none">
        <RecoverSent
          volverHref={volverHref}
          onReenviar={() => {
            pedirEnlace({ cedula: enviadoA }).catch(siNoEsDeploy(undefined));
          }}
        />
      </div>
    );
  }

  return (
    <RecoverForm
      volverHref={volverHref}
      pending={pending}
      error={error}
      onSubmit={pedir}
    />
  );
}
