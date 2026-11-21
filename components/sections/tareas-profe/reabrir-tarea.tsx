"use client";

import { CircleAlert, LockOpen } from "lucide-react";
import * as React from "react";
import { BotonEnLinea } from "@/components/krea/boton-en-linea";
import { DatePicker } from "@/components/krea/date-picker";
import { TimePicker } from "@/components/krea/time-picker";
import { hayRed } from "@/components/krea/use-en-linea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { toast } from "@/components/ui/sonner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { comparaFecha, formatFechaHora } from "@/lib/fecha";
import type { TipoTareaId } from "@/lib/modelo";
import {
  botonConfirmarReabrir,
  type ReabrirTarea as EnvioReabrir,
  type ErroresReabrir,
  marcadosTexto,
  PRORROGA_HASTA,
  REABRIR_BOTON,
  REABRIR_DESCRIPCION,
  REABRIR_LEYENDA_FECHA,
  REABRIR_PARA_ALGUNOS,
  REABRIR_PARA_TODOS,
  REABRIR_TITULO,
  reabrirAyuda,
  reabrirListaTitulo,
  type TitularReabrir,
  toastReabrir,
  validarReabrir,
  YA_ENTREGO,
} from "@/lib/reabrir-tarea";
import { relanzarSiEsDeploy } from "@/lib/recarga-deploy";
import { fechaCampo, HORA_AYUDA, mensajeErrorTarea } from "@/lib/tareas-profe";
import type { ResultadoTarea } from "@/lib/tareas-profe-datos";

type Para = EnvioReabrir["para"];

/** La prórroga vigente más tardía: con ella arranca la fecha del diálogo. */
function ultimaProrroga(titulares: readonly TitularReabrir[]) {
  let ultima: TitularReabrir["prorroga"] = null;
  for (const t of titulares) {
    const p = t.prorroga;
    if (!p) continue;
    if (
      !ultima ||
      comparaFecha(p.fecha, ultima.fecha) > 0 ||
      (p.fecha === ultima.fecha && (p.hora ?? "99") > (ultima.hora ?? "99"))
    )
      ultima = p;
  }
  return ultima;
}

/*
 * «Reabrir tarea» (D455, D456): botón secundario y un diálogo para volver a recibir entregas de
 * una tarea cerrada (vencida o cerrada a mano). «Para todos» pide fecha y hora nuevas; «Para
 * algunos» además una lista de casillas con los alumnos (individual) o equipos (grupal) de sus
 * secciones, agrupada por sección: los que ya tienen prórroga vigente salen marcados y
 * desmarcarlos se la quita. Cada casilla se nombra con el alumno o el equipo; «Ya entregó» y la
 * prórroga van por `aria-describedby`. Valida al pulsar (el reloj se lee en el clic, no al pintar)
 * y lleva el foco al primer campo inválido. El servidor vuelve a validar todo y su `refresh()` pone
 * la página al día. Copy PROVISIONAL (CONTENT_CHECKLIST filas 259–262).
 */
