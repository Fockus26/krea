"use client";
// «Editar opciones» de Ajustes de puntos (D375, D377): las opciones fijas de Motivo con su valor
// propuesto, comunes a todos los profes. Un solo diálogo con tres vistas: la lista (cada opción
// con Editar y Borrar, y «Nueva opción» debajo), editar una y confirmar el borrado. Cada envío
// corta el doble clic con una ref y el botón queda ocupado (`loading`, D285); si no se guarda, el
// diálogo sigue con lo escrito y el error (D171). Mientras el diálogo está abierto el resto de la
// página queda oculto para los lectores de pantalla (también el Toaster): lo hecho se dice en una
// región viva del propio diálogo, no en un toast.
// PROVISIONAL (CONTENT_CHECKLIST fila 191): ningún texto de este diálogo está en el lienzo.
import { ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { ErrorEnPantalla } from "@/components/estados/errores";
import { focusPrimerInvalido } from "@/components/sections/auth/focus-invalid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  type CatalogoMotivos,
  errorMotivosTexto,
  limpiarEtiqueta,
  type Motivo,
  type ResultadoMotivos,
  validarOpcion,
} from "@/lib/motivos";
import { chipMotivo } from "@/lib/puntos";
import { PuntosStepper } from "./puntos-stepper";

export type AccionesMotivos = {
  crear: (e: { etiqueta: string; valor: number }) => Promise<ResultadoMotivos>;
  editar: (e: {
    id: string;
    etiqueta: string;
    valor: number;
  }) => Promise<ResultadoMotivos>;
  borrar: (id: string) => Promise<ResultadoMotivos>;
};

type Vista =
  | { tipo: "lista" }
  | { tipo: "editar"; motivo: Motivo }
  | { tipo: "borrar"; motivo: Motivo };

const AYUDA_VALOR =
  "Se propone al elegirla; al aplicar el ajuste lo puedes cambiar.";
const idEditar = (base: string, id: string) => `${base}-editar-${id}`;

/** Envío con una sola vuelta a la vez; un fallo de red cuenta como `red`. */
function useEnvio() {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const vuela = useRef(false);
  async function enviar(
    accion: () => Promise<ResultadoMotivos>,
    que?: string,
  ): Promise<ResultadoMotivos | null> {
    if (vuela.current) return null;
    vuela.current = true;
    setEnviando(true);
    setError(null);
    const r = await accion().catch(
      (): ResultadoMotivos => ({ ok: false, error: "red" }),
    );
    vuela.current = false;
    setEnviando(false);
    if (!r.ok) setError(errorMotivosTexto(r.error, que));
    return r;
  }
  return { enviando, error, enviar };
}

