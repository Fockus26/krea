"use client";

import { Eye, EyeOff } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input, type InputProps } from "@/components/ui/input";

type PasswordInputProps = Omit<InputProps, "type" | "trailing"> & {
  /** Qué sugiere el gestor de contraseñas: "current-password" (ingresar) o "new-password". */
  autoComplete: "current-password" | "new-password";
};

/**
 * Contraseña con ojo — HANDOFF §2.2. El botón es `ghost` icono `sm`, con `aria-pressed` y
 * `aria-label` "Mostrar contraseña" / "Ocultar contraseña". `autoComplete` es obligatorio: lo
 * decide quien llama. Oculta por defecto.
 */
function PasswordInput({ ref, disabled, ...props }: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false);

  return (
    <Input
      ref={ref}
      type={visible ? "text" : "password"}
      disabled={disabled}
      // Visible el texto, el corrector y las mayúsculas automáticas estorban
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      {...props}
      trailing={
        <Button
          variant="ghost"
          size="sm"
          icon
          className="-mr-2"
          aria-pressed={visible}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          disabled={disabled}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </Button>
      }
    />
  );
}

export { PasswordInput, type PasswordInputProps };
