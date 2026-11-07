"use client";

import { Pencil, UserPen } from "lucide-react";
import { type ReactNode, useId, useRef, useState } from "react";
import { ErrorEnPantalla } from "@/components/estados/errores";
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
import {
  conflictoDetalle,
  type EditarAlumno,
  errorAlumnoTexto,
  type ResultadoAlumno,
  type VersionAlumno,
  versionDe,
} from "@/lib/alumnos-datos";
import { BASE_MAX, BASE_MIN } from "@/lib/grades";
import { partirNombre } from "@/lib/perfil";
import { avisoPresencia, presenciaTexto } from "@/lib/presencia";
import { type Presencia, useMarcarPresencia } from "./use-presencia";

/** Lo que cambia en la fila al guardar. */
export type CambiosAlumno = Pick<
  FilaAlumno,
  "nombres" | "apellidos" | "base"
> & {
  email?: string | null;
};

/** La Server Action `editarAlumno` (D209). */
export type GuardarAlumno = (entrada: EditarAlumno) => Promise<ResultadoAlumno>;

/**
 * "Editar" de una fila + diálogo (HANDOFF §3 Alumnos, §2.13). Un `Dialog` por fila con su propio
 * `DialogTrigger`: al cerrar, Radix devuelve el foco al botón que lo abrió. El contenido solo se
 * monta abierto, así que el formulario siempre parte de los datos vigentes. Con `guardar` escribe
 * en Firestore (D209): si falla, el diálogo sigue abierto con lo escrito y el error (D171); sin
 * `guardar` (vista previa) solo `onGuardado`. `eliminar` (W12) va a la izquierda del pie.
 * Con `presencia` (W14, D275–D277): mientras está abierto marca «estoy editando» y avisa si otro
 * profe edita al mismo alumno; si otro guardó en medio, el servidor responde `conflicto` y el
 * diálogo muestra lo vigente sin borrar lo escrito (el siguiente «Guardar» gana).
 */
export function EditStudentDialog({
  alumno,
  abiertoInicial = false,
  onAbierto,
  guardar,
  onGuardado,
  eliminar,
  presencia,
  onYaNoExiste,
}: {
  alumno: FilaAlumno;
  /**
   * Abre la ficha al montar (viene de `?alumno=` en la URL, D252) y también si pasa a `true`
   * después (la ficha del alumno recién creado, D267).
   */
  abiertoInicial?: boolean;
  /** Avisa de cada apertura o cierre para reflejarlo en la URL. */
  onAbierto?: (cedula: string, abierto: boolean) => void;
  guardar?: GuardarAlumno;
  onGuardado: (cedula: string, cambios: CambiosAlumno) => void;
  /** «Eliminar alumno» (D268); sin él, la ficha no lo ofrece (vista previa). */
  eliminar?: ReactNode;
  /** Presencia en vivo (D277); sin ella (vista previa), ni marca ni avisa. */
  presencia?: Presencia | null;
  /**
   * Al guardar, el servidor dice que ya no existe (otro profe lo eliminó, D298): la ficha se
   * cierra y la pantalla quita la fila con un aviso. Sin él, el error se queda en el diálogo.
   */
  onYaNoExiste?: (cedula: string) => void;
}) {
  const [abierto, setAbierto] = useState(abiertoInicial);
  const [pedidoAntes, setPedidoAntes] = useState(abiertoInicial);
  if (abiertoInicial !== pedidoAntes) {
    setPedidoAntes(abiertoInicial);
    if (abiertoInicial) setAbierto(true);
  }
  return (
    <Dialog
      open={abierto}
      onOpenChange={(v) => {
        setAbierto(v);
        onAbierto?.(alumno.cedula, v);
      }}
    >
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
          guardar={guardar}
          eliminar={eliminar}
          presencia={presencia}
          onListo={(cambios) => {
            onGuardado(alumno.cedula, cambios);
            setAbierto(false);
          }}
          onVigente={(actual) => onGuardado(alumno.cedula, actual)}
          onYaNoExiste={
            onYaNoExiste
              ? () => {
                  setAbierto(false);
                  onYaNoExiste(alumno.cedula);
                }
              : undefined
          }
        />
      </DialogContent>
    </Dialog>
  );
}

