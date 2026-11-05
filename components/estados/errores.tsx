"use client";

import { RefreshCw } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/*
 * Errores dentro de una pantalla (lienzo Vacios.dc.html «Errores dentro de una pantalla», D171).
 * Siempre dicen qué pasó y qué hacer, y qué NO se perdió. `Alert err` (role="alert") o `warn`.
 * Enchufadas en la fase 07 (W8): Evaluar, Entrega, Alumnos y el ranking en vivo.
 */

/** Alerta con título + explicación + enlace opcional. */
export function ErrorEnPantalla({
  variant = "err",
  titulo,
  children,
  enlace,
}: {
  variant?: "err" | "warn";
  titulo: string;
  children: ReactNode;
  enlace?: { href: string; label: string };
}) {
  return (
    <Alert variant={variant} role="alert">
      <p className="text-body-strong">{titulo}</p>
      <p className="mt-1 text-small">{children}</p>
      {enlace ? (
        <Link
          href={enlace.href}
          className="mt-1 inline-block text-small-b text-accent-ink underline underline-offset-2"
        >
          {enlace.label}
        </Link>
      ) : null}
    </Alert>
  );
}

/** Entrega rechazada por la imagen de una pregunta (peso o tipo). */
export function ErrorEntregaRechazada({
  pregunta,
  motivo,
  href,
}: {
  pregunta: number;
  /** «La imagen de la pregunta 3 pesa 9 MB y el máximo es 5 MB.» */
  motivo: string;
  href: string;
}) {
  return (
    <ErrorEnPantalla
      titulo="No pudimos recibir tu entrega"
      enlace={{ href, label: `Ir a la pregunta ${pregunta}` }}
    >
      {motivo} Tus respuestas siguen guardadas en este teléfono.
    </ErrorEnPantalla>
  );
}

/** Fallo de red al guardar una nota (Evaluar): nada se borra; reintentar o copiar comentarios. */
export function ErrorGuardarNota({
  equipo,
  onReintentar,
  onCopiar,
}: {
  /** «5A-G2 Repostería». */
  equipo: string;
  onReintentar: () => void;
  onCopiar?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <ErrorEnPantalla titulo={`No se guardó la nota de ${equipo}`}>
        Se perdió la conexión. No borramos nada: los puntajes y comentarios
        siguen aquí.
      </ErrorEnPantalla>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onReintentar}>
          <RefreshCw aria-hidden="true" />
          Reintentar guardar
        </Button>
        {onCopiar ? (
          <Button type="button" variant="ghost" onClick={onCopiar}>
            Copiar comentarios
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Sesión vencida: entrar de nuevo sin perder lo escrito. `children` cambia la explicación (por
 * defecto, la del lienzo) donde no hay nada escrito que conservar, como el ranking en vivo.
 */
export function SesionVencida({
  href = "/ingresar",
  children,
}: {
  href?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3">
      <ErrorEnPantalla variant="warn" titulo="Tu sesión se cerró">
        {children ??
          "Por seguridad cerramos la sesión tras 30 días. Entra de nuevo para seguir; lo que escribiste no se pierde."}
      </ErrorEnPantalla>
      <Button asChild>
        <Link href={href}>Entrar de nuevo</Link>
      </Button>
    </div>
  );
}
