"use client";

import { Pencil } from "lucide-react";
import { useId, useState } from "react";
import { NumberStepper } from "@/components/krea/number-stepper";
import { Button } from "@/components/ui/button";
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
import { Field, joinIds } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  BASE_PASO,
  baseCambio,
  editarLabel,
  type FilaAlumno,
  subtituloEdicion,
  unirNombre,
  validarEdicion,
} from "@/lib/alumnos";
import { BASE_MAX, BASE_MIN } from "@/lib/grades";
import { partirNombre } from "@/lib/perfil";

type Cambios = Pick<FilaAlumno, "nombres" | "apellidos" | "base">;

/**
 * "Editar" de una fila + diálogo (HANDOFF §3 Alumnos, §2.13). Un `Dialog` por fila con su propio
 * `DialogTrigger`: al cerrar, Radix devuelve el foco al botón que lo abrió. El contenido solo se
 * monta abierto, así que el formulario siempre parte de los datos vigentes. El cambio real
 * (Firestore) es de la fase 07: aquí `onGuardar`.
 */
export function EditStudentDialog({
  alumno,
  onGuardar,
}: {
  alumno: FilaAlumno;
  onGuardar: (cedula: string, cambios: Cambios) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil aria-hidden="true" />
          <span aria-hidden="true">Editar</span>
          <span className="sr-only">{editarLabel(alumno)}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar alumno</DialogTitle>
          <DialogDescription>{subtituloEdicion(alumno)}</DialogDescription>
        </DialogHeader>
        <EditForm
          alumno={alumno}
          onListo={(cambios) => {
            onGuardar(alumno.cedula, cambios);
            setAbierto(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function EditForm({
  alumno,
  onListo,
}: {
  alumno: FilaAlumno;
  onListo: (cambios: Cambios) => void;
}) {
  const uid = useId();
  const [nom1, nom2] = partirNombre(alumno.nombres);
  const [ape1, ape2] = partirNombre(alumno.apellidos);
  const [nombre1, setNombre1] = useState(nom1);
  const [nombre2, setNombre2] = useState(nom2);
  const [apellido1, setApellido1] = useState(ape1);
  const [apellido2, setApellido2] = useState(ape2);
  const [base, setBase] = useState(alumno.base);
  const [motivo, setMotivo] = useState("");
  const [intentado, setIntentado] = useState(false);

  const ids = {
    nombre1: `${uid}-nombre1`,
    apellido1: `${uid}-apellido1`,
    base: `${uid}-base`,
    motivo: `${uid}-motivo`,
  };
  const nombres = unirNombre(nombre1, nombre2);
  const apellidos = unirNombre(apellido1, apellido2);
  const cambioBase = baseCambio(alumno.base, base);
  const errores = validarEdicion({
    baseAnterior: alumno.base,
    baseNueva: base,
    motivo,
    nombres,
    apellidos,
  });
  // D071: los errores aparecen al enviar y, ya a la vista, se corrigen en vivo sin anunciarse
  const ver = intentado ? errores : {};

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const primero = errores.nombres
      ? ids.nombre1
      : errores.apellidos
        ? ids.apellido1
        : errores.base
          ? ids.base
          : errores.motivo
            ? ids.motivo
            : null;
    if (primero) {
      setIntentado(true);
      document.getElementById(primero)?.focus();
      return;
    }
    onListo({ nombres, apellidos, base });
  };

  return (
    <form noValidate onSubmit={enviar} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          label="Primer nombre"
          controlId={ids.nombre1}
          error={ver.nombres}
          announce={false}
        >
          <Input
            autoComplete="off"
            value={nombre1}
            onChange={(e) => setNombre1(e.currentTarget.value)}
          />
        </Field>
        <Field label="Segundo nombre">
          <Input
            autoComplete="off"
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
            autoComplete="off"
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
      </div>
      <Separator />
      <Field
        label="Base de evaluación"
        controlId={ids.base}
        help="Entre 10 y 20. Nota final = puntaje × base / 20. Cambia todas sus notas; los puntos de sus notas se recalculan."
        error={ver.base}
        announce={false}
      >
        <NumberStepper
          id={ids.base}
          label="Base de evaluación"
          value={base}
          onChange={setBase}
          min={BASE_MIN}
          max={BASE_MAX}
          step={BASE_PASO}
          unit="/ 20"
          aria-describedby={joinIds(
            `${ids.base}-help`,
            ver.base && `${ids.base}-msg`,
          )}
          aria-invalid={ver.base ? true : undefined}
        />
      </Field>
      {cambioBase ? (
        <Field
          label={
            <>
              Motivo del cambio de base{" "}
              <span aria-hidden="true" className="text-error">
                *
              </span>
            </>
          }
          controlId={ids.motivo}
          help="Obligatorio porque cambiaste la base."
          error={ver.motivo}
          announce={false}
        >
          <Textarea
            compact
            required
            rows={2}
            placeholder="Ej. Acuerdo de conducta firmado el 20/10/2026"
            value={motivo}
            onChange={(e) => setMotivo(e.currentTarget.value)}
          />
        </Field>
      ) : null}
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit">Guardar cambios</Button>
      </DialogFooter>
    </form>
  );
}
