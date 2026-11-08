"use client";
// Ingresar con Better Auth (D008, D180, D327): login con el email interno contra /api/auth (con
// límite de intentos); la cookie httpOnly la pone el servidor. Luego el servidor dice a dónde ir.
import { Suspense, useState, useTransition } from "react";
import { confirmarIngreso } from "@/lib/acciones/sesion";
import { type ErrorIngreso, errorIngresoDeEstado } from "@/lib/auth";
import { authCliente } from "@/lib/auth-cliente";
import { emailInterno } from "@/lib/modelo";
import { AvisoIngreso } from "./aviso-ingreso";
import { LoginForm } from "./login-form";

export function Ingresar({ recuperarHref }: { recuperarHref: string }) {
  const [error, setError] = useState<ErrorIngreso | undefined>();
  const [pending, startTransition] = useTransition();

  function entrar({ cedula, password }: { cedula: string; password: string }) {
    setError(undefined);
    startTransition(async () => {
      try {
        const { error: fallo } = await authCliente.signIn.email({
          email: emailInterno(cedula),
          password,
        });
        if (fallo) {
          setError(errorIngresoDeEstado(fallo.status));
          return;
        }
        const r = await confirmarIngreso();
        if (!r.ok) {
          setError(r.error);
          return;
        }
        // Carga completa, no el router (D251): si se llegó aquí sin pasar por /salir (sesión
        // vencida), no queda en memoria nada de la cuenta anterior para la nueva.
        window.location.replace(r.destino);
      } catch {
        setError("red");
      }
    });
  }

  return (
    <LoginForm
      recuperarHref={recuperarHref}
      error={error}
      pending={pending}
      aviso={
        <Suspense fallback={null}>
          <AvisoIngreso />
        </Suspense>
      }
      onSubmit={entrar}
    />
  );
}
