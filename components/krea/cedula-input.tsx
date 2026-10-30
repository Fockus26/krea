"use client";

import { IdCard } from "lucide-react";
import type * as React from "react";
import { Input, type InputProps } from "@/components/ui/input";
import { CEDULA_MAX, pasteCedula, sanitizeCedula } from "@/lib/cedula";

type CedulaInputProps = Omit<
  InputProps,
  "type" | "inputMode" | "autoComplete" | "maxLength" | "leading"
>;

/** Escribe `value` en el input como si lo hubiera tecleado la persona (React lo ve como `input`). */
function setNativeValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

/**
 * Cédula — HANDOFF §2.2: `inputmode="numeric"`, `autocomplete="username"`, `maxlength=9`, solo
 * dígitos. Al escribir y al pegar se descartan puntos, espacios y "V-". La validación (7–9
 * dígitos) es `validateCedula` de `lib/cedula.ts`: se la pasas al `error` del `Field`.
 */
function CedulaInput({ onChange, onPaste, ...props }: CedulaInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const limpio = sanitizeCedula(e.currentTarget.value);
    if (limpio !== e.currentTarget.value) e.currentTarget.value = limpio;
    onChange?.(e);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    onPaste?.(e);
    if (e.defaultPrevented) return;
    // El navegador cortaría el pegado por maxlength antes de quitar puntos y "V-"
    e.preventDefault();
    const el = e.currentTarget;
    const { value, caret } = pasteCedula(
      el.value,
      el.selectionStart ?? el.value.length,
      el.selectionEnd ?? el.value.length,
      e.clipboardData.getData("text"),
    );
    setNativeValue(el, value);
    el.setSelectionRange(caret, caret);
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      autoComplete="username"
      maxLength={CEDULA_MAX}
      leading={<IdCard aria-hidden="true" />}
      placeholder="12345678"
      {...props}
      onChange={handleChange}
      onPaste={handlePaste}
    />
  );
}

export { CedulaInput, type CedulaInputProps };
