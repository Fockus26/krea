"use client";

import { Info, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { REENVIO_SEGUNDOS, reenviarTexto } from "@/lib/auth";
import { maskEmail } from "@/lib/mask";
import { AuthHeading } from "./auth-heading";

/**
 * "Revisa tu correo" (HANDOFF §3): correo enmascarado (primera letra + 4 puntos + dominio), dos
 * consejos y "Reenviar enlace" deshabilitado con cuenta regresiva de 60 s. La cuenta no se
 * anuncia segundo a segundo: el texto del botón cambia y se lee al enfocarlo.
 */
export function RecoverSent({
  email,
  volverHref,
  segundos = REENVIO_SEGUNDOS,
  onReenviar,
}: {
  /** Correo completo: aquí se enmascara. */
  email: string;
  volverHref: string;
  /** Segundos de espera al montar (60). */
  segundos?: number;
  onReenviar?: () => void;
}) {
  const [restan, setRestan] = useState(segundos);

  useEffect(() => {
    if (restan <= 0) return;
    const t = window.setTimeout(() => setRestan((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [restan]);

  function reenviar() {
    onReenviar?.();
    setRestan(REENVIO_SEGUNDOS);
  }

  return (
    <div className="flex flex-col gap-6">
      <span className="grid size-18 place-items-center rounded-lg bg-accent-soft text-accent-ink">
        <Mail aria-hidden="true" className="size-8" />
      </span>
      <AuthHeading title="Revisa tu correo">
        Enviamos un enlace a{" "}
        <strong className="text-text">{maskEmail(email)}</strong>. Vence en{" "}
        <strong className="text-text">1 hora</strong> y sirve una sola vez.
      </AuthHeading>
      <ul className="text-body flex flex-col gap-2 text-text">
        <li className="flex items-start gap-2">
          <Info
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-accent-ink"
          />
          <span>
            ¿No llega en 5 minutos? Revisa <strong>Spam</strong> o{" "}
            <strong>Promociones</strong>.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <Lock
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-accent-ink"
          />
          <span>
            ¿Ya no usas ese correo? Pídele a tu profe que te asigne una
            contraseña nueva en clase.
          </span>
        </li>
      </ul>
      <div className="flex flex-col gap-2">
        <Button asChild size="lg" block>
          <Link href={volverHref}>Volver a entrar</Link>
        </Button>
        <Button
          variant="ghost"
          block
          disabled={restan > 0}
          onClick={reenviar}
          className="nums"
        >
          {reenviarTexto(restan)}
        </Button>
      </div>
    </div>
  );
}
