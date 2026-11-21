"use client";
// Diálogos de la pantalla Profesores (D233): crear/editar, la contraseña temporal (se ve una sola
// vez, D232) y la confirmación de eliminar. Cada formulario corta el doble envío con una ref y el
// botón queda ocupado (`loading`, D285) mientras vuela; si el servidor no guarda, el diálogo sigue
// abierto con lo escrito y el error (D171).
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { type FormEvent, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { ErrorEnPantalla } from "@/components/estados/errores";
import { CedulaInput } from "@/components/krea/cedula-input";
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
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { unirNombre } from "@/lib/alumnos";
import {
  type CrearProfesor,
  type ErrorProfesor,
  errorProfesorTexto,
  type FilaProfesor,
  nombreProfesor,
  type ResultadoCrearProfesor,
  type ResultadoProfesor,
  validarProfesor,
} from "@/lib/cuentas-datos";
import type { ResultadoLote } from "@/lib/lote";
import { cedulaTexto, partirNombre } from "@/lib/perfil";

export type AccionesProfesores = {
  crear: (entrada: CrearProfesor) => Promise<ResultadoCrearProfesor>;
  editar: (entrada: CrearProfesor) => Promise<ResultadoProfesor>;
  eliminar: (cedula: string) => Promise<ResultadoProfesor>;
  /** En lote (W22, D298); sin ella, la lista no ofrece casillas. */
  eliminarVarios?: (cedulas: string[]) => Promise<ResultadoLote<ErrorProfesor>>;
};

// PROVISIONAL (CONTENT_CHECKLIST fila 137): la pantalla no está en el lienzo
const AYUDA_CEDULA_EDITAR =
  "La cédula no se cambia: es su usuario para entrar.";
const AYUDA_CEDULA_CREAR =
  "Será su usuario para entrar. Después no se puede cambiar.";
const AYUDA_EMAIL =
  "Para «Olvidé mi contraseña». Déjalo vacío si no lo tienes.";

/** «Nuevo profesor»: recibe el foco cuando la fila (o la barra del lote) que lo tenía desaparece. */
export const NUEVO_PROFESOR_ID = "nuevo-profesor";

/* ---------- Crear / editar ---------- */

/** «Nuevo profesor»: al crear, cierra el formulario y pasa la contraseña temporal a `onCreado`. */
export function CrearProfesorDialog({
  crear,
  onCreado,
}: {
  crear: AccionesProfesores["crear"];
  onCreado: (p: { nombre: string; passwordTemporal: string }) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button id={NUEVO_PROFESOR_ID}>
          <UserPlus aria-hidden="true" />
          Nuevo profesor
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo profesor</DialogTitle>
          <DialogDescription>
            Le daremos una contraseña temporal; al entrar por primera vez creará
            la suya.
          </DialogDescription>
        </DialogHeader>
        <ProfesorForm
          enviar={async (entrada) => {
            const r = await crear(entrada);
            if (r.ok) {
              setAbierto(false);
              onCreado({
                nombre: nombreProfesor(entrada),
                passwordTemporal: r.passwordTemporal,
              });
            }
            return r;
          }}
          textoBoton="Crear profesor"
        />
      </DialogContent>
    </Dialog>
  );
}

export function EditarProfesorDialog({
  profesor,
  editar,
}: {
  profesor: FilaProfesor;
  editar: AccionesProfesores["editar"];
}) {
  const [abierto, setAbierto] = useState(false);
  const nombre = nombreProfesor(profesor);
  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil aria-hidden="true" />
          <span aria-hidden="true">Editar</span>
          <span className="sr-only">Editar a {nombre}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar profesor</DialogTitle>
          <DialogDescription>
            {nombre} · {cedulaTexto(profesor.cedula)}
          </DialogDescription>
        </DialogHeader>
        <ProfesorForm
          inicial={profesor}
          enviar={async (entrada) => {
            const r = await editar(entrada);
            if (r.ok) {
              setAbierto(false);
              toast("Cambios guardados");
            }
            return r;
          }}
          textoBoton="Guardar cambios"
        />
      </DialogContent>
    </Dialog>
  );
}

/**
 * Formulario de Crear (sin `inicial`) y Editar. Nombres y apellidos en 4 campos, como Editar alumno
 * (D209); la cédula, editable solo al crear.
 */