export function MotivosDialog({
  motivos,
  acciones,
}: {
  motivos: CatalogoMotivos;
  acciones: AccionesMotivos;
}) {
  const base = useId();
  const [abierto, setAbierto] = useState(false);
  const [vista, setVista] = useState<Vista>({ tipo: "lista" });
  const [hecho, setHecho] = useState("");
  // Al volver a la lista, a dónde va el foco (la opción editada, la siguiente a la borrada…)
  const foco = useRef<string | null>(null);
  const idNueva = `${base}-nueva`;

  useEffect(() => {
    if (vista.tipo !== "lista" || !foco.current) return;
    const el =
      document.getElementById(foco.current) ?? document.getElementById(idNueva);
    foco.current = null;
    el?.focus();
  }, [vista, idNueva]);

  const volver = (mensaje: string, focoEn: string | null) => {
    setHecho(mensaje);
    foco.current = focoEn;
    setVista({ tipo: "lista" });
  };

  return (
    <Dialog
      open={abierto}
      onOpenChange={(v) => {
        setAbierto(v);
        if (v) {
          setVista({ tipo: "lista" });
          setHecho("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" size="sm">
          <ListChecks aria-hidden="true" />
          Editar opciones
        </Button>
      </DialogTrigger>
      <DialogContent>
        {vista.tipo === "lista" ? (
          <Lista
            base={base}
            idNueva={idNueva}
            motivos={motivos}
            acciones={acciones}
            onHecho={setHecho}
            onEditar={(m) => {
              setHecho("");
              setVista({ tipo: "editar", motivo: m });
            }}
            onBorrar={(m) => {
              setHecho("");
              setVista({ tipo: "borrar", motivo: m });
            }}
          />
        ) : vista.tipo === "editar" ? (
          <Editar
            motivo={vista.motivo}
            motivos={motivos}
            editar={acciones.editar}
            onCancelar={() => volver("", idEditar(base, vista.motivo.id))}
            onHecho={(m) =>
              volver(`Guardaste «${m.etiqueta}».`, idEditar(base, m.id))
            }
          />
        ) : (
          <Borrar
            motivo={vista.motivo}
            ultima={motivos.length <= 1}
            borrar={acciones.borrar}
            onCancelar={() => volver("", idEditar(base, vista.motivo.id))}
            onHecho={(restantes) => {
              const i = motivos.findIndex((m) => m.id === vista.motivo.id);
              const siguiente = restantes[Math.min(i, restantes.length - 1)];
              volver(
                `Borraste «${vista.motivo.etiqueta}».`,
                siguiente ? idEditar(base, siguiente.id) : null,
              );
            }}
          />
        )}
        {/* Lo último que se hizo (el Toaster queda fuera del modal). Fuera de las vistas: la
            región viva sigue montada al pasar de una a otra y el cambio se anuncia */}
        <output
          aria-live="polite"
          aria-atomic="true"
          className="block text-small text-text-2"
        >
          {hecho}
        </output>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Lista + «Nueva opción» ---------- */

function Lista({
  base,
  idNueva,
  motivos,
  acciones,
  onHecho,
  onEditar,
  onBorrar,
}: {
  base: string;
  idNueva: string;
  motivos: CatalogoMotivos;
  acciones: AccionesMotivos;
  onHecho: (mensaje: string) => void;
  onEditar: (m: Motivo) => void;
  onBorrar: (m: Motivo) => void;
}) {
  const tituloNueva = `${base}-titulo-nueva`;
  return (
    <>
      <DialogHeader>
        <DialogTitle>Opciones de motivo</DialogTitle>
        <DialogDescription>
          Son las mismas para todos los profes. Los ajustes ya aplicados no
          cambian.
        </DialogDescription>
      </DialogHeader>
      <ul className="flex flex-col divide-y divide-divider">
        {motivos.map((m) => {
          const chip = chipMotivo(m.valor);
          return (
            <li key={m.id} className="flex items-center gap-2 py-2">
              <span className="min-w-0 flex-1 break-words text-body text-text">
                {m.etiqueta}
              </span>
              <Badge variant={chip.variante} className="nums">
                <span aria-hidden="true">{chip.visible}</span>
                <span className="sr-only">{chip.accesible}</span>
              </Badge>
              <Button
                id={idEditar(base, m.id)}
                type="button"
                variant="ghost"
                size="sm"
                icon
                aria-label={`Editar «${m.etiqueta}»`}
                onClick={() => onEditar(m)}
              >
                <Pencil aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost-danger"
                size="sm"
                icon
                aria-label={`Borrar «${m.etiqueta}»`}
                onClick={() => onBorrar(m)}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </li>
          );
        })}
      </ul>
      <Separator />
      <section aria-labelledby={tituloNueva} className="flex flex-col gap-4">
        <h3 id={tituloNueva} className="text-h4 text-text">
          Nueva opción
        </h3>
        <FormOpcion
          idEtiqueta={idNueva}
          motivos={motivos}
          textoBoton="Agregar opción"
          icono={<Plus aria-hidden="true" />}
          tituloError="No se agregó la opción"
          enviar={(o) => acciones.crear(o)}
          onHecho={(o) => onHecho(`Agregaste «${o.etiqueta}».`)}
          vaciarAlGuardar
        />
      </section>
    </>
  );
}

/* ---------- Formulario de una opción (nueva o editada) ---------- */

function FormOpcion({
  idEtiqueta,
  motivos,
  inicial,
  excepto,
  textoBoton,
  icono,
  tituloError,
  enviar: guardar,
  onHecho,
  onCancelar,
  vaciarAlGuardar = false,
}: {
  idEtiqueta: string;
  motivos: CatalogoMotivos;
  inicial?: { etiqueta: string; valor: number };
  /** Id de la opción que se edita: su propia etiqueta no cuenta como repetida. */
  excepto?: string;
  textoBoton: string;
  icono?: ReactNode;
  tituloError: string;
  enviar: (o: { etiqueta: string; valor: number }) => Promise<ResultadoMotivos>;
  onHecho: (o: { etiqueta: string; valor: number }) => void;
  onCancelar?: () => void;
  vaciarAlGuardar?: boolean;
}) {
  const uid = useId();
  const lPuntos = `${uid}-puntos`;
  const idPuntos = `${uid}-puntos-campo`;
  const hPuntos = `${uid}-puntos-ayuda`;
  const ePuntos = `${uid}-puntos-error`;
  const [etiqueta, setEtiqueta] = useState(inicial?.etiqueta ?? "");
  const [valor, setValor] = useState<number | null>(inicial?.valor ?? null);
  const [intentado, setIntentado] = useState(false);
  const { enviando, error, enviar } = useEnvio();
  const errores = intentado
    ? validarOpcion(motivos, { etiqueta, valor }, excepto)
    : {};

  async function alEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const err = validarOpcion(motivos, { etiqueta, valor }, excepto);
    if (err.etiqueta || err.valor || valor === null) {
      setIntentado(true);
      // Tras pintar los errores, al primer campo inválido
      requestAnimationFrame(() => focusPrimerInvalido(form));
      return;
    }
    const o = { etiqueta: limpiarEtiqueta(etiqueta), valor };
    const r = await enviar(() => guardar(o), o.etiqueta);
    if (!r?.ok) return;
    onHecho(o);
    if (vaciarAlGuardar) {
      setEtiqueta("");
      setValor(null);
      setIntentado(false);
      document.getElementById(idEtiqueta)?.focus();
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
        label={
          <>
            Nombre{" "}
            <span aria-hidden="true" className="text-error">
              *
            </span>
            <span className="sr-only">(obligatorio)</span>
          </>
        }
        controlId={idEtiqueta}
        error={errores.etiqueta}
        announce={false}
      >
        <Input
          required
          autoComplete="off"
          value={etiqueta}
          onChange={(e) => setEtiqueta(e.currentTarget.value)}
        />
      </Field>
      <div className="flex flex-col gap-1.5">
        <Label id={lPuntos} htmlFor={idPuntos}>
          Puntos{" "}
          <span aria-hidden="true" className="text-error">
            *
          </span>
          <span className="sr-only">(obligatorio)</span>
        </Label>
        <div className="flex flex-wrap items-center gap-2">
          <PuntosStepper
            id={idPuntos}
            aria-labelledby={lPuntos}
            value={valor}
            emptyText="Sin valor"
            aria-invalid={errores.valor ? true : undefined}
            aria-describedby={[hPuntos, errores.valor ? ePuntos : null]
              .filter(Boolean)
              .join(" ")}
            onChange={setValor}
          />
        </div>
        <p id={hPuntos} className="text-small text-text-2">
          {AYUDA_VALOR}
        </p>
        {errores.valor ? (
          <p id={ePuntos} className="text-small-b text-error">
            {errores.valor}
          </p>
        ) : null}
      </div>
      {error ? (
        <ErrorEnPantalla titulo={tituloError}>{error}</ErrorEnPantalla>
      ) : null}
      {onCancelar ? (
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onCancelar}>
            Cancelar
          </Button>
          <Button type="submit" loading={enviando} loadingLabel="Guardando…">
            {icono}
            {textoBoton}
          </Button>
        </DialogFooter>
      ) : (
        <Button
          type="submit"
          variant="secondary"
          className="self-start"
          loading={enviando}
          loadingLabel="Guardando…"
        >
          {icono}
          {textoBoton}
        </Button>
      )}
    </form>
  );
}

/* ---------- Editar ---------- */

function Editar({
  motivo,
  motivos,
  editar,
  onCancelar,
  onHecho,
}: {
  motivo: Motivo;
  motivos: CatalogoMotivos;
  editar: AccionesMotivos["editar"];
  onCancelar: () => void;
  onHecho: (m: Motivo) => void;
}) {
  const uid = useId();
  const idEtiqueta = `${uid}-etiqueta`;
  useEffect(() => {
    document.getElementById(idEtiqueta)?.focus();
  }, [idEtiqueta]);
  return (
    <>
      <DialogHeader>
        <DialogTitle>Editar «{motivo.etiqueta}»</DialogTitle>
        <DialogDescription>
          Los ajustes ya aplicados conservan el nombre que tenían.
        </DialogDescription>
      </DialogHeader>
      <FormOpcion
        idEtiqueta={idEtiqueta}
        motivos={motivos}
        inicial={motivo}
        excepto={motivo.id}
        textoBoton="Guardar"
        tituloError="No se guardó la opción"
        enviar={(o) => editar({ id: motivo.id, ...o })}
        onHecho={(o) => onHecho({ id: motivo.id, ...o })}
        onCancelar={onCancelar}
      />
    </>
  );
}

/* ---------- Borrar ---------- */

function Borrar({
  motivo,
  ultima,
  borrar,
  onCancelar,
  onHecho,
}: {
  motivo: Motivo;
  ultima: boolean;
  borrar: AccionesMotivos["borrar"];
  onCancelar: () => void;
  onHecho: (restantes: CatalogoMotivos) => void;
}) {
  const uid = useId();
  const idCancelar = `${uid}-cancelar`;
  const { enviando, error, enviar } = useEnvio();
  useEffect(() => {
    document.getElementById(idCancelar)?.focus();
  }, [idCancelar]);

  async function confirmar() {
    const r = await enviar(() => borrar(motivo.id));
    if (r?.ok) onHecho(r.motivos);
  }

  if (ultima) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>No se puede borrar «{motivo.etiqueta}»</DialogTitle>
          <DialogDescription>{errorMotivosTexto("ultima")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button id={idCancelar} type="button" onClick={onCancelar}>
            Entendido
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>¿Borrar «{motivo.etiqueta}»?</DialogTitle>
        <DialogDescription>
          Sale de la lista para todos los profes. Los ajustes ya aplicados con
          esta opción no cambian.
        </DialogDescription>
      </DialogHeader>
      {error ? (
        <ErrorEnPantalla titulo="No se borró la opción">
          {error}
        </ErrorEnPantalla>
      ) : null}
      <DialogFooter>
        <Button
          id={idCancelar}
          type="button"
          variant="secondary"
          onClick={onCancelar}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="danger"
          loading={enviando}
          loadingLabel="Borrando…"
          onClick={confirmar}
        >
          Borrar
        </Button>
      </DialogFooter>
    </>
  );
}
