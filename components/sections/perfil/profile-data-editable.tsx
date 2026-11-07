"use client";
// «Tus datos» del profesor (D234, pedido 4 de César): sus nombres y apellidos son suyos y los
// edita aquí; la cédula no (es su usuario para entrar y el uid, D174). Mismos 4 campos que el
// «Tus datos» del alumno (`ProfileData`, solo lectura para él), en la grilla `g2`.
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { ErrorEnPantalla } from "@/components/estados/errores";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { guardarMisDatos } from "@/lib/acciones/perfil";
import { APELLIDOS_VACIO, NOMBRES_VACIO, unirNombre } from "@/lib/alumnos";
import { cedulaTexto, partirNombre } from "@/lib/perfil";

// PROVISIONAL (CONTENT_CHECKLIST fila 137): no están en el lienzo
const AYUDA_CEDULA = "Es tu usuario para entrar: no se cambia.";
const TOAST_GUARDADO = "Datos guardados";
const ERROR_GUARDAR =
  "No se guardaron tus datos. Revisa tu internet y vuelve a intentar.";

export function ProfileDataEditable({
  cedula,
  nombres,
  apellidos,
}: {
  cedula: string;
  nombres: string;
  apellidos: string;
}) {
  const router = useRouter();
  const uid = useId();
  const [n1, n2] = partirNombre(nombres);
  const [a1, a2] = partirNombre(apellidos);
  const [nombre1, setNombre1] = useState(n1);
  const [nombre2, setNombre2] = useState(n2);
  const [apellido1, setApellido1] = useState(a1);
  const [apellido2, setApellido2] = useState(a2);
  const [intentado, setIntentado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const enviando = useRef(false);

  const ids = { nombre1: `${uid}-nombre1`, apellido1: `${uid}-apellido1` };
  const errores = {
    nombres: nombre1.trim() === "" ? NOMBRES_VACIO : undefined,
    apellidos: apellido1.trim() === "" ? APELLIDOS_VACIO : undefined,
  };
  // D071: los errores aparecen al enviar y, ya a la vista, se corrigen en vivo
  const ver: Partial<typeof errores> = intentado ? errores : {};

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando.current) return;
    const primero = errores.nombres
      ? ids.nombre1
      : errores.apellidos
        ? ids.apellido1
        : null;
    if (primero) {
      setIntentado(true);
      document.getElementById(primero)?.focus();
      return;
    }
    enviando.current = true;
    setGuardando(true);
    setErrorServidor(null);
    const r = await guardarMisDatos({
      nombres: unirNombre(nombre1, nombre2),
      apellidos: unirNombre(apellido1, apellido2),
    }).catch(() => ({ ok: false as const }));
    enviando.current = false;
    setGuardando(false);
    if (!r.ok) {
      setErrorServidor(ERROR_GUARDAR);
      return;
    }
    toast(TOAST_GUARDADO);
    // La barra lateral vuelve a leer el nombre
    router.refresh();
  }

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader className="mb-0">
        <h2 className="text-h3 text-text">Tus datos</h2>
      </CardHeader>
      <form
        method="post"
        noValidate
        onSubmit={enviar}
        className="flex flex-col gap-4"
      >
        <div className="g2">
          <Field
            label="Primer nombre"
            controlId={ids.nombre1}
            error={ver.nombres}
            announce={false}
          >
            <Input
              autoComplete="given-name"
              value={nombre1}
              onChange={(e) => setNombre1(e.currentTarget.value)}
            />
          </Field>
          <Field label="Segundo nombre">
            <Input
              autoComplete="additional-name"
              value={nombre2}
              onChange={(e) => setNombre2(e.currentTarget.value)}
            />
          </Field>
          <Field
            label="Primer apellido"
            controlId={ids.apellido1}
            error={ver.apellidos}
            announce={false}
          >
            <Input
              autoComplete="family-name"
              value={apellido1}
              onChange={(e) => setApellido1(e.currentTarget.value)}
            />
          </Field>
          <Field label="Segundo apellido">
            <Input
              autoComplete="off"
              value={apellido2}
              onChange={(e) => setApellido2(e.currentTarget.value)}
            />
          </Field>
          <Field label="Cédula" help={AYUDA_CEDULA}>
            <Input readOnly value={cedulaTexto(cedula)} />
          </Field>
        </div>
        {errorServidor ? (
          <ErrorEnPantalla titulo="No se guardaron los cambios">
            {errorServidor}
          </ErrorEnPantalla>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" aria-disabled={guardando || undefined}>
            {guardando ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
