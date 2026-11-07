"use client";
// Crear, editar y eliminar equipos (W12, D270, D271). Cada formulario corta el doble envío con una
// ref y el botón queda ocupado (`loading`, D285); si el servidor no guarda, el diálogo sigue
// abierto con lo escrito y el error (D171). «Eliminar» siempre abre su diálogo: si el equipo no se
// puede eliminar, el diálogo dice por qué y no ofrece confirmar (no hay botón apagado sin razón).
import { Pencil, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useId, useRef, useState } from "react";
import { ErrorEnPantalla } from "@/components/estados/errores";
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
import { toast } from "@/components/ui/sonner";
import {
  type BloqueoEquipo,
  bloqueoTexto,
  type CrearEquipo,
  creadoEquipoTexto,
  type EditarEquipo,
  errorGestionEquipoTexto,
  type ResultadoGestionEquipo,
  TEMA_AYUDA,
  validarEquipo,
} from "@/lib/equipos-gestion";
import type { SeccionEquipos } from "@/lib/equipos-profe";

export type AccionesGestionEquipos = {
  crear: (entrada: CrearEquipo) => Promise<ResultadoGestionEquipo>;
  editar: (entrada: EditarEquipo) => Promise<ResultadoGestionEquipo>;
  eliminar: (equipoId: string) => Promise<ResultadoGestionEquipo>;
};

const RED: ResultadoGestionEquipo = { ok: false, error: "red" };

/** `id` de «Nuevo equipo»: el foco vuelve aquí cuando la tarjeta eliminada desaparece. */
export const NUEVO_EQUIPO_ID = "nuevo-equipo";

/* ---------- Crear ---------- */

export function CrearEquipoDialog({
  seccion,
  crear,
}: {
  seccion: SeccionEquipos;
  crear: AccionesGestionEquipos["crear"];
}) {
  const [abierto, setAbierto] = useState(false);
  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button id={NUEVO_EQUIPO_ID}>
          <Plus aria-hidden="true" />
          Nuevo equipo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo equipo en {seccion}</DialogTitle>
          <DialogDescription>
            Nace sin integrantes: asígnaselos desde «Sin equipo». El primero que
            entre será su capitán.
          </DialogDescription>
        </DialogHeader>
        <EquipoForm
          seccion={seccion}
          textoBoton="Crear equipo"
          enviar={async (datos) => {
            const r = await crear({ ...datos, seccion });
            if (r.ok) {
              setAbierto(false);
              toast(creadoEquipoTexto(datos.nombre.trim()));
            }
            return r;
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Editar ---------- */

export function EditarEquipoDialog({
  equipo,
  seccion,
  editar,
}: {
  equipo: { id: string; nombre: string; tema: string | null };
  seccion: SeccionEquipos;
  editar: AccionesGestionEquipos["editar"];
}) {
  const [abierto, setAbierto] = useState(false);
  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil aria-hidden="true" />
          <span aria-hidden="true">Editar</span>
          <span className="sr-only">Editar el equipo {equipo.nombre}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar equipo</DialogTitle>
          <DialogDescription>
            {equipo.nombre} · {seccion}
          </DialogDescription>
        </DialogHeader>
        <EquipoForm
          seccion={seccion}
          inicial={equipo}
          textoBoton="Guardar cambios"
          enviar={async (datos) => {
            const r = await editar({ ...datos, equipoId: equipo.id });
            if (r.ok) {
              setAbierto(false);
              toast("Cambios guardados");
            }
            return r;
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function EquipoForm({
  seccion,
  inicial,
  textoBoton,
  enviar,
}: {
  seccion: SeccionEquipos;
  inicial?: { nombre: string; tema: string | null };
  textoBoton: string;
  enviar: (d: {
    nombre: string;
    tema: string;
  }) => Promise<ResultadoGestionEquipo>;
}) {
  const uid = useId();
  const [nombre, setNombre] = useState(inicial?.nombre ?? "");
  const [tema, setTema] = useState(inicial?.tema ?? "");
  const [intentado, setIntentado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const enviando = useRef(false);
  const ids = { nombre: `${uid}-nombre`, tema: `${uid}-tema` };
  const errores = validarEquipo({ nombre, tema });
  // D071: los errores aparecen al enviar y, ya a la vista, se corrigen en vivo sin anunciarse
  const ver = intentado ? errores : {};

  async function alEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando.current) return;
    const primero = errores.nombre
      ? ids.nombre
      : errores.tema
        ? ids.tema
        : null;
    if (primero) {
      setIntentado(true);
      document.getElementById(primero)?.focus();
      return;
    }
    enviando.current = true;
    setGuardando(true);
    setErrorServidor(null);
    const r = await enviar({ nombre: nombre.trim(), tema: tema.trim() }).catch(
      () => RED,
    );
    enviando.current = false;
    setGuardando(false);
    if (!r.ok) {
      setErrorServidor(errorGestionEquipoTexto(r.error, seccion));
      if (r.error === "repetido") document.getElementById(ids.nombre)?.focus();
    }
  }

  return (
    <form
      method="post"
      noValidate
      onSubmit={alEnviar}
      className="flex flex-col gap-4"
    >
      <Field
        label="Nombre del equipo"
        controlId={ids.nombre}
        error={ver.nombre}
        announce={false}
      >
        <Input
          autoComplete="off"
          maxLength={80}
          value={nombre}
          onChange={(e) => setNombre(e.currentTarget.value)}
        />
      </Field>
      <Field
        label="Tema"
        controlId={ids.tema}
        help={TEMA_AYUDA}
        error={ver.tema}
        announce={false}
      >
        <Input
          autoComplete="off"
          maxLength={60}
          value={tema}
          onChange={(e) => setTema(e.currentTarget.value)}
        />
      </Field>
      {errorServidor ? (
        <ErrorEnPantalla titulo="No se guardó">{errorServidor}</ErrorEnPantalla>
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

export function EliminarEquipoDialog({
  equipo,
  bloqueo,
  eliminar,
  onEliminado,
}: {
  equipo: { id: string; nombre: string };
  /** Por qué no se puede (integrantes del tablero, entregas y ajustes del servidor). */
  bloqueo: BloqueoEquipo | null;
  eliminar: AccionesGestionEquipos["eliminar"];
  onEliminado: (equipoId: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enviando = useRef(false);

  async function confirmar() {
    if (enviando.current) return;
    enviando.current = true;
    setBorrando(true);
    setError(null);
    const r = await eliminar(equipo.id).catch(() => RED);
    enviando.current = false;
    setBorrando(false);
    if (!r.ok) {
      setError(errorGestionEquipoTexto(r.error));
      return;
    }
    setAbierto(false);
    onEliminado(equipo.id);
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
        <Button variant="ghost" size="sm" className="text-error">
          <Trash2 aria-hidden="true" />
          <span aria-hidden="true">Eliminar</span>
          <span className="sr-only">Eliminar el equipo {equipo.nombre}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        {bloqueo ? (
          <>
            <DialogHeader>
              <DialogTitle>{equipo.nombre} no se puede eliminar</DialogTitle>
              <DialogDescription>{bloqueoTexto(bloqueo)}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button">Entendido</Button>
              </DialogClose>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>¿Eliminar el equipo {equipo.nombre}?</DialogTitle>
              <DialogDescription>
                No tiene integrantes, entregas grupales ni ajustes: no se pierde
                ninguna nota. Se borra también su logo. No se puede deshacer.
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
