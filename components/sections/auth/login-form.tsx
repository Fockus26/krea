"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useState } from "react";
import { CedulaInput } from "@/components/krea/cedula-input";
import { PasswordInput } from "@/components/krea/password-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { ERROR_INGRESO, type ErrorIngreso, PASSWORD_VACIA } from "@/lib/auth";
import { validateCedula } from "@/lib/cedula";
import { AuthHeading } from "./auth-heading";
import { focusPrimerInvalido } from "./focus-invalid";

/**
 * Ingresar (HANDOFF §3). Valida al enviar (cédula 7–9 dígitos, contraseña no vacía) y entrega
 * los datos a `onSubmit`; la fase 07 conecta Firebase Auth (D008). `error` es la respuesta del
 * servidor: alerta sobre el botón que no dice cuál de los dos campos falló. `aviso`: hueco sobre
 * el formulario (p. ej. «tu contraseña cambió», D188).
 */
export function LoginForm({
  recuperarHref,
  error,
  pending = false,
  aviso,
  onSubmit,
}: {
  recuperarHref: string;
  error?: ErrorIngreso;
  aviso?: ReactNode;
  pending?: boolean;
  onSubmit?: (datos: { cedula: string; password: string }) => void;
}) {
  const [cedula, setCedula] = useState("");
  const [password, setPassword] = useState("");
  const [enviado, setEnviado] = useState(false);

  const errorCedula = enviado ? validateCedula(cedula) : null;
  const errorPassword = enviado && password === "" ? PASSWORD_VACIA : null;

  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviado(true);
    if (validateCedula(cedula) || password === "") {
      focusPrimerInvalido(e.currentTarget);
      return;
    }
    onSubmit?.({ cedula, password });
  }

  return (
    <div className="flex flex-col gap-6">
      <AuthHeading eyebrow="Escuela Creativa · 5.º año" title="¡Hola de nuevo!">
        Entra con tu cédula y la contraseña que te dio tu profe.
      </AuthHeading>
      {aviso}
      <form noValidate onSubmit={enviar} className="flex flex-col gap-5">
        <Field
          label="Cédula"
          help="Solo números, sin puntos."
          error={errorCedula}
          announce={false}
        >
          <CedulaInput
            name="cedula"
            placeholder="Ej. 33272397"
            value={cedula}
            onChange={(e) => setCedula(e.currentTarget.value)}
          />
        </Field>
        <div className="flex flex-col gap-1">
          <Field label="Contraseña" error={errorPassword} announce={false}>
            <PasswordInput
              name="password"
              autoComplete="current-password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />
          </Field>
          <Link
            href={recuperarHref}
            className="text-small-b self-end rounded-sm text-accent-ink underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Olvidé mi contraseña
          </Link>
        </div>
        {error ? (
          <Alert variant="err">
            <AlertDescription>{ERROR_INGRESO[error]}</AlertDescription>
          </Alert>
        ) : null}
        <Button
          type="submit"
          size="lg"
          block
          loading={pending}
          loadingLabel="Entrando…"
        >
          Entrar
        </Button>
      </form>
      <p className="text-small text-text-2">
        ¿Eres profe? Entras aquí mismo con tu cédula y te llevamos a tu panel.
      </p>
    </div>
  );
}
