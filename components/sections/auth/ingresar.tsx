"use client";
// Ingresar conectado a Firebase Auth (fase 07, D008, D180): login en el navegador con el email
// interno, y el idToken se cambia en el servidor por la cookie de sesión httpOnly.
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { iniciarSesion } from "@/lib/acciones/sesion";
import { type ErrorIngreso, errorIngresoDeCodigo } from "@/lib/auth";
import { firebaseCliente } from "@/lib/firebase/cliente";
import { emailInterno } from "@/lib/modelo";
import { LoginForm } from "./login-form";

export function Ingresar({ recuperarHref }: { recuperarHref: string }) {
  const router = useRouter();
  const [error, setError] = useState<ErrorIngreso | undefined>();
  const [pending, startTransition] = useTransition();

  function entrar({ cedula, password }: { cedula: string; password: string }) {
    setError(undefined);
    startTransition(async () => {
      const fb = firebaseCliente();
      if (!fb) {
        setError("no-disponible");
        return;
      }
      try {
        const cred = await signInWithEmailAndPassword(
          fb.auth,
          emailInterno(cedula),
          password,
        );
        const r = await iniciarSesion(await cred.user.getIdToken());
        if (!r.ok) {
          await signOut(fb.auth);
          setError(r.error);
          return;
        }
        router.replace(r.destino);
      } catch (e) {
        setError(errorIngresoDeCodigo((e as { code?: string }).code));
      }
    });
  }

  return (
    <LoginForm
      recuperarHref={recuperarHref}
      error={error}
      pending={pending}
      onSubmit={entrar}
    />
  );
}
