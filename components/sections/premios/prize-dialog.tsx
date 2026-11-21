"use client";

import { Gift } from "lucide-react";
import { type ReactNode, useId, useRef, useState } from "react";
import { ErrorEnPantalla } from "@/components/estados/errores";
import { BotonEnLinea } from "@/components/krea/boton-en-linea";
import {
  ImageUpload,
  type ImageUploadFile,
  type ImageUploadStatus,
} from "@/components/krea/image-upload";
import { hayRed } from "@/components/krea/use-en-linea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import type { TipoTareaId } from "@/lib/modelo";
import {
  ayudaPremio,
  CREAR_PREMIO_LABEL,
  EDITAR_PREMIO_TITULO,
  mensajeErrorPremio,
  PREMIO_GUARDADO,
  type ResultadoPremio,
  SIN_ALMACEN_FOTO,
  SIN_TAREAS_PARA_PREMIO,
} from "@/lib/premios";
import { siNoEsDeploy } from "@/lib/recarga-deploy";
import type { TareaParaPremio } from "@/lib/tareas-profe-datos";

/** La Server Action `guardarPremio` (D266): FormData `tareaId`, `premio`, `foto`, `quitarFoto`. */
export type GuardarPremioAccion = (form: FormData) => Promise<ResultadoPremio>;

/** Tarea fija al editar (o al «Agregar premio» desde una tarjeta por definir). */
export type PremioEnEdicion = {
  tareaId: string;
  tarea: string;
  tipo: TipoTareaId;
  premio: string;
  /** URL firmada de la foto actual; `null` sin foto (o si no se pudo firmar). */
  fotoUrl: string | null;
  /** ¿Tiene foto guardada? (aunque no se haya podido firmar). */
  conFoto: boolean;
};

/** PROVISIONAL (fila 147): textos del diálogo. */
const TEXTOS = {
  crearDescripcion:
    "Elige la tarea y escribe el premio. Lo gana la mejor nota de cada sección.",
  editarDescripcion: (tarea: string) => `Premio de «${tarea}».`,
  tarea: "Tarea",
  tareaPlaceholder: "Elige una tarea",
  tareaError: "Elige la tarea que llevará el premio.",
  premio: "Premio",
  premioPlaceholder: "Ej. Cuenta Canva Pro por 3 meses",
  premioError: "Escribe el premio.",
  foto: "Foto del premio",
  opcional: "(opcional)",
  guardar: "Guardar premio",
  guardando: "Guardando…",
  errorTitulo: "No se guardó el premio",
  fotoActual: "Foto actual",
};

const tipoTexto = (t: TipoTareaId) =>
  t === "individual" ? "Individual" : "Grupal";

function opcionTarea(t: TareaParaPremio): string {
  return `${t.titulo} · ${tipoTexto(t.tipo)} · ${t.borrador ? "borrador" : t.seccion}`;
}

/**
 * Diálogo «Crear premio» / «Editar premio» (W11, D266; HANDOFF §2.13). Crear: elige una tarea sin
 * premio (grupal o individual, no cerrada) + el texto + una foto opcional. Editar: la tarea va
 * fija y la foto se mantiene, se cambia o se quita. La foto entra por `ImageUpload` (explorar,
 * arrastrar o pegar, D246) y se sube al guardar, en la misma Server Action. El contenido solo se
 * monta abierto: el formulario parte siempre de los datos vigentes. Mientras guarda, el botón
 * queda deshabilitado (y un ref evita el doble envío).
 */