export function ReabrirTarea({
  tareaId,
  tipo,
  actualizadoEn,
  hoy,
  titulares,
  reabrir,
}: {
  tareaId: string;
  tipo: TipoTareaId;
  /** El de la tarea que se ve: si otro profe la cambia, el servidor responde `cambio`. */
  actualizadoEn: number;
  /** Día civil ISO de Caracas: una fecha anterior no se puede elegir. */
  hoy: string;
  titulares: readonly TitularReabrir[];
  reabrir: (envio: EnvioReabrir) => Promise<ResultadoTarea>;
}) {
  const id = React.useId();
  const contenido = React.useRef<HTMLDivElement>(null);
  const boton = React.useRef<HTMLButtonElement>(null);
  const conProrrogas = titulares.some((t) => t.prorroga !== null);
  const inicial = React.useCallback(() => {
    const ultima = ultimaProrroga(titulares);
    return {
      para: (conProrrogas ? "algunos" : "todos") as Para,
      fecha: ultima ? fechaCampo(ultima.fecha) : "",
      hora: ultima?.hora ?? "",
      marcados: new Set(
        titulares.filter((t) => t.prorroga !== null).map((t) => t.id),
      ),
    };
  }, [titulares, conProrrogas]);
  const [abierto, setAbierto] = React.useState(false);
  const [campos, setCampos] = React.useState(inicial);
  const [errores, setErrores] = React.useState<ErroresReabrir>({});
  const [pendiente, startTransition] = React.useTransition();

  const { para, marcados } = campos;
  const quitaTodas = para === "algunos" && marcados.size === 0;
  const secciones = [...new Set(titulares.map((t) => t.seccion))];
  const errorListaId = `${id}-lista-error`;

  const abrir = () => {
    setCampos(inicial());
    setErrores({});
    setAbierto(true);
  };

  const marcar = (titular: string, si: boolean) =>
    setCampos((c) => {
      const m = new Set(c.marcados);
      if (si) m.add(titular);
      else m.delete(titular);
      return { ...c, marcados: m };
    });

  const enfocarInvalido = () =>
    requestAnimationFrame(() => {
      const raiz = contenido.current;
      const campo =
        raiz?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
        raiz?.querySelector<HTMLElement>('[role="checkbox"]');
      campo?.focus();
    });

  const confirmar = () => {
    if (pendiente) return;
    const v = validarReabrir(
      {
        para,
        tipo,
        fecha: campos.fecha,
        hora: campos.hora,
        marcados: [...marcados],
        conProrrogas,
      },
      hoy,
      Date.now(),
    );
    if (!v.ok) {
      setErrores(v.errores);
      enfocarInvalido();
      return;
    }
    setErrores({});
    const envio: EnvioReabrir = {
      id: tareaId,
      actualizadoEn,
      para,
      fecha: v.fecha,
      hora: v.hora,
      titulares: para === "algunos" ? [...marcados] : [],
    };
    startTransition(async () => {
      let r: ResultadoTarea;
      try {
        r = await reabrir(envio);
      } catch (fallo) {
        relanzarSiEsDeploy(fallo);
        r = { ok: false, error: "red" };
      }
      if (r.ok) {
        toast.success(toastReabrir(para, quitaTodas));
        setAbierto(false);
        return;
      }
      toast.error(mensajeErrorTarea(r.error));
      // La vista estaba vieja: el `refresh()` del servidor ya la trae, el diálogo se cierra
      if (r.error === "cambio" || r.error === "no-existe") setAbierto(false);
    });
  };

  const detalle = (t: TitularReabrir) =>
    [
      t.entrego ? YA_ENTREGO : null,
      t.prorroga
        ? `${PRORROGA_HASTA} ${formatFechaHora(t.prorroga.fecha, t.prorroga.hora)}`
        : null,
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <>
      <Button
        ref={boton}
        type="button"
        variant="secondary"
        size="sm"
        aria-haspopup="dialog"
        onClick={abrir}
      >
        <LockOpen aria-hidden="true" />
        {REABRIR_BOTON}
      </Button>
      <Dialog
        open={abierto}
        onOpenChange={(o) => {
          if (!pendiente) setAbierto(o);
        }}
      >
        <DialogContent
          ref={contenido}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            // Reabierta para todos, el botón ya no está: el foco va al título de la página
            if (boton.current?.isConnected) boton.current.focus();
            else {
              const h1 = document.querySelector<HTMLElement>("main h1");
              if (h1 && !h1.hasAttribute("tabindex")) h1.tabIndex = -1;
              h1?.focus();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{REABRIR_TITULO}</DialogTitle>
            <DialogDescription>{REABRIR_DESCRIPCION}</DialogDescription>
          </DialogHeader>
          <form
            method="post"
            className="flex min-w-0 flex-col gap-4"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (!hayRed()) return;
              confirmar();
            }}
          >
            <div className="flex flex-col gap-1.5">
              <ToggleGroup
                block
                aria-label="Para quién"
                value={para}
                onValueChange={(v) => {
                  if (v === "todos" || v === "algunos")
                    setCampos((c) => ({ ...c, para: v }));
                }}
              >
                <ToggleGroupItem value="todos">
                  {REABRIR_PARA_TODOS}
                </ToggleGroupItem>
                <ToggleGroupItem value="algunos">
                  {REABRIR_PARA_ALGUNOS}
                </ToggleGroupItem>
              </ToggleGroup>
              <p className="text-small text-text-2">
                {reabrirAyuda(para, tipo)}
              </p>
            </div>

            {/* Fecha y hora juntas como en el constructor (D352): la hora debajo en móvil */}
            <fieldset className="m-0 min-w-0 border-0 p-0">
              <legend className="mb-1.5 text-label text-text">
                {REABRIR_LEYENDA_FECHA}
              </legend>
              <div className="g2 gap-4">
                <Field label="Fecha" error={errores.fecha} announce={false}>
                  <DatePicker
                    hoy={hoy}
                    readOnly={quitaTodas}
                    value={campos.fecha}
                    onValueChange={(fecha) =>
                      setCampos((c) => ({ ...c, fecha }))
                    }
                  />
                </Field>
                <Field
                  label={
                    <>
                      Hora{" "}
                      <span className="font-normal text-text-2">
                        (opcional)
                      </span>
                    </>
                  }
                  help={HORA_AYUDA}
                  error={errores.hora}
                  announce={false}
                >
                  <TimePicker
                    readOnly={quitaTodas}
                    value={campos.hora}
                    onValueChange={(hora) => setCampos((c) => ({ ...c, hora }))}
                  />
                </Field>
              </div>
            </fieldset>

            {para === "algunos" ? (
              <fieldset
                className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0"
                aria-describedby={errores.titulares ? errorListaId : undefined}
              >
                <legend className="mb-1.5 text-label text-text">
                  {reabrirListaTitulo(tipo)}{" "}
                  <span className="nums font-normal text-text-2">
                    · {marcadosTexto(marcados.size)}
                  </span>
                </legend>
                {errores.titulares ? (
                  <p
                    id={errorListaId}
                    role="alert"
                    className="flex items-start gap-1.5 text-small text-error"
                  >
                    <CircleAlert
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0"
                    />
                    {errores.titulares}
                  </p>
                ) : null}
                {secciones.map((s) => {
                  const tituloId = `${id}-seccion-${s}`;
                  return (
                    // biome-ignore lint/a11y/useSemanticElements: un fieldset anidado repetiría la leyenda de la lista en cada casilla
                    <div
                      key={s}
                      role="group"
                      aria-labelledby={tituloId}
                      className="flex min-w-0 flex-col gap-1 rounded-md border border-divider p-3"
                    >
                      <p id={tituloId} className="text-small-b text-text">
                        Sección {s}
                      </p>
                      <ul className="m-0 flex list-none flex-col p-0">
                        {titulares
                          .filter((t) => t.seccion === s)
                          .map((t) => {
                            const casilla = `${id}-t-${t.id}`;
                            const texto = detalle(t);
                            return (
                              <li
                                key={t.id}
                                className="flex min-h-11 items-center gap-3 py-1"
                              >
                                <Checkbox
                                  id={casilla}
                                  checked={marcados.has(t.id)}
                                  aria-describedby={
                                    texto ? `${casilla}-detalle` : undefined
                                  }
                                  onCheckedChange={(c) =>
                                    marcar(t.id, c === true)
                                  }
                                />
                                <div className="flex min-w-0 flex-col">
                                  <label
                                    htmlFor={casilla}
                                    className="cursor-pointer break-words text-body text-text"
                                  >
                                    {t.nombre}
                                  </label>
                                  {texto ? (
                                    <span
                                      id={`${casilla}-detalle`}
                                      className="nums text-small text-text-2"
                                    >
                                      {texto}
                                    </span>
                                  ) : null}
                                </div>
                              </li>
                            );
                          })}
                      </ul>
                    </div>
                  );
                })}
              </fieldset>
            ) : null}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={pendiente}>
                  Cancelar
                </Button>
              </DialogClose>
              <BotonEnLinea
                type="submit"
                loading={pendiente}
                loadingLabel="Guardando…"
              >
                <LockOpen aria-hidden="true" />
                {botonConfirmarReabrir(para, quitaTodas)}
              </BotonEnLinea>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
