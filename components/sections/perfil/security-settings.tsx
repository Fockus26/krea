"use client";

import { KeyRound, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { ErrorEnPantalla } from "@/components/estados/errores";
import { PasswordInput } from "@/components/krea/password-input";
import { focusPrimerInvalido } from "@/components/sections/auth/focus-invalid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import {
  coinciden,
  PASSWORD_MIN,
  PASSWORD_VACIA,
  PASSWORDS_COINCIDEN,
  PASSWORDS_NO_COINCIDEN,
  passwordFaltanTexto,
  passwordOkTexto,
  validarPassword,
} from "@/lib/auth";

/**
 * "Seguridad" de Perfil (HANDOFF §3 Perfil §5): "Cambiar contraseña" (secondary) abre un diálogo
 * con la actual, la nueva y su repetición, con la misma validación en vivo que Nueva contraseña
 * (D070: errores al enviar, foco al primer inválido); "Cerrar sesión" (ghost `--error`) pide
 * confirmación en otro diálogo. `onCambiar` hace el cambio (D192): si devuelve un error, el
 * diálogo sigue abierto y lo muestra (en «Contraseña actual» si es esa la que no coincide).
 */
export function SecuritySettings({
  salirHref,
  onCambiar,
}: {
  /** A dónde ir al cerrar sesión. */
  salirHref: string;
  onCambiar?: (datos: {
    actual: string;
    nueva: string;
  }) => Promise<ErrorCambio | null> | undefined;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-h3 text-text">Seguridad</h2>
      <div className="flex flex-wrap gap-3">
        <Dialog open={abierto} onOpenChange={setAbierto}>
          <DialogTrigger asChild>
            <Button variant="secondary">
              <KeyRound aria-hidden="true" />
              Cambiar contraseña
            </Button>
          </DialogTrigger>
          <DialogContent>
            <CambiarPassword
              onListo={async (datos) => {
                const error = (await onCambiar?.(datos)) ?? null;
                if (!error) setAbierto(false);
                return error;
              }}
            />
          </DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className="text-error">
              <LogOut aria-hidden="true" />
              Cerrar sesión
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Cerrar sesión?</DialogTitle>
              <DialogDescription>
                Para volver a entrar necesitas tu cédula y tu contraseña.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Cancelar</Button>
              </DialogClose>
              <Button variant="danger" onClick={() => router.push(salirHref)}>
                <LogOut aria-hidden="true" />
                Cerrar sesión
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}

/** Error del servidor al cambiar: en el campo de la actual, o general (arriba del pie). */
export type ErrorCambio = { campo: "actual" | "general"; mensaje: string };

function CambiarPassword({
  onListo,
}: {
  onListo: (datos: {
    actual: string;
    nueva: string;
  }) => Promise<ErrorCambio | null>;
}) {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetida, setRepetida] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [errorServidor, setErrorServidor] = useState<ErrorCambio | null>(null);
  const [pending, startTransition] = useTransition();

  const v = validarPassword(nueva);
  const igual = coinciden(nueva, repetida);
  const errorActual =
    enviado && actual === ""
      ? PASSWORD_VACIA
      : errorServidor?.campo === "actual"
        ? errorServidor.mensaje
        : null;
  const errorNueva =
    enviado && v.estado !== "ok"
      ? v.estado === "vacia"
        ? `Escribe una contraseña de al menos ${PASSWORD_MIN} caracteres.`
        : passwordFaltanTexto(v.faltan)
      : null;
  const errorRep = enviado && igual !== true ? PASSWORDS_NO_COINCIDEN : null;

  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviado(true);
    setErrorServidor(null);
    const form = e.currentTarget;
    if (actual === "" || v.estado !== "ok" || igual !== true) {
      focusPrimerInvalido(form);
      return;
    }
    startTransition(async () => {
      const error = await onListo({ actual, nueva });
      setErrorServidor(error);
      // El campo con error recibe el foco (D070); el general lo anuncia la alerta
      if (error?.campo === "actual") focusPrimerInvalido(form);
    });
  }

  return (
    <form noValidate onSubmit={enviar} className="flex flex-col gap-5">
      <DialogHeader>
        <DialogTitle>Cambiar contraseña</DialogTitle>
        <DialogDescription>
          Mínimo {PASSWORD_MIN} caracteres. Algo que recuerdes y que nadie
          adivine.
        </DialogDescription>
      </DialogHeader>
      <Field label="Contraseña actual" error={errorActual} announce={false}>
        <PasswordInput
          name="password-actual"
          autoComplete="current-password"
          value={actual}
          onChange={(e) => {
            setActual(e.currentTarget.value);
            if (errorServidor?.campo === "actual") setErrorServidor(null);
          }}
        />
      </Field>
      <Field
        label="Nueva contraseña"
        help={
          !errorNueva && v.estado === "corta"
            ? passwordFaltanTexto(v.faltan)
            : undefined
        }
        error={errorNueva}
        success={v.estado === "ok" ? passwordOkTexto(v.largo) : undefined}
        announce={false}
      >
        <PasswordInput
          name="password"
          autoComplete="new-password"
          value={nueva}
          onChange={(e) => setNueva(e.currentTarget.value)}
        />
      </Field>
      <Field
        label="Repite la contraseña"
        error={errorRep}
        success={
          igual === true && v.estado === "ok" ? PASSWORDS_COINCIDEN : undefined
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
      {errorServidor?.campo === "general" ? (
        <ErrorEnPantalla titulo="No se guardó la contraseña">
          {errorServidor.mensaje}
        </ErrorEnPantalla>
      ) : null}
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="secondary">Cancelar</Button>
        </DialogClose>
        <Button type="submit" loading={pending}>
          Guardar contraseña
        </Button>
      </DialogFooter>
    </form>
  );
}
