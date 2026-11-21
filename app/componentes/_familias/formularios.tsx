"use client";

import { Search } from "lucide-react";
import * as React from "react";
import { CedulaInput } from "@/components/krea/cedula-input";
import { NumberStepper } from "@/components/krea/number-stepper";
import { PasswordInput } from "@/components/krea/password-input";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { validateCedula } from "@/lib/cedula";
import { COMMENT_MAX_LENGTH } from "@/lib/question";
import { Familia, Muestra } from "./familia";

// Textos de ejemplo PROVISIONALES (CONTENT_CHECKLIST 26–28): ayudas, errores de demostración,
// valores de muestra. Los dos mensajes de la cédula son del handoff (lib/cedula.ts).

/** Rejilla de campos: una columna en móvil, dos desde `md`. */
function Rejilla({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid max-w-3xl grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
      {children}
    </div>
  );
}

/** Lo que no se puede forzar desde la página (hover, foco) se dice con texto. */
function Nota({ children }: { children: React.ReactNode }) {
  return <p className="text-small text-text-2">{children}</p>;
}

function SeleccionSeccion({
  state,
  disabled,
  defaultValue,
}: {
  state?: "error" | "success";
  disabled?: boolean;
  defaultValue?: string;
}) {
  return (
    <Select defaultValue={defaultValue} disabled={disabled}>
      <SelectTrigger
        aria-invalid={state === "error" || undefined}
        success={state === "success"}
      >
        <SelectValue placeholder="Elige tu sección" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>5.º año</SelectLabel>
          <SelectItem value="5A">Sección A</SelectItem>
          <SelectItem value="5C">Sección C</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Otras</SelectLabel>
          <SelectItem value="otra" disabled>
            Sección B (sin acceso)
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function CedulaDemo() {
  const [valor, setValor] = React.useState("");
  const [tocado, setTocado] = React.useState(false);
  const error = tocado ? validateCedula(valor) : null;

  return (
    <Field
      label="Cédula"
      help="Solo números, sin puntos. Prueba pegar “V-12.345.678”."
      error={error}
      success={tocado && !error ? "Cédula con formato válido." : undefined}
      announce={false}
    >
      <CedulaInput
        value={valor}
        onChange={(e) => setValor(e.currentTarget.value)}
        onBlur={() => setTocado(true)}
      />
    </Field>
  );
}

function PasswordDemo() {
  const [valor, setValor] = React.useState("");
  return (
    <Field label="Contraseña" help="Pulsa el ojo para verla u ocultarla.">
      <PasswordInput
        autoComplete="current-password"
        value={valor}
        onChange={(e) => setValor(e.currentTarget.value)}
        placeholder="Tu contraseña"
      />
    </Field>
  );
}

function StepperDemo({
  label,
  start,
  min,
  max,
  unit,
}: {
  label: string;
  /** `null` = sin valor (D103): campo vacío hasta el primer −/+. */
  start: number | null;
  min: number;
  max: number;
  unit: string;
}) {
  const [valor, setValor] = React.useState<number | null>(start);
  const labelId = React.useId();
  return (
    <div className="flex flex-col gap-1.5">
      {/* El texto visible nombra el stepper (aria-labelledby, D103) */}
      <span id={labelId} className="text-label">
        {label}
      </span>
      <NumberStepper
        aria-labelledby={labelId}
        value={valor}
        onChange={setValor}
        min={min}
        max={max}
        unit={unit}
      />
    </div>
  );
}

function EnviandoDemo() {
  const [enviando, setEnviando] = React.useState(false);
  React.useEffect(() => {
    if (!enviando) return;
    const t = setTimeout(() => setEnviando(false), 2000);
    return () => clearTimeout(t);
  }, [enviando]);

  return (
    <form
      method="post"
      className="flex max-w-sm flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setEnviando(true);
      }}
    >
      <Field label="Correo de recuperación">
        <Input
          type="email"
          autoComplete="email"
          defaultValue="julia@correo.com"
          readOnly={enviando}
        />
      </Field>
      <Button type="submit" loading={enviando} loadingLabel="Enviando…" block>
        Enviar enlace
      </Button>
      <Nota>
        Al enviar, el campo queda de solo lectura y el botón carga durante 2 s.
      </Nota>
    </form>
  );
}