function EditForm({
  alumno,
  guardar,
  eliminar,
  presencia,
  onListo,
  onVigente,
  onYaNoExiste,
}: {
  alumno: FilaAlumno;
  guardar?: GuardarAlumno;
  eliminar?: ReactNode;
  presencia?: Presencia | null;
  onListo: (cambios: CambiosAlumno) => void;
  /** Conflicto (D276): la fila pasa a lo que otro profe guardó; el diálogo sigue abierto. */
  onVigente: (actual: CambiosAlumno) => void;
  onYaNoExiste?: () => void;
}) {
  const uid = useId();
  // Mientras el formulario está montado (= el diálogo abierto), «estoy editando» (D275)
  useMarcarPresencia(presencia, alumno.cedula);
  const otros = presenciaTexto(presencia?.editoresDe(alumno.cedula) ?? []);
  const [nom1, nom2] = partirNombre(alumno.nombres);
  const [ape1, ape2] = partirNombre(alumno.apellidos);
  const [nombre1, setNombre1] = useState(nom1);
  const [nombre2, setNombre2] = useState(nom2);
  const [apellido1, setApellido1] = useState(ape1);
  const [apellido2, setApellido2] = useState(ape2);
  const [base, setBase] = useState(alumno.base);
  const [motivo, setMotivo] = useState("");
  // El email solo se edita con datos reales (la vista previa no lo trae)
  const conEmail = alumno.email !== undefined;
  const [email, setEmail] = useState(alumno.email ?? "");
  const [intentado, setIntentado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  // Lo que había al abrir (D276); tras un conflicto, lo que el servidor dijo que hay ahora
  const [version, setVersion] = useState<VersionAlumno>(() =>
    versionDe(alumno, conEmail ? (alumno.email ?? null) : undefined),
  );
  const enviando = useRef(false);

  const ids = {
    nombre1: `${uid}-nombre1`,
    apellido1: `${uid}-apellido1`,
    base: `${uid}-base`,
    motivo: `${uid}-motivo`,
    email: `${uid}-email`,
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
    primerNombre: nombre1,
    primerApellido: apellido1,
    ...(conEmail ? { email } : {}),
  });
  // D071: los errores aparecen al enviar y, ya a la vista, se corrigen en vivo sin anunciarse
  const ver = intentado ? errores : {};

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando.current) return;
    const primero = errores.nombres
      ? ids.nombre1
      : errores.apellidos
        ? ids.apellido1
        : errores.base
          ? ids.base
          : errores.motivo
            ? ids.motivo
            : errores.email
              ? ids.email
              : null;
    if (primero) {
      setIntentado(true);
      document.getElementById(primero)?.focus();
      return;
    }
    const emailLimpio = email.trim().toLowerCase();
    const cambios: CambiosAlumno = conEmail
      ? {
          nombres,
          apellidos,
          base,
          email: emailLimpio === "" ? null : emailLimpio,
        }
      : { nombres, apellidos, base };
    if (!guardar) {
      onListo(cambios);
      return;
    }
    enviando.current = true;
    setGuardando(true);
    setErrorServidor(null);
    const r = await guardar({
      cedula: alumno.cedula,
      nombres,
      apellidos,
      base,
      motivo: cambioBase ? motivo.trim() : "",
      ...(conEmail ? { email: emailLimpio } : {}),
      version,
    }).catch((): ResultadoAlumno => ({ ok: false, error: "red" }));
    enviando.current = false;
    setGuardando(false);
    if (r.ok) onListo(cambios);
    else if (r.error === "no-existe" && onYaNoExiste) onYaNoExiste();
    else if (r.error === "conflicto") {
      // Lo escrito se queda en los campos; el próximo «Guardar» parte de lo vigente y gana
      setVersion(r.actual);
      onVigente(r.actual);
      setErrorServidor(
        `${errorAlumnoTexto("conflicto")} ${conflictoDetalle(r.actual)}`,
      );
    } else setErrorServidor(errorAlumnoTexto(r.error));
  };

  return (
    <form
      method="post"
      noValidate
      onSubmit={enviar}
      className="flex flex-col gap-4"
    >
      {/* Se anuncia una vez por cambio de quién edita (no con cada latido): el texto no cambia */}
      <output className="sr-only" aria-live="polite">
        {otros ? avisoPresencia(otros) : ""}
      </output>
      {otros ? (
        <p
          aria-hidden="true"
          className="flex icono-linea gap-2 rounded-sm bg-accent-soft-2 px-3 py-2 text-small text-text"
        >
          <UserPen
            aria-hidden="true"
            className="size-4 shrink-0 text-accent-ink"
          />
          <span>{avisoPresencia(otros)}</span>
        </p>
      ) : null}
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
      {conEmail ? (
        <>
          <Separator />
          <Field
            label="Email de recuperación"
            controlId={ids.email}
            help="Para «Olvidé mi contraseña». Déjalo vacío si el alumno no tiene."
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
        </>
      ) : null}
      {errorServidor ? (
        <ErrorEnPantalla titulo="No se guardaron los cambios">
          {errorServidor}
        </ErrorEnPantalla>
      ) : null}
      <DialogFooter>
        {eliminar ? <div className="mr-auto">{eliminar}</div> : null}
        <DialogClose asChild>
          <Button type="button" variant="secondary">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" loading={guardando} loadingLabel="Guardando…">
          Guardar cambios
        </Button>
      </DialogFooter>
    </form>
  );
}
