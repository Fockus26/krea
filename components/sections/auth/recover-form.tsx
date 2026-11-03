"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { CedulaInput } from "@/components/krea/cedula-input";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { validateCedula } from "@/lib/cedula";
import { AuthHeading } from "./auth-heading";
import { focusPrimerInvalido } from "./focus-invalid";
import { VolverLink } from "./volver-link";

/**
 * Recuperar contraseña (HANDOFF §3): cédula y "Enviar enlace". Valida al enviar; `onSubmit`
 * recibe la cédula (la fase 07 genera el enlace con el Admin SDK, §9 #9). La respuesta no dice
 * si la cédula existe: la pantalla siguiente es siempre "Revisa tu correo".
 */
export function RecoverForm({
  volverHref,
  enviadoHref,
  pending = false,
  onSubmit,
}: {
  volverHref: string;
  /** Pantalla a la que pasa tras validar (D134); sin ella solo llama a `onSubmit`. */
  enviadoHref?: string;
  pending?: boolean;
  onSubmit?: (cedula: string) => void;
}) {
  const [cedula, setCedula] = useState("");
  const [enviado, setEnviado] = useState(false);
  const router = useRouter();
  const error = enviado ? validateCedula(cedula) : null;

  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviado(true);
    if (validateCedula(cedula)) {
      focusPrimerInvalido(e.currentTarget);
      return;
    }
    onSubmit?.(cedula);
    if (enviadoHref) router.push(enviadoHref);
  }

  return (
    <div className="flex flex-col gap-6">
      <VolverLink href={volverHref} />
      <AuthHeading title="Recupera tu contraseña">
        Escribe tu cédula y te enviamos un enlace al correo que tu profe tiene
        registrado.
      </AuthHeading>
      <form noValidate onSubmit={enviar} className="flex flex-col gap-5">
        <Field label="Cédula" error={error} announce={false}>
          <CedulaInput
            name="cedula"
            placeholder="Ej. 33272397"
            value={cedula}
            onChange={(e) => setCedula(e.currentTarget.value)}
          />
        </Field>
        <Button
          type="submit"
          size="lg"
          block
          loading={pending}
          loadingLabel="Enviando…"
        >
          Enviar enlace
        </Button>
      </form>
    </div>
  );
}