export function Formularios() {
  return (
    <Familia
      id="formularios"
      title="Campos de formulario"
      description="Etiqueta, campo, ayuda y mensaje cableados por Field. Hover y foco no se pueden forzar: pasa el puntero o pulsa Tab sobre cada campo."
    >
      <Muestra title="Input">
        <Rejilla>
          <Field label="Nombre" help="Como aparece en la lista de clase.">
            <Input placeholder="Nombre y apellido" autoComplete="name" />
          </Field>
          <Field label="Con ícono líder">
            <Input
              leading={<Search aria-hidden="true" />}
              placeholder="Buscar estudiante"
              type="search"
            />
          </Field>
          <Field label="Lleno">
            <Input defaultValue="Julia Rivas" />
          </Field>
          <Field label="Foco">
            <Input placeholder="Pulsa Tab hasta aquí" />
          </Field>
          <Field
            label="Correo"
            error="Escribe un correo con @, por ejemplo nombre@correo.com."
          >
            <Input defaultValue="julia.correo.com" type="email" />
          </Field>
          <Field label="Equipo" success="Nombre disponible.">
            <Input defaultValue="Los Cometas" />
          </Field>
          <Field label="Deshabilitado" help="Solo el profesor puede cambiarlo.">
            <Input defaultValue="5.º año · Sección A" disabled />
          </Field>
          <Field label="Solo lectura">
            <Input defaultValue="Código KR-500-7F3A9C" readOnly />
          </Field>
        </Rejilla>
        <Nota>
          Hover: el borde pasa a --text-2. Foco: borde --accent-ink y halo del
          acento, sin outline.
        </Nota>
      </Muestra>

      <Muestra title="Textarea">
        <Rejilla>
          <Field label="Comentario" help="Para tu equipo y tu profesor.">
            <Textarea
              maxLength={600}
              counter
              defaultValue="Dividimos la tarea en tres partes: investigación, maqueta y presentación. Julia armó la maqueta y Andrés preparó la presentación."
            />
          </Field>
          <Field label="Compacto (tarjeta de evaluación)">
            <Textarea
              compact
              autoGrow
              maxLength={COMMENT_MAX_LENGTH}
              counter
              placeholder="Comentario para el estudiante"
            />
          </Field>
          <Field label="Con error" error="El comentario no puede quedar vacío.">
            <Textarea maxLength={600} counter />
          </Field>
          <Field label="Deshabilitado">
            <Textarea disabled defaultValue="Entrega cerrada." />
          </Field>
        </Rejilla>
      </Muestra>

      <Muestra title="Select">
        <Rejilla>
          <Field label="Reposo">
            <SeleccionSeccion />
          </Field>
          <Field label="Con valor">
            <SeleccionSeccion defaultValue="5A" />
          </Field>
          <Field label="Con error" error="Elige una sección para continuar.">
            <SeleccionSeccion state="error" />
          </Field>
          <Field label="Con éxito" success="Sección asignada.">
            <SeleccionSeccion defaultValue="5C" state="success" />
          </Field>
          <Field label="Deshabilitado">
            <SeleccionSeccion defaultValue="5A" disabled />
          </Field>
        </Rejilla>
        <Nota>
          El menú abierto se prueba interactuando: flechas, Inicio/Fin, escribir
          para saltar, Esc.
        </Nota>
      </Muestra>

      <Muestra title="Contraseña y cédula">
        <Rejilla>
          <PasswordDemo />
          <Field
            label="Contraseña con error"
            error="La contraseña debe tener al menos 8 caracteres."
          >
            <PasswordInput autoComplete="new-password" defaultValue="corta" />
          </Field>
          <CedulaDemo />
          <div className="flex flex-col gap-5">
            <Field
              label="Cédula · caracteres no válidos"
              error={validateCedula("V-1234567")}
            >
              <CedulaInput defaultValue="V-1234567" />
            </Field>
            <Field
              label="Cédula · faltan dígitos"
              error={validateCedula("123456")}
            >
              <CedulaInput defaultValue="123456" />
            </Field>
          </div>
        </Rejilla>
      </Muestra>

      <Muestra title="Stepper numérico">
        <div className="flex flex-col gap-5">
          <StepperDemo
            label="Base de evaluación · mínimo"
            start={10}
            min={10}
            max={20}
            unit="/ 20"
          />
          <StepperDemo
            label="Base de evaluación · medio"
            start={15}
            min={10}
            max={20}
            unit="/ 20"
          />
          <StepperDemo
            label="Base de evaluación · máximo"
            start={20}
            min={10}
            max={20}
            unit="/ 20"
          />
          <StepperDemo
            label="Puntos de ajuste"
            start={2.5}
            min={0}
            max={10}
            unit="pts"
          />
          <StepperDemo
            label="Puntaje · sin puntuar"
            start={null}
            min={0}
            max={8}
            unit="/ 8"
          />
        </div>
        <Nota>
          Escribe “17,5” o “17.5”; ↑/↓ suman o restan 0,5; al salir del campo se
          corrige al paso y al rango. Sin valor, el campo queda vacío (se
          anuncia “Sin puntuar”) y el primer −/+ parte del mínimo.
        </Nota>
      </Muestra>

      <Muestra title="Enviando">
        <EnviandoDemo />
      </Muestra>
    </Familia>
  );
}
