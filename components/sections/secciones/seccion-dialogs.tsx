"use client";
import { type FormEvent, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { ErrorEnPantalla } from "@/components/estados/errores";
import { BotonEnLinea } from "@/components/krea/boton-en-linea";
// Cuerpos del diálogo de Años y secciones (D318, D319): nuevo año, agregar sección, editar
// (= cambiar el número o la letra, solo vacío) y eliminar (solo vacío). Con datos, el diálogo
// explica por qué no con texto (`bloqueoTexto`) en vez de un botón deshabilitado mudo. Cada envío
// corta el doble clic con una ref y el botón queda ocupado (`loading`, D285); si el servidor no
// guarda, el diálogo sigue abierto con lo elegido y el error (D171).
import { hayRed } from "@/components/krea/use-en-linea";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { siNoEsDeploy } from "@/lib/recarga-deploy";
import {
  ANIO_MAX,
  ANIO_MIN,
  bloqueoTexto,
  type CatalogoSecciones,
  codigoSeccion,
  errorSeccionesTexto,
  type FilaAnio,
  type FilaSeccion,
  LETRA_MAX,
  LETRA_MIN,
  letrasDeTexto,
  letrasLibres,
  listaSecciones,
  nombreAnio,
  numerosLibres,
  type ResultadoSecciones,
} from "@/lib/secciones";

export type AccionesSecciones = {
  crearAnio: (e: {
    numero: number;
    letras: string[];
  }) => Promise<ResultadoSecciones>;
  editarAnio: (e: { de: number; a: number }) => Promise<ResultadoSecciones>;
  eliminarAnio: (numero: number) => Promise<ResultadoSecciones>;
  crearSeccion: (e: {
    numero: number;
    letra: string;
  }) => Promise<ResultadoSecciones>;
  editarSeccion: (e: {
    codigo: string;
    letra: string;
  }) => Promise<ResultadoSecciones>;
  eliminarSeccion: (codigo: string) => Promise<ResultadoSecciones>;
};

export type Dialogo =
  | { tipo: "nuevo-anio" }
  | { tipo: "agregar-seccion"; anio: FilaAnio }
  | { tipo: "editar-anio"; anio: FilaAnio }
  | { tipo: "eliminar-anio"; anio: FilaAnio }
  | { tipo: "editar-seccion"; anio: FilaAnio; seccion: FilaSeccion }
  | { tipo: "eliminar-seccion"; anio: FilaAnio; seccion: FilaSeccion };

/** «Nuevo año»: recibe el foco cuando lo que abrió el diálogo ya no está. */
export const NUEVO_ANIO_ID = "nuevo-anio";
export const idAgregarSeccion = (n: number) => `agregar-seccion-${n}`;
export const idEditarAnio = (n: number) => `editar-anio-${n}`;
export const idEliminarAnio = (n: number) => `eliminar-anio-${n}`;
export const idEditarSeccion = (c: string) => `editar-seccion-${c}`;
export const idEliminarSeccion = (c: string) => `eliminar-seccion-${c}`;

// PROVISIONAL (CONTENT_CHECKLIST fila 166): la pantalla no está en el lienzo
const AYUDA_LETRAS = "Ej.: A, B, C. Puedes dejarlo vacío y agregarlas después.";
const AYUDA_NUMERO =
  "Las secciones se llamarán con este número y su letra, como 5A.";

type Props = {
  dialogo: Dialogo;
  catalogo: CatalogoSecciones;
  acciones: AccionesSecciones;
  cerrar: () => void;
};

export function DialogoSecciones({
  dialogo,
  catalogo,
  acciones,
  cerrar,
}: Props) {
  switch (dialogo.tipo) {
    case "nuevo-anio":
      return (
        <NuevoAnio
          catalogo={catalogo}
          crear={acciones.crearAnio}
          cerrar={cerrar}
        />
      );
    case "agregar-seccion":
      return (
        <AgregarSeccion
          anio={dialogo.anio}
          catalogo={catalogo}
          crear={acciones.crearSeccion}
          cerrar={cerrar}
        />
      );
    case "editar-anio":
      return dialogo.anio.vacio ? (
        <EditarAnio
          anio={dialogo.anio}
          catalogo={catalogo}
          editar={acciones.editarAnio}
          cerrar={cerrar}
        />
      ) : (
        <Bloqueo
          titulo={`No se puede cambiar ${dialogo.anio.nombre}`}
          texto={bloqueoTexto(dialogo.anio.uso, "año")}
        />
      );
    case "eliminar-anio":
      return dialogo.anio.vacio ? (
        <Eliminar
          titulo={`¿Eliminar ${dialogo.anio.nombre}?`}
          descripcion={
            dialogo.anio.secciones.length === 0
              ? "No tiene secciones."
              : `Se eliminan también sus secciones: ${listaSecciones(
                  dialogo.anio.secciones.map((s) => s.codigo),
                )}. Están vacías: no se pierde nada guardado.`
          }
          eliminar={() => acciones.eliminarAnio(dialogo.anio.numero)}
          hecho={`Eliminaste ${dialogo.anio.nombre}`}
          cerrar={cerrar}
        />
      ) : (
        <Bloqueo
          titulo={`No se puede eliminar ${dialogo.anio.nombre}`}
          texto={bloqueoTexto(dialogo.anio.uso, "año")}
        />
      );
    case "editar-seccion":
      return dialogo.seccion.vacia ? (
        <EditarSeccion
          anio={dialogo.anio}
          seccion={dialogo.seccion}
          catalogo={catalogo}
          editar={acciones.editarSeccion}
          cerrar={cerrar}
        />
      ) : (
        <Bloqueo
          titulo={`No se puede cambiar ${dialogo.seccion.codigo}`}
          texto={bloqueoTexto(dialogo.seccion.uso, "sección")}
        />
      );
    case "eliminar-seccion":
      return dialogo.seccion.vacia ? (
        <Eliminar
          titulo={`¿Eliminar ${dialogo.seccion.codigo}?`}
          descripcion={`Sale de ${dialogo.anio.nombre}. Está vacía: no se pierde nada guardado.`}
          eliminar={() => acciones.eliminarSeccion(dialogo.seccion.codigo)}
          hecho={`Eliminaste ${dialogo.seccion.codigo}`}
          cerrar={cerrar}
        />
      ) : (
        <Bloqueo
          titulo={`No se puede eliminar ${dialogo.seccion.codigo}`}
          texto={bloqueoTexto(dialogo.seccion.uso, "sección")}
        />
      );
  }
}

/* ---------- Piezas comunes ---------- */

/** Envío con una sola vuelta a la vez; un fallo de red cuenta como `red`. */
function useEnvio() {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const vuela = useRef(false);
  async function enviar(
    accion: () => Promise<ResultadoSecciones>,
    errorTexto: (r: Extract<ResultadoSecciones, { ok: false }>) => string,
  ): Promise<boolean> {
    if (vuela.current) return false;
    vuela.current = true;
    setEnviando(true);
    setError(null);
    const r = await accion().catch(
      siNoEsDeploy<ResultadoSecciones>({ ok: false, error: "red" }),
    );
    vuela.current = false;
    setEnviando(false);
    if (!r.ok) setError(errorTexto(r));
    return r.ok;
  }
  return { enviando, error, enviar };
}

function Cancelar() {
  return (
    <DialogClose asChild>
      <Button type="button" variant="secondary">
        Cancelar
      </Button>
    </DialogClose>
  );
}

/** Con datos: por qué no, con texto, y solo «Entendido». */
function Bloqueo({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>{titulo}</DialogTitle>
        <DialogDescription>{texto}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button">Entendido</Button>
        </DialogClose>
      </DialogFooter>
    </>
  );
}

/** Un `Select` de opciones `[valor, texto]` dentro de su `Field`. */
function Opciones({
  label,
  help,
  valor,
  onCambio,
  opciones,
}: {
  label: string;
  help?: string;
  valor: string;
  onCambio: (v: string) => void;
  opciones: ReadonlyArray<readonly [string, string]>;
}) {
  return (
    <Field label={label} help={help}>
      <Select value={valor} onValueChange={onCambio}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {opciones.map(([v, t]) => (
            <SelectItem key={v} value={v}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function Pie({
  enviando,
  textoBoton,
}: {
  enviando: boolean;
  textoBoton: string;
}) {
  return (
    <DialogFooter>
      <Cancelar />
      <BotonEnLinea type="submit" loading={enviando} loadingLabel="Guardando…">
        {textoBoton}
      </BotonEnLinea>
    </DialogFooter>
  );
}

/* ---------- Nuevo año ---------- */

function NuevoAnio({
  catalogo,
  crear,
  cerrar,
}: {
  catalogo: CatalogoSecciones;
  crear: AccionesSecciones["crearAnio"];
  cerrar: () => void;
}) {
  const uid = useId();
  const libres = numerosLibres(catalogo);
  const [numero, setNumero] = useState(String(libres[0] ?? ""));
  const [texto, setTexto] = useState("");
  const [intentado, setIntentado] = useState(false);
  const { enviando, error, enviar } = useEnvio();
  const letras = letrasDeTexto(texto);
  const idLetras = `${uid}-letras`;

  if (libres.length === 0) {
    return (
      <Bloqueo
        titulo={`Ya están los ${ANIO_MAX} años`}
        texto={`Cada año va del ${ANIO_MIN}.º al ${ANIO_MAX}.º y ya existen todos. Para cambiar uno, edita su número mientras esté vacío.`}
      />
    );
  }

  async function alEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!hayRed()) return;
    if (!letras.ok) {
      setIntentado(true);
      document.getElementById(idLetras)?.focus();
      return;
    }
    const n = Number(numero);
    const ok = await enviar(
      () => crear({ numero: n, letras: letras.letras }),
      (r) => errorSeccionesTexto(r.error, nombreAnio(n)),
    );
    if (ok) {
      cerrar();
      toast(`Creaste ${nombreAnio(n)}`);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nuevo año</DialogTitle>
        <DialogDescription>
          Elige su número y, si quieres, las letras de sus secciones.
        </DialogDescription>
      </DialogHeader>
      <form
        method="post"
        noValidate
        onSubmit={alEnviar}
        className="flex flex-col gap-4"
      >
        <Opciones
          label="Año"
          help={AYUDA_NUMERO}
          valor={numero}
          onCambio={setNumero}
          opciones={libres.map((n) => [String(n), nombreAnio(n)] as const)}
        />
        <Field
          label="Secciones"
          controlId={idLetras}
          help={AYUDA_LETRAS}
          error={intentado && !letras.ok ? letras.error : undefined}
          announce={false}
        >
          <Input
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={texto}
            onChange={(e) => setTexto(e.currentTarget.value)}
          />
        </Field>
        {error ? (
          <ErrorEnPantalla titulo="No se creó el año">{error}</ErrorEnPantalla>
        ) : null}
        <Pie enviando={enviando} textoBoton="Crear año" />
      </form>
    </>
  );
}

/* ---------- Agregar sección ---------- */

function AgregarSeccion({
  anio,
  catalogo,
  crear,
  cerrar,
}: {
  anio: FilaAnio;
  catalogo: CatalogoSecciones;
  crear: AccionesSecciones["crearSeccion"];
  cerrar: () => void;
}) {
  const libres = letrasLibres(catalogo, anio.numero);
  const [letra, setLetra] = useState(libres[0] ?? "");
  const { enviando, error, enviar } = useEnvio();

  if (libres.length === 0) {
    return (
      <Bloqueo
        titulo={`${anio.nombre} ya tiene todas las letras`}
        texto={`Tiene una sección por cada letra de la ${LETRA_MIN} a la ${LETRA_MAX}.`}
      />
    );
  }

  async function alEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!hayRed()) return;
    const codigo = codigoSeccion(anio.numero, letra);
    const ok = await enviar(
      () => crear({ numero: anio.numero, letra }),
      (r) => errorSeccionesTexto(r.error, codigo),
    );
    if (ok) {
      cerrar();
      toast(`Agregaste ${codigo}`);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Agregar sección</DialogTitle>
        <DialogDescription>En {anio.nombre}.</DialogDescription>
      </DialogHeader>
      <form
        method="post"
        noValidate
        onSubmit={alEnviar}
        className="flex flex-col gap-4"
      >
        <Opciones
          label="Letra"
          help={`La sección se llamará ${codigoSeccion(anio.numero, letra)}.`}
          valor={letra}
          onCambio={setLetra}
          opciones={libres.map((l) => [l, l] as const)}
        />
        {error ? (
          <ErrorEnPantalla titulo="No se agregó la sección">
            {error}
          </ErrorEnPantalla>
        ) : null}
        <Pie enviando={enviando} textoBoton="Agregar sección" />
      </form>
    </>
  );
}

/* ---------- Editar (solo vacío) ---------- */

function EditarAnio({
  anio,
  catalogo,
  editar,
  cerrar,
}: {
  anio: FilaAnio;
  catalogo: CatalogoSecciones;
  editar: AccionesSecciones["editarAnio"];
  cerrar: () => void;
}) {
  const opciones = [anio.numero, ...numerosLibres(catalogo)].sort(
    (a, b) => a - b,
  );
  const [numero, setNumero] = useState(String(anio.numero));
  const { enviando, error, enviar } = useEnvio();

  async function alEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!hayRed()) return;
    const a = Number(numero);
    if (a === anio.numero) {
      cerrar();
      return;
    }
    const ok = await enviar(
      () => editar({ de: anio.numero, a }),
      (r) => errorSeccionesTexto(r.error, nombreAnio(a)),
    );
    if (ok) {
      cerrar();
      toast(`Cambiaste ${anio.nombre} por ${nombreAnio(a)}`);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Editar {anio.nombre}</DialogTitle>
        <DialogDescription>
          {anio.secciones.length === 0
            ? "No tiene secciones."
            : `Sus secciones (${listaSecciones(
                anio.secciones.map((s) => s.codigo),
              )}) cambian de número con él. Están vacías: no se pierde nada guardado.`}
        </DialogDescription>
      </DialogHeader>
      <form
        method="post"
        noValidate
        onSubmit={alEnviar}
        className="flex flex-col gap-4"
      >
        <Opciones
          label="Año"
          help={AYUDA_NUMERO}
          valor={numero}
          onCambio={setNumero}
          opciones={opciones.map((n) => [String(n), nombreAnio(n)] as const)}
        />
        {error ? (
          <ErrorEnPantalla titulo="No se guardaron los cambios">
            {error}
          </ErrorEnPantalla>
        ) : null}
        <Pie enviando={enviando} textoBoton="Guardar cambios" />
      </form>
    </>
  );
}

function EditarSeccion({
  anio,
  seccion,
  catalogo,
  editar,
  cerrar,
}: {
  anio: FilaAnio;
  seccion: FilaSeccion;
  catalogo: CatalogoSecciones;
  editar: AccionesSecciones["editarSeccion"];
  cerrar: () => void;
}) {
  const opciones = [
    seccion.letra,
    ...letrasLibres(catalogo, anio.numero),
  ].sort();
  const [letra, setLetra] = useState(seccion.letra);
  const { enviando, error, enviar } = useEnvio();
  const nuevo = codigoSeccion(anio.numero, letra);

  async function alEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!hayRed()) return;
    if (letra === seccion.letra) {
      cerrar();
      return;
    }
    const ok = await enviar(
      () => editar({ codigo: seccion.codigo, letra }),
      (r) => errorSeccionesTexto(r.error, nuevo),
    );
    if (ok) {
      cerrar();
      toast(`Cambiaste ${seccion.codigo} por ${nuevo}`);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Editar {seccion.codigo}</DialogTitle>
        <DialogDescription>
          Está vacía: puedes cambiarle la letra dentro de {anio.nombre}.
        </DialogDescription>
      </DialogHeader>
      <form
        method="post"
        noValidate
        onSubmit={alEnviar}
        className="flex flex-col gap-4"
      >
        <Opciones
          label="Letra"
          help={`La sección se llamará ${nuevo}.`}
          valor={letra}
          onCambio={setLetra}
          opciones={opciones.map((l) => [l, l] as const)}
        />
        {error ? (
          <ErrorEnPantalla titulo="No se guardaron los cambios">
            {error}
          </ErrorEnPantalla>
        ) : null}
        <Pie enviando={enviando} textoBoton="Guardar cambios" />
      </form>
    </>
  );
}

/* ---------- Eliminar (solo vacío) ---------- */

function Eliminar({
  titulo,
  descripcion,
  eliminar,
  hecho,
  cerrar,
}: {
  titulo: string;
  descripcion: string;
  eliminar: () => Promise<ResultadoSecciones>;
  hecho: string;
  cerrar: () => void;
}) {
  const { enviando, error, enviar } = useEnvio();

  async function confirmar() {
    const ok = await enviar(eliminar, (r) => errorSeccionesTexto(r.error));
    if (ok) {
      cerrar();
      toast(hecho);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{titulo}</DialogTitle>
        <DialogDescription>{descripcion}</DialogDescription>
      </DialogHeader>
      {error ? (
        <ErrorEnPantalla titulo="No se eliminó">{error}</ErrorEnPantalla>
      ) : null}
      <DialogFooter>
        <Cancelar />
        <BotonEnLinea
          type="button"
          variant="danger"
          loading={enviando}
          loadingLabel="Eliminando…"
          onClick={confirmar}
        >
          Eliminar
        </BotonEnLinea>
      </DialogFooter>
    </>
  );
}