function ProfesorForm({
  inicial,
  enviar,
  textoBoton,
}: {
  inicial?: FilaProfesor;
  enviar: (
    entrada: CrearProfesor,
  ) => Promise<ResultadoCrearProfesor | ResultadoProfesor>;
  textoBoton: string;
}) {
  const uid = useId();
  const [n1, n2] = partirNombre(inicial?.nombres ?? "");
  const [a1, a2] = partirNombre(inicial?.apellidos ?? "");
  const [cedula, setCedula] = useState(inicial?.cedula ?? "");
  const [nombre1, setNombre1] = useState(n1);
  const [nombre2, setNombre2] = useState(n2);
  const [apellido1, setApellido1] = useState(a1);
  const [apellido2, setApellido2] = useState(a2);
  const [email, setEmail] = useState(inicial?.email ?? "");
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
  const errores = validarProfesor({
    ...(inicial ? {} : { cedula }),
    primerNombre: nombre1,
    primerApellido: apellido1,
    email,
  });
  // D071: los errores aparecen al enviar y, ya a la vista, se corrigen en vivo sin anunciarse
  const ver = intentado ? errores : {};

  async function alEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
    enviando.current = true;
    setGuardando(true);
    setErrorServidor(null);
    const r = await enviar({
      cedula: cedula.trim(),
      nombres: unirNombre(nombre1, nombre2),
      apellidos: unirNombre(apellido1, apellido2),
      email: email.trim().toLowerCase(),
    }).catch((): ResultadoProfesor => ({ ok: false, error: "red" }));
    enviando.current = false;
    setGuardando(false);
    if (!r.ok) setErrorServidor(errorProfesorTexto(r.error));
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
        help={inicial ? AYUDA_CEDULA_EDITAR : AYUDA_CEDULA_CREAR}
        error={ver.cedula}
        announce={false}
      >
        {inicial ? (
          <Input readOnly value={cedulaTexto(inicial.cedula)} />
        ) : (
          <CedulaInput
            name="cedula"
            autoComplete="off"
            value={cedula}
            onChange={(e) => setCedula(e.currentTarget.value)}
          />
        )}
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
        <ErrorEnPantalla titulo="No se guardaron los cambios">
          {errorServidor}
        </ErrorEnPantalla>
      ) : null}
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" loading={guardando} loadingLabel="Guardando…">
          {textoBoton}
        </Button>
      </DialogFooter>
    </form>
  );
}

/* ---------- Eliminar ---------- */
// La contraseña temporal vive en `components/sections/shared/password-temporal-dialog.tsx` (W12)

export function EliminarProfesorDialog({
  profesor,
  eliminar,
}: {
  profesor: FilaProfesor;
  eliminar: AccionesProfesores["eliminar"];
}) {
  const [abierto, setAbierto] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enviando = useRef(false);
  const eliminado = useRef(false);
  const nombre = nombreProfesor(profesor);

  async function confirmar() {
    if (enviando.current) return;
    enviando.current = true;
    setBorrando(true);
    setError(null);
    const r = await eliminar(profesor.cedula).catch(
      (): ResultadoProfesor => ({ ok: false, error: "red" }),
    );
    enviando.current = false;
    setBorrando(false);
    if (!r.ok) {
      setError(errorProfesorTexto(r.error));
      return;
    }
    eliminado.current = true;
    setAbierto(false);
    toast(`Eliminaste a ${nombre}`);
  }

  return (
    <Dialog
      open={abierto}
      onOpenChange={(v) => {
        setAbierto(v);
        if (!v) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost-danger" size="sm">
          <Trash2 aria-hidden="true" />
          <span aria-hidden="true">Eliminar</span>
          <span className="sr-only">Eliminar a {nombre}</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        onCloseAutoFocus={(e) => {
          // Borrado: su fila (y este botón) se va con el refresh; el foco, a «Nuevo profesor»
          if (eliminado.current) {
            e.preventDefault();
            document.getElementById(NUEVO_PROFESOR_ID)?.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>¿Eliminar a {nombre}?</DialogTitle>
          <DialogDescription>
            Se borran su cuenta y su perfil: ya no podrá entrar. Las tareas,
            evaluaciones y ajustes que hizo se quedan.
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <ErrorEnPantalla titulo="No se eliminó">{error}</ErrorEnPantalla>
        ) : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="danger"
            loading={borrando}
            loadingLabel="Eliminando…"
            onClick={confirmar}
          >
            <Trash2 aria-hidden="true" />
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
