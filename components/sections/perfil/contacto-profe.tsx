"use client";
// «Contacto para tus alumnos» del Perfil del profesor (D378): celular venezolano (abre WhatsApp) y
// correo, ambos opcionales; vacío = borrar. Valida con la misma función pura que el servidor
// (`zContacto`) y guarda con `guardarContacto`. Mismo patrón que «Tus datos» (D071, D234).
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { ErrorEnPantalla } from "@/components/estados/errores";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { guardarContacto } from "@/lib/acciones/perfil";
import {
  type ContactoEntrada,
  contactoAFormulario,
  erroresContacto,
  zContacto,
} from "@/lib/contacto";

// PROVISIONAL (CONTENT_CHECKLIST filas 194–195): no están en el lienzo
const TITULO = "Contacto para tus alumnos";
const AYUDA = "Opcional. Tus alumnos lo verán en su Perfil.";
const AYUDA_TELEFONO = "Celular venezolano: abre un chat de WhatsApp.";
const TOAST_GUARDADO = "Contacto guardado";
const ERROR_GUARDAR =
  "No se guardó tu contacto. Revisa tu internet y vuelve a intentar.";

export function ContactoProfe({ inicial }: { inicial: ContactoEntrada }) {
  const router = useRouter();
  const uid = useId();
  const [telefono, setTelefono] = useState(inicial.telefono);
  const [email, setEmail] = useState(inicial.email);
  const [intentado, setIntentado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const enviando = useRef(false);

  const ids = {
    telefono: `${uid}-telefono`,
    email: `${uid}-email`,
  };
  const errores = erroresContacto({ telefono, email });
  // D071: los errores aparecen al enviar y, ya a la vista, se corrigen en vivo
  const ver: typeof errores = intentado ? errores : {};

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando.current) return;
    const primero = errores.telefono
      ? ids.telefono
      : errores.email
        ? ids.email
        : null;
    if (primero) {
      setIntentado(true);
      document.getElementById(primero)?.focus();
      return;
    }
    enviando.current = true;
    setGuardando(true);
    setErrorServidor(null);
    const r = await guardarContacto({ telefono, email }).catch(() => ({
      ok: false as const,
    }));
    enviando.current = false;
    setGuardando(false);
    if (!r.ok) {
      setErrorServidor(ERROR_GUARDAR);
      return;
    }
    // Muestra lo guardado como se verá (teléfono normalizado, correo en minúsculas)
    const guardado = zContacto.safeParse({ telefono, email });
    if (guardado.success) {
      const f = contactoAFormulario(guardado.data);
      setTelefono(f.telefono);
      setEmail(f.email);
    }
    setIntentado(false);
    toast(TOAST_GUARDADO);
    router.refresh();
  }

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader className="mb-0">
        <h2 className="text-h3 text-text">{TITULO}</h2>
        <p className="text-small text-text-2">{AYUDA}</p>
      </CardHeader>
      <form
        method="post"
        noValidate
        onSubmit={enviar}
        className="flex flex-col gap-4"
      >
        <div className="g2">
          <Field
            label="Teléfono (WhatsApp)"
            controlId={ids.telefono}
            help={AYUDA_TELEFONO}
            error={ver.telefono}
            announce={false}
          >
            <Input
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="Ej. 0412-1234567"
              value={telefono}
              onChange={(e) => setTelefono(e.currentTarget.value)}
            />
          </Field>
          <Field
            label="Correo"
            controlId={ids.email}
            error={ver.email}
            announce={false}
          >
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Ej. nombre@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />
          </Field>
        </div>
        {errorServidor ? (
          <ErrorEnPantalla titulo="No se guardaron los cambios">
            {errorServidor}
          </ErrorEnPantalla>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" loading={guardando} loadingLabel="Guardando…">
            Guardar contacto
          </Button>
        </div>
      </form>
    </Card>
  );
}
