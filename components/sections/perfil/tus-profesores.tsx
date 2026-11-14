import { ExternalLink, Mail, MessageCircle } from "lucide-react";
import { UserAvatar } from "@/components/krea/user-avatar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import type { TarjetaProfe } from "@/lib/contacto";
import { initials } from "@/lib/identity";

// PROVISIONAL (CONTENT_CHECKLIST fila 196): no están en el lienzo
const TITULO = "Tus profesores";
const SUBTITULO = "Escríbeles si tienes dudas sobre una tarea o tu nota.";

/**
 * «Tus profesores» del Perfil del alumno (D380): cada profe que cargó algún contacto, con enlaces
 * a WhatsApp (pestaña nueva, avisado) y al correo. Sin profes con contacto no se muestra. El
 * avatar es el suyo (D389); si su semilla aún lleva la cédula, la lectura lo quita y van iniciales.
 */
export function TusProfesores({ profes }: { profes: readonly TarjetaProfe[] }) {
  if (profes.length === 0) return null;
  return (
    <Card className="flex flex-col gap-4">
      <CardHeader className="mb-0">
        <h2 className="text-h3 text-text">{TITULO}</h2>
        <p className="text-small text-text-2">{SUBTITULO}</p>
      </CardHeader>
      <ul className="flex flex-col gap-4">
        {profes.map((p) => (
          <li
            key={p.clave}
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              {p.avatar ? (
                <UserAvatar
                  estilo={p.avatar.estilo}
                  seed={p.avatar.seed}
                  nombre={p.nombre}
                  size={40}
                />
              ) : (
                <Avatar size={40} aria-hidden="true">
                  <AvatarFallback>{initials(p.nombre)}</AvatarFallback>
                </Avatar>
              )}
              <div className="min-w-0">
                <p className="text-body-strong text-text">{p.nombre}</p>
                {p.whatsapp ? (
                  <p className="text-small break-words text-text-2">
                    {p.whatsapp.texto}
                  </p>
                ) : null}
                {p.correo ? (
                  <p className="text-small break-all text-text-2">
                    {p.correo.texto}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {p.whatsapp ? (
                <a
                  href={p.whatsapp.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`WhatsApp de ${p.nombre} (se abre en otra pestaña)`}
                  className={buttonVariants({
                    variant: "secondary",
                    size: "sm",
                  })}
                >
                  <MessageCircle aria-hidden="true" />
                  WhatsApp
                  <ExternalLink aria-hidden="true" />
                </a>
              ) : null}
              {p.correo ? (
                <a
                  href={p.correo.href}
                  aria-label={`Correo a ${p.nombre}`}
                  className={buttonVariants({
                    variant: "secondary",
                    size: "sm",
                  })}
                >
                  <Mail aria-hidden="true" />
                  Correo
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
