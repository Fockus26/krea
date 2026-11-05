"use client";
// Nueva contraseña conectada (fase 07, D188): guarda con el `oobCode` del enlace en una Server
// Action (Identity Toolkit + revocación) y lleva a Ingresar con el aviso. Enlace vencido o ya
// usado → «Este enlace ya venció».
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { restablecerPassword } from "@/lib/acciones/recuperar";
import {
  AVISO_PASSWORD_NUEVA,
  ERROR_RESTABLECER,
  type ErrorRestablecer,
} from "@/lib/recuperar";
import { RUTA_INGRESAR } from "@/lib/sesion";
import { NewPasswordForm } from "./new-password-form";

export function Restablecer({
  oobCode,
  vencido: vencidoInicial,
  pedirOtroHref,
}: {
  oobCode: string;
  vencido: boolean;
  pedirOtroHref: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<ErrorRestablecer | null>(
    vencidoInicial ? "vencido" : null,
  );
  const [pending, startTransition] = useTransition();
  const vista = useRef<HTMLDivElement>(null);
  const vencido = error === "vencido";

  // Si el enlace vence al guardar, el botón desaparece: el foco va al inicio del aviso.
  useEffect(() => {
    if (vencido && !vencidoInicial) vista.current?.focus();
  }, [vencido, vencidoInicial]);

  function guardar(password: string) {
    setError(null);
    startTransition(async () => {
      try {
        const r = await restablecerPassword({ oobCode, password });
        if (!r.ok) {
          setError(r.error);
          return;
        }
        router.replace(`${RUTA_INGRESAR}?aviso=${AVISO_PASSWORD_NUEVA}`);
      } catch {
        setError("red");
      }
    });
  }

  return (
    <div ref={vista} tabIndex={-1} className="outline-none">
      <NewPasswordForm
        vencido={vencido}
        pedirOtroHref={pedirOtroHref}
        pending={pending}
        error={error && error !== "vencido" ? ERROR_RESTABLECER[error] : null}
        onSubmit={guardar}
      />
    </div>
  );
}
