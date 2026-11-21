"use client";
import { UserPlus } from "lucide-react";
import { type FormEvent, useId, useRef, useState } from "react";
import { ErrorEnPantalla } from "@/components/estados/errores";
import { BotonEnLinea } from "@/components/krea/boton-en-linea";
import { CedulaInput } from "@/components/krea/cedula-input";
// «Agregar alumno» (W12, D267): cédula, nombres, apellidos, sección, equipo (opcional) y email de
// recuperación (opcional). La cuenta nace con contraseña temporal (D232): al crearla, el diálogo se
// cierra y la pantalla muestra la contraseña una sola vez y después abre su ficha. Doble envío:
// una ref lo corta y el botón queda ocupado (`loading`, D285). Si el servidor no crea la cuenta, el
// diálogo sigue abierto con lo escrito y el error (D171).
import { hayRed } from "@/components/krea/use-en-linea";
import { BOTON_LARGO, Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { unirNombre } from "@/lib/alumnos";
import {
  type CrearAlumno,
  equiposDeSeccion,
  errorCrearAlumnoTexto,
  type OpcionEquipo,
  type ResultadoCrearAlumno,
  validarAlumnoNuevo,
} from "@/lib/alumnos-alta";
import type { SeccionId } from "@/lib/modelo";
import { siNoEsDeploy } from "@/lib/recarga-deploy";
import { agruparPorAnio } from "@/lib/secciones";

export type CrearAlumnoAccion = (
  entrada: CrearAlumno,
) => Promise<ResultadoCrearAlumno>;

export type AlumnoCreado = {
  cedula: string;
  seccion: SeccionId;
  nombre: string;
  passwordTemporal: string;
  sinEquipo: boolean;
};

/** `id` del botón: el foco vuelve aquí cuando la fila de un alumno eliminado desaparece. */
export const AGREGAR_ALUMNO_ID = "agregar-alumno";

// Radix Select no admite un valor vacío
const SIN_EQUIPO = "sin-equipo";

// PROVISIONAL (CONTENT_CHECKLIST fila 148): el diálogo no está en el lienzo
const AYUDA_CEDULA =
  "Será su usuario para entrar. Después no se puede cambiar.";
const AYUDA_EQUIPO =
  "Opcional: puedes asignarlo después desde Equipos. Si el equipo está vacío, será su capitán.";
const AYUDA_EMAIL =
  "Para «Olvidé mi contraseña». Déjalo vacío si el alumno no tiene.";

export function AddStudentDialog({
  equipos,
  secciones,
  seccionInicial,
  crear,
  onCreado,
}: {
  equipos: readonly OpcionEquipo[];
  /** Secciones del catálogo (D323). */
  secciones: readonly SeccionId[];
  /** La sección que se ve en la lista. */
  seccionInicial: SeccionId;
  crear: CrearAlumnoAccion;
  onCreado: (a: AlumnoCreado) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button id={AGREGAR_ALUMNO_ID} className={BOTON_LARGO}>
          <UserPlus aria-hidden="true" />
          Agregar alumno
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar alumno</DialogTitle>
          <DialogDescription>
            Le daremos una contraseña temporal; al entrar por primera vez creará
            la suya.
          </DialogDescription>
        </DialogHeader>
        <AddForm
          equipos={equipos}
          secciones={secciones}
          seccionInicial={seccionInicial}
          crear={crear}
          onCreado={(a) => {
            setAbierto(false);
            onCreado(a);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function AddForm({
  equipos,
  secciones,
  seccionInicial,
  crear,
  onCreado,
}: {
  equipos: readonly OpcionEquipo[];
  secciones: readonly SeccionId[];
  seccionInicial: SeccionId;
  crear: CrearAlumnoAccion;
  onCreado: (a: AlumnoCreado) => void;
}) {
  const uid = useId();
  const [cedula, setCedula] = useState("");
  const [nombre1, setNombre1] = useState("");
  const [nombre2, setNombre2] = useState("");
  const [apellido1, setApellido1] = useState("");
  const [apellido2, setApellido2] = useState("");
  const [seccion, setSeccion] = useState<SeccionId>(seccionInicial);
  const [equipo, setEquipo] = useState(SIN_EQUIPO);
  const [email, setEmail] = useState("");
  const [intentado, setIntentado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const enviando = useRef(false);

  const ids = {
    cedula: `${uid}-cedula`,
    nombre1: `${uid}-nombre1`,
    apellido1: `${uid}-apellido1`,
    email: `${uid}-email`,
  };
  const opciones = equiposDeSeccion(equipos, seccion);
  const errores = validarAlumnoNuevo({
    cedula,
    primerNombre: nombre1,
    primerApellido: apellido1,
    email,
  });
  // D071: los errores aparecen al enviar y, ya a la vista, se corrigen en vivo sin anunciarse
  const ver = intentado ? errores : {};

  async function alEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!hayRed()) return;
    if (enviando.current) return;
    const primero = errores.cedula
      ? ids.cedula
      : errores.nombres
        ? ids.nombre1
        : errores.apellidos
          ? ids.apellido1
          : errores.email
            ? ids.email
            : null;
    if (primero) {
      setIntentado(true);
      document.getElementById(primero)?.focus();
      return;
    }
    const nombres = unirNombre(nombre1, nombre2);
    const apellidos = unirNombre(apellido1, apellido2);
    enviando.current = true;
    setGuardando(true);
    setErrorServidor(null);
    const r = await crear({
      cedula: cedula.trim(),
      nombres,
      apellidos,
      seccion,
      email: email.trim().toLowerCase(),
      equipoId: equipo === SIN_EQUIPO ? null : equipo,
    }).catch(siNoEsDeploy<ResultadoCrearAlumno>({ ok: false, error: "red" }));
    enviando.current = false;
    setGuardando(false);
    if (!r.ok) {
      setErrorServidor(errorCrearAlumnoTexto(r.error));
      return;
    }
    onCreado({
      cedula: cedula.trim(),
      seccion,
      nombre: `${nombres} ${apellidos}`,
      passwordTemporal: r.passwordTemporal,
      sinEquipo: r.sinEquipo === true,
    });
  }

  return (
    <form
      method="post"
      noValidate
      onSubmit={alEnviar}
      className="flex flex-col gap-4"
    >
      <Field
        label="Cédula"
        controlId={ids.cedula}
        help={AYUDA_CEDULA}
        error={ver.cedula}
        announce={false}
      >
        <CedulaInput
          name="cedula"
          autoComplete="off"
          value={cedula}
          onChange={(e) => setCedula(e.currentTarget.value)}
        />
      </Field>
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Sección">
          <Select
            value={seccion}
            onValueChange={(v) => {
              setSeccion(v);
              // Los equipos son de una sección: al cambiarla, el elegido ya no vale
              setEquipo(SIN_EQUIPO);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {/* Agrupadas por año, como el selector de sección (D322) */}
              {agruparPorAnio(secciones).map((g) => (
                <SelectGroup key={g.numero}>
                  <SelectLabel>{g.nombre}</SelectLabel>
                  {g.secciones.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Equipo" help={AYUDA_EQUIPO}>
          <Select value={equipo} onValueChange={setEquipo}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SIN_EQUIPO}>Sin equipo</SelectItem>
              {opciones.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field
        label="Email de recuperación"
        controlId={ids.email}
        help={AYUDA_EMAIL}
        error={ver.email}
        announce={false}
      >
        <Input
          type="email"
          inputMode="email"
          autoComplete="off"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
        />
      </Field>
      {errorServidor ? (
        <ErrorEnPantalla titulo="No se creó la cuenta">
          {errorServidor}
        </ErrorEnPantalla>
      ) : null}
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">
            Cancelar
          </Button>
        </DialogClose>
        <BotonEnLinea type="submit" loading={guardando} loadingLabel="Creando…">
          Crear alumno
        </BotonEnLinea>
      </DialogFooter>
    </form>
  );
}