export function PrizeDialog({
  trigger,
  tareas = [],
  edicion,
  fotoDisponible,
  guardar,
  abierto: abiertoControlado,
  onAbiertoChange,
}: {
  /** Botón que abre el diálogo; sin él, se controla con `abierto`. */
  trigger?: ReactNode;
  /** Tareas elegibles al crear. */
  tareas?: readonly TareaParaPremio[];
  edicion?: PremioEnEdicion;
  /** ¿Hay almacén de B2? Sin él la foto no se ofrece y se dice por qué. */
  fotoDisponible: boolean;
  guardar: GuardarPremioAccion;
  abierto?: boolean;
  onAbiertoChange?: (abierto: boolean) => void;
}) {
  const [abiertoLocal, setAbiertoLocal] = useState(false);
  const abierto = abiertoControlado ?? abiertoLocal;
  const cambiar = (v: boolean) => {
    setAbiertoLocal(v);
    onAbiertoChange?.(v);
  };
  return (
    <Dialog open={abierto} onOpenChange={cambiar}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {edicion ? EDITAR_PREMIO_TITULO : CREAR_PREMIO_LABEL}
          </DialogTitle>
          <DialogDescription>
            {edicion
              ? TEXTOS.editarDescripcion(edicion.tarea)
              : TEXTOS.crearDescripcion}
          </DialogDescription>
        </DialogHeader>
        {!edicion && tareas.length === 0 ? (
          <>
            <p className="text-body text-text-2">{SIN_TAREAS_PARA_PREMIO}</p>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cerrar
                </Button>
              </DialogClose>
            </DialogFooter>
          </>
        ) : (
          <PrizeForm
            tareas={tareas}
            edicion={edicion}
            fotoDisponible={fotoDisponible}
            guardar={guardar}
            onListo={() => cambiar(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type Foto =
  | { status: "vacia" }
  | { status: "error"; error: string }
  | { status: "lista"; file: ImageUploadFile; blob: Blob | null };

function PrizeForm({
  tareas,
  edicion,
  fotoDisponible,
  guardar,
  onListo,
}: {
  tareas: readonly TareaParaPremio[];
  edicion: PremioEnEdicion | undefined;
  fotoDisponible: boolean;
  guardar: GuardarPremioAccion;
  onListo: () => void;
}) {
  const uid = useId();
  const ids = {
    tarea: `${uid}-tarea`,
    premio: `${uid}-premio`,
  };
  const [tareaId, setTareaId] = useState(edicion?.tareaId ?? "");
  const [premio, setPremio] = useState(edicion?.premio ?? "");
  const [foto, setFoto] = useState<Foto>(() =>
    edicion?.fotoUrl
      ? {
          status: "lista",
          file: { name: TEXTOS.fotoActual, size: 0, src: edicion.fotoUrl },
          blob: null,
        }
      : { status: "vacia" },
  );
  // Había foto guardada y el profe la quitó (sin elegir otra)
  const [quitada, setQuitada] = useState(false);
  const [intentado, setIntentado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const enviando = useRef(false);

  const tipo: TipoTareaId =
    edicion?.tipo ?? tareas.find((t) => t.id === tareaId)?.tipo ?? "grupal";
  const errores = {
    tarea: tareaId ? undefined : TEXTOS.tareaError,
    premio: premio.trim() ? undefined : TEXTOS.premioError,
  };
  const ver = intentado ? errores : { tarea: undefined, premio: undefined };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hayRed()) return;
    if (enviando.current) return;
    const primero = errores.tarea
      ? ids.tarea
      : errores.premio
        ? ids.premio
        : null;
    if (primero) {
      setIntentado(true);
      document.getElementById(primero)?.focus();
      return;
    }
    const form = new FormData();
    form.set("tareaId", tareaId);
    form.set("premio", premio.trim());
    if (foto.status === "lista" && foto.blob) {
      form.set("foto", foto.blob, "foto.jpg");
    } else if (quitada && edicion?.conFoto) {
      form.set("quitarFoto", "1");
    }
    enviando.current = true;
    setGuardando(true);
    setErrorServidor(null);
    const r = await guardar(form).catch(
      siNoEsDeploy<ResultadoPremio>({ ok: false, error: "red" }),
    );
    enviando.current = false;
    setGuardando(false);
    if (r.ok) {
      toast.success(PREMIO_GUARDADO);
      onListo();
    } else setErrorServidor(mensajeErrorPremio(r.error));
  };

  const uploadStatus: ImageUploadStatus = foto.status;

  return (
    <form
      method="post"
      noValidate
      onSubmit={enviar}
      className="flex flex-col gap-4"
    >
      {edicion ? null : (
        <Field
          label={TEXTOS.tarea}
          controlId={ids.tarea}
          error={ver.tarea}
          announce={false}
        >
          <Select value={tareaId} onValueChange={setTareaId}>
            <SelectTrigger>
              <SelectValue placeholder={TEXTOS.tareaPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {tareas.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {opcionTarea(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}
      <Field
        label={TEXTOS.premio}
        controlId={ids.premio}
        help={ayudaPremio(tipo)}
        error={ver.premio}
        announce={false}
      >
        <Input
          autoComplete="off"
          maxLength={200}
          placeholder={TEXTOS.premioPlaceholder}
          leading={<Gift aria-hidden="true" />}
          value={premio}
          onChange={(e) => setPremio(e.currentTarget.value)}
        />
      </Field>
      <fieldset className="m-0 flex min-w-0 flex-col gap-1.5 border-0 p-0">
        <legend className="mb-1.5 p-0 text-label text-text">
          {TEXTOS.foto}{" "}
          <span className="font-normal text-text-2">{TEXTOS.opcional}</span>
        </legend>
        {fotoDisponible ? (
          <ImageUpload
            status={uploadStatus}
            file={foto.status === "lista" ? foto.file : undefined}
            error={foto.status === "error" ? foto.error : undefined}
            alt={premio.trim() || TEXTOS.foto}
            onSelect={(blob, meta) => {
              setFoto({
                status: "lista",
                file: { name: meta.name, size: blob.size, src: blob },
                blob,
              });
              setQuitada(false);
            }}
            onReject={(message) => setFoto({ status: "error", error: message })}
            onRemove={() => {
              setFoto({ status: "vacia" });
              setQuitada(true);
            }}
          />
        ) : (
          <p className="text-small text-text-2">{SIN_ALMACEN_FOTO}</p>
        )}
      </fieldset>
      {errorServidor ? (
        <ErrorEnPantalla titulo={TEXTOS.errorTitulo}>
          {errorServidor}
        </ErrorEnPantalla>
      ) : null}
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">
            Cancelar
          </Button>
        </DialogClose>
        <BotonEnLinea
          type="submit"
          loading={guardando}
          loadingLabel={TEXTOS.guardando}
        >
          {TEXTOS.guardar}
        </BotonEnLinea>
      </DialogFooter>
    </form>
  );
}
