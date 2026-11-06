"use client";
// «Crea tu contraseña» (D232): la cuenta entró con la contraseña temporal que le dio el profe y
// ninguna otra ruta de su rol carga hasta crear la suya. Reutiliza Nueva contraseña (validación en
// vivo, foco al primer inválido); guarda con `crearPassword` y va a su inicio con la sesión nueva.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { crearPassword } from "@/lib/acciones/perfil";
import { PASSWORD_MIN } from "@/lib/auth";
import { ERROR_CAMBIO_PASSWORD } from "@/lib/perfil";
import { NewPasswordForm } from "./new-password-form";

export function CrearPassword() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Doble envío: la transición deshabilita el botón, y esto corta un segundo submit en el mismo tick
  const enviando = useRef(false);

  function guardar(password: string) {
    if (enviando.current) return;
    enviando.current = true;
    setError(null);
    startTransition(async () => {
      try {
        const r = await crearPassword({ nueva: password });
        if (r.ok) {
          router.replace(r.destino);
          return;
        }
        setError(ERROR_CAMBIO_PASSWORD[r.error]);
      } catch {
        setError(ERROR_CAMBIO_PASSWORD.red);
      } finally {
        enviando.current = false;
      }
    });
  }

  return (
    <>
      <NewPasswordForm
        titulo="Crea tu contraseña"
        descripcion={
          // PROVISIONAL (CONTENT_CHECKLIST fila 138)
          <>
            Entraste con una contraseña temporal. Crea la tuya para seguir:
            mínimo {PASSWORD_MIN} caracteres, algo que recuerdes y que nadie
            adivine.
          </>
        }
        pedirOtroHref="/recuperar"
        pending={pending}
        error={error}
        onSubmit={guardar}
      />
      <p className="text-small text-text-2">
        ¿No es tu cuenta?{" "}
        <Link
          href="/salir"
          className="text-small-b inline-flex min-h-11 items-center rounded-sm text-accent-ink underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Cerrar sesión
        </Link>
      </p>
    </>
  );
}
