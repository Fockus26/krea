"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useState } from "react";
import { PasswordInput } from "@/components/krea/password-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
  coinciden,
  PASSWORD_MIN,
  PASSWORDS_COINCIDEN,
  PASSWORDS_NO_COINCIDEN,
  passwordFaltanTexto,
  passwordOkTexto,
  validarPassword,
} from "@/lib/auth";
import { AuthHeading } from "./auth-heading";
import { focusPrimerInvalido } from "./focus-invalid";

/**
 * Nueva contraseña (HANDOFF §3) con validación en vivo: el mínimo se confirma en verde al
 * cumplirse y la repetición dice si coincide. Los errores en rojo aparecen al enviar (no
 * mientras se escribe); al enviar con errores el foco va al primer campo inválido.
 * `vencido`: el enlace ya no sirve → "Este enlace ya venció" + "Pedir otro enlace".
 * `error`: respuesta del servidor al guardar (alerta sobre el botón).
 * `titulo` / `descripcion`: los cambia «Crea tu contraseña» tras la temporal (D232).
 */
export function NewPasswordForm({
  vencido = false,
  pedirOtroHref,
  pending = false,
  error,
  onSubmit,
  titulo = "Crea tu nueva contraseña",
  descripcion,
}: {
  vencido?: boolean;
  pedirOtroHref: string;
  pending?: boolean;
  error?: string | null;
  onSubmit?: (password: string) => void;
  titulo?: string;
  descripcion?: ReactNode;
}) {
  const [pw, setPw] = useState("");
  const [repetida, setRepetida] = useState("");
  const [enviado, setEnviado] = useState(false);

  if (vencido) {
    return (
      <div className="flex flex-col gap-6">
        <AuthHeading title="Este enlace ya venció">
          Los enlaces vencen en 1 hora y sirven una sola vez. Pide otro con tu
          cédula.
        </AuthHeading>
        <Button asChild size="lg" block>
          <Link href={pedirOtroHref}>Pedir otro enlace</Link>
        </Button>
      </div>
    );
  }

  const v = validarPassword(pw);
  const igual = coinciden(pw, repetida);

  const errorPw =
    enviado && v.estado !== "ok"
      ? v.estado === "vacia"
        ? `Escribe una contraseña de al menos ${PASSWORD_MIN} caracteres.`
        : passwordFaltanTexto(v.faltan)
      : null;
  const errorRep = enviado && igual !== true ? PASSWORDS_NO_COINCIDEN : null;

  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviado(true);
    if (v.estado !== "ok" || igual !== true) {
      focusPrimerInvalido(e.currentTarget);
      return;
    }
    onSubmit?.(pw);
  }

  return (
    <div className="flex flex-col gap-6">
      <AuthHeading title={titulo}>
        {descripcion ?? (
          <>
            Mínimo {PASSWORD_MIN} caracteres. Algo que recuerdes y que nadie
            adivine.
          </>
        )}
      </AuthHeading>
      <form
        method="post"
        noValidate
        onSubmit={enviar}
        className="flex flex-col gap-5"
      >
        <Field
          label="Nueva contraseña"
          help={
            !errorPw && v.estado === "corta"
              ? passwordFaltanTexto(v.faltan)
              : undefined
          }
          error={errorPw}
          success={v.estado === "ok" ? passwordOkTexto(v.largo) : undefined}
          announce={false}
        >
          <PasswordInput
            name="password"
            autoComplete="new-password"
            value={pw}
            onChange={(e) => setPw(e.currentTarget.value)}
          />
        </Field>
        <Field
          label="Repite la contraseña"
          error={errorRep}
          success={
            igual === true && v.estado === "ok"
              ? PASSWORDS_COINCIDEN
              : undefined
          }
          announce={false}
        >
          <PasswordInput
            name="password-repetida"
            autoComplete="new-password"
            value={repetida}
            onChange={(e) => setRepetida(e.currentTarget.value)}
          />
        </Field>
        {error ? (
          <Alert variant="err">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Button
          type="submit"
          size="lg"
          block
          loading={pending}
          loadingLabel="Guardando…"
        >
          Guardar contraseña
        </Button>
      </form>
    </div>
  );
}
