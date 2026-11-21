"use client";

import {
  Gift,
  Lock,
  Plus,
  Save,
  Send,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { BotonEnLinea } from "@/components/krea/boton-en-linea";
import { DatePicker } from "@/components/krea/date-picker";
import { SumMeter } from "@/components/krea/sum-meter";
import { TimePicker } from "@/components/krea/time-picker";
import { TopBarAccion } from "@/components/layout/top-bar-accion";
import { ActionBar } from "@/components/sections/shared/action-bar";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DESHACER_MS } from "@/lib/evaluar";
import { hora24DeInstante } from "@/lib/fecha";
import { METER_TEXT_CLASSES, SUM_STATE_TONE, sumMeterInfo } from "@/lib/meters";
import type { SeccionId } from "@/lib/modelo";
import {
  claveTarea,
  PENDIENTE_TAREA,
  PENDIENTE_TITULO,
  SIN_ESPACIO_TAREA,
  TOAST_ENCOLADA_TAREA,
} from "@/lib/offline/cola";
import {
  alDrenar,
  drenarCola,
  encolarOp,
  useOpCola,
} from "@/lib/offline/navegador";
import { ayudaPremio } from "@/lib/premios";
import { relanzarSiEsDeploy } from "@/lib/recarga-deploy";
import {
  type AccionTarea,
  AVISO_CERRADA,
  AVISO_CON_ENTREGAS,
  borradorReducer,
  CERRAR_DESCRIPCION,
  CERRAR_TITULO,
  crearBorrador,
  type DatosBorrador,
  ELIMINAR_TAREA_BOTON,
  type ErroresTarea,
  eliminarTareaDescripcion,
  eliminarTareaTitulo,
  FECHA_HORA_LEYENDA,
  HORA_AYUDA,
  MAX_PREGUNTAS,
  MAX_PREGUNTAS_TEXTO,
  MIN_PREGUNTAS,
  type ModoConstructor,
  mensajeErrorTarea,
  motivoSuma,
  NOTA_PUBLICADA,
  type PerdidaEliminar,
  preguntasTitulo,
  rutaTarea,
  sumaValores,
  TOAST_BORRADOR,
  TOAST_CERRADA,
  TOAST_ELIMINADA,
  TOAST_GUARDADA,
  TOAST_PUBLICADA,
  TOAST_TAREA_ELIMINADA,
  tareaAGuardar,
  tieneErrores,
  validarBorrador,
  validarTarea,
} from "@/lib/tareas-profe";
import type { ResultadoTarea } from "@/lib/tareas-profe-datos";
import { cn } from "@/lib/utils";
import { preguntaDomId, QuestionEditor } from "./question-editor";
import { TaskSections } from "./task-sections";

const SIN_ERRORES: ErroresTarea = { preguntas: {} };
const AGREGAR_ID = "agregar-pregunta";

/** Server Actions de la página real (W6); sin ellas (galerías) solo hay toasts. */
export type AccionesTarea = {
  guardar: (envio: {
    id: string | null;
    accion: AccionTarea;
    tarea: ReturnType<typeof tareaAGuardar>;
    /** Id del intento (D293): la cola sin conexión reintenta con el mismo. */
    opId?: string;
  }) => Promise<ResultadoTarea>;
  cerrar: (id: string) => Promise<ResultadoTarea>;
  /** Elimina la tarea con sus entregas y notas (D242). */
  eliminar?: (id: string) => Promise<ResultadoTarea>;
};

/*
 * Constructor de tareas (HANDOFF §3; lienzos Constructor y Constructor-movil; D114–D117).
 * `g-side`: Datos + Preguntas a la izquierda; ≥ 1024 la columna de 360 sticky con la tarjeta
 * "Suma de valores", "Publicar tarea" (deshabilitado si la suma ≠ 20, con el motivo por
 * `aria-describedby`), "Guardar borrador" y la nota. < 1024 el medidor va sticky arriba y
 * "Publicar" en la `ActionBar`; cada corte oculta el otro con `display: none`, así hay una sola
 * región viva activa (la del `SumMeter`). Con la suma en 20, "Publicar" valida el resto al pulsar
 * (título, fecha, enunciados y valores) y lleva el foco al primer campo inválido (D071, D114).
 * Eliminar una pregunta no pide confirmación: toast "Pregunta eliminada" + "Deshacer" (§3).
 * Con `acciones` (página real, W6) guarda en Firestore; en la vista previa solo avisa con un toast.
 * `modo` (D200): un borrador se guarda o se publica; una publicada se guarda («Guardar cambios»)
 * y se cierra (con confirmación); con entregas solo cambian título, fecha y premio; cerrada, nada.
 * Una tarea ya guardada se puede eliminar en cualquier modo (D243): confirmación con lo que se
 * pierde, toast y vuelta a la lista.
 */
export function TaskBuilder({
  inicial,
  secciones,
  hoy,
  listaHref,
  guardarEnTopbar = false,
  tareaId = null,
  modo = "borrador",
  fechaGuardada = null,
  horaGuardada = null,
  acciones,
  perdida,
}: {
  inicial: DatosBorrador;
  /** Secciones del catálogo para las casillas (D324); las de `inicial.secciones` salen marcadas. */
  secciones: readonly SeccionId[];
  /** Día civil ISO: una fecha de entrega anterior no se puede publicar. */
  hoy: string;
  /** A dónde vuelve al publicar. */
  listaHref: string;
  /**
   * Página real (D152): "Guardar borrador" < 1024 va en la topbar del shell (`TopBarAccion`, D130)
   * en vez de en el flujo. En `/secciones` (sin topbar) se queda en el flujo.
   */
  guardarEnTopbar?: boolean;
  /** Id en Firestore; `null` = tarea nueva (lo pone el primer «Guardar borrador»). */
  tareaId?: string | null;
  modo?: ModoConstructor;
  /** Fecha ISO ya guardada de una publicada: se puede conservar aunque haya pasado (D200). */
  fechaGuardada?: string | null;
  /** Hora "HH:MM" ya guardada con esa fecha: también se conserva aunque haya pasado (D354). */
  horaGuardada?: string | null;
  acciones?: AccionesTarea;
  /** Lo que se pierde al eliminarla (el texto de la confirmación, D243). */
  perdida?: PerdidaEliminar;
}) {
  const router = useRouter();
  const raiz = React.useRef<HTMLDivElement>(null);
  const [tarea, dispatch] = React.useReducer(
    borradorReducer,
    inicial,
    crearBorrador,
  );
  const [intentado, setIntentado] = React.useState(false);
  const [intentoBorrador, setIntentoBorrador] = React.useState(false);
  const [id, setId] = React.useState(tareaId);
  const [pendiente, startTransition] = React.useTransition();
  const [confirmarCierre, setConfirmarCierre] = React.useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = React.useState(false);
  // Hora de Caracas del último «Publicar»: la de entrega de hoy no puede haber pasado (D354). Se
  // toma al pulsar (no al pintar: el render queda puro y sin desfase con el servidor)
  const [horaActual, setHoraActual] = React.useState<string | null>(null);
  const esBorrador = modo === "borrador";
  const estructuraFija = modo === "con-entregas" || modo === "cerrada";
  const cerrada = modo === "cerrada";
  // Con entregas, el límite de imágenes guardado solo puede subir (D373)
  const limiteGuardado = React.useMemo(
    () =>
      new Map((inicial.preguntas ?? []).map((p) => [p.id, p.maxImagenes ?? 1])),
    [inicial.preguntas],
  );
  // Id del elemento que recibe el foco tras el próximo render (añadir, eliminar, deshacer)
  const foco = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!foco.current) return;
    document.getElementById(foco.current)?.focus();
    foco.current = null;
  });

  const suma = sumaValores(tarea.preguntas);
  const info = sumMeterInfo(suma);
  const motivo = motivoSuma(suma);
  // El reloj propio (D361) no deja horas a medias: no hace falta mirar `validity.badInput`
  const errores = intentado
    ? validarTarea(tarea, hoy, fechaGuardada, horaActual, horaGuardada)
    : intentoBorrador
      ? validarBorrador(tarea)
      : SIN_ERRORES;
  const lleno = tarea.preguntas.length >= MAX_PREGUNTAS;
  const textoPublicar = esBorrador ? "Publicar tarea" : "Guardar cambios";
  const textoPublicando = esBorrador ? "Publicando…" : "Guardando…";
  const IconoPublicar = esBorrador ? Send : Save;
  const ids = {
    tipo: React.useId(),
    datos: React.useId(),
    preguntas: React.useId(),
    motivo: React.useId(),
    motivoMovil: React.useId(),
    max: React.useId(),
  };

  const agregar = () => {
    if (lleno) return;
    foco.current = preguntaDomId(`q${tarea.siguiente}`).enunciado;
    dispatch({ tipo: "agregar" });
  };

  const eliminar = (indice: number) => {
    const pregunta = tarea.preguntas[indice];
    if (!pregunta || tarea.preguntas.length <= MIN_PREGUNTAS) return;
    // Foco a la pregunta que ocupa su lugar; si era la última, a "Agregar pregunta"
    const siguiente = tarea.preguntas[indice + 1];
    foco.current = siguiente
      ? preguntaDomId(siguiente.id).enunciado
      : AGREGAR_ID;
    dispatch({ tipo: "eliminar", id: pregunta.id });
    toast(TOAST_ELIMINADA, {
      duration: DESHACER_MS,
      action: {
        label: "Deshacer",
        onClick: () => {
          foco.current = preguntaDomId(pregunta.id).enunciado;
          dispatch({ tipo: "restaurar", pregunta, indice });
        },
      },
    });
  };

  const enfocarInvalido = () =>
    // Un cuadro para que React pinte `aria-invalid`
    requestAnimationFrame(() => {
      raiz.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
    });

  // Cola sin conexión (D292): guardar y publicar se encolan si no hay red; cerrar, no
  // Clave de esta tarea nueva en la cola: un uuid por constructor abierto, creado en el cliente
  // (en el prerender no se puede, `cacheComponents`)
  const [local, setLocal] = React.useState("");
  React.useEffect(() => setLocal(crypto.randomUUID()), []);
  const claveCola = claveTarea(id, local);
  const enCola = useOpCola(claveCola);
  const enEspera = enCola?.estado === "pendiente";

  // Una tarea nueva que entró desde la cola toma su id: el próximo guardado la actualiza
  React.useEffect(
    () =>
      alDrenar((d) => {
        const h = d.hechas.find((x) => x.op.clave === claveCola);
        if (!h?.id || id !== null) return;
        setId(h.id);
        window.history.replaceState(null, "", rutaTarea(h.id));
      }),
    [claveCola, id],
  );

  /**
   * Llama a la acción; con error, toast y (si la tarea cambió por fuera) recarga. Con `envio`
   * (guardar o publicar): sin red, o si la red se cae a medio camino, queda en la cola con el
   * mismo `opId` y se envía sola al volver (D292, D293).
   */
  const enviar = (
    llamar: (opId: string) => Promise<ResultadoTarea>,
    alGuardar: (r: { id: string }) => void,
    envio?: Parameters<AccionesTarea["guardar"]>[0],
  ) =>
    startTransition(async () => {
      const opId = crypto.randomUUID();
      let r: ResultadoTarea = { ok: false, error: "red" };
      if (!envio || navigator.onLine) {
        try {
          r = await llamar(opId);
        } catch (fallo) {
          relanzarSiEsDeploy(fallo);
          r = { ok: false, error: "red" };
        }
      }
      if (r.ok) {
        alGuardar(r);
        return;
      }
      if (envio && r.error === "red") {
        const e = await encolarOp({
          tipo: "tarea",
          opId,
          clave: claveCola,
          titulo: envio.tarea.titulo.trim() || "Sin título",
          envio,
        });
        if (e === "ok") {
          toast(TOAST_ENCOLADA_TAREA);
          void drenarCola();
          return;
        }
        if (e === "sin-espacio") {
          toast.error(SIN_ESPACIO_TAREA);
          return;
        }
      }
      toast.error(mensajeErrorTarea(r.error));
      if (r.error === "cerrada" || r.error === "no-existe") router.refresh();
    });

  const publicar = () => {
    if (motivo || pendiente || cerrada) return;
    // Ya hay un guardado en la cola: otro a la vez podría crear la tarea dos veces
    if (enEspera) {
      toast(PENDIENTE_TAREA);
      return;
    }
    setIntentado(true);
    const ahora = hora24DeInstante(Date.now());
    setHoraActual(ahora);
    if (
      tieneErrores(validarTarea(tarea, hoy, fechaGuardada, ahora, horaGuardada))
    ) {
      enfocarInvalido();
      return;
    }
    const exito = esBorrador ? TOAST_PUBLICADA : TOAST_GUARDADA;
    if (!acciones) {
      toast.success(exito);
      router.push(listaHref);
      return;
    }
    const envio = {
      id,
      accion: esBorrador ? ("publicar" as const) : ("guardar" as const),
      tarea: tareaAGuardar(tarea),
    };
    enviar(
      (opId) => acciones.guardar({ ...envio, opId }),
      () => {
        toast.success(exito);
        router.push(listaHref);
      },
      envio,
    );
  };

  // Un borrador solo necesita el título (D199)
  const guardar = () => {
    if (pendiente) return;
    if (enEspera) {
      toast(PENDIENTE_TAREA);
      return;
    }
    setIntentoBorrador(true);
    if (tieneErrores(validarBorrador(tarea))) {
      enfocarInvalido();
      return;
    }
    if (!acciones) {
      toast.success(TOAST_BORRADOR);
      return;
    }
    const envio = {
      id,
      accion: "borrador" as const,
      tarea: tareaAGuardar(tarea),
    };
    enviar(
      (opId) => acciones.guardar({ ...envio, opId }),
      (r) => {
        toast.success(TOAST_BORRADOR);
        // Tarea nueva: la URL pasa a la suya sin volver a montar el constructor (el foco se
        // queda donde estaba) y el próximo guardado actualiza la misma tarea
        if (id === null) {
          setId(r.id);
          window.history.replaceState(null, "", rutaTarea(r.id));
        }
      },
      envio,
    );
  };

  const cerrarTarea = () => {
    if (pendiente) return;
    const listo = () => {
      setConfirmarCierre(false);
      toast.success(TOAST_CERRADA);
      router.push(listaHref);
    };
    if (!acciones || id === null) {
      listo();
      return;
    }
    enviar(() => acciones.cerrar(id), listo);
  };

  const notaPublicar = cerrada ? null : (
    // Copy del lienzo (borrador); provisional en una publicada (fila 131). En la cola sin
    // conexión, «Pendiente de enviar» (fila 156), anunciado al aparecer.
    <output
      aria-live="polite"
      className="block text-center text-small text-text-2"
    >
      {enEspera ? (
        <>
          <span className="text-small-b text-text">{PENDIENTE_TITULO}:</span>{" "}
          {PENDIENTE_TAREA}
        </>
      ) : esBorrador ? (
        "Al publicar, las secciones elegidas la ven en «Por entregar»."
      ) : (
        NOTA_PUBLICADA
      )}
    </output>
  );

  const botonGuardarBorrador = (enTopbar: boolean) => (
    <Button
      type="button"
      variant={enTopbar ? "ghost" : "secondary"}
      size={enTopbar ? "sm" : undefined}
      block={!enTopbar}
      // En la topbar, con texto grande el rótulo se parte en dos líneas en vez de salirse (D227)
      className={
        enTopbar
          ? "h-auto min-h-9 max-w-full shrink py-1 text-center whitespace-normal max-lg:h-auto max-lg:min-h-11"
          : undefined
      }
      // Sin `disabled` mientras guarda: el foco se queda en el botón (`guardar` ignora el 2.º toque)
      aria-busy={pendiente || undefined}
      onClick={guardar}
    >
      Guardar borrador
    </Button>
  );

  // Cerrar (solo una publicada abierta): un solo diálogo para los dos botones (< 1024 y ≥ 1024);
  // al cerrarse, el foco vuelve al botón que lo abrió (cerrar no se deshace, D202)
  const abrioCierre = React.useRef<HTMLButtonElement | null>(null);
  const botonCerrar = (
    <Button
      type="button"
      variant="secondary"
      block
      disabled={pendiente}
      aria-haspopup="dialog"
      onClick={(e) => {
        abrioCierre.current = e.currentTarget;
        setConfirmarCierre(true);
      }}
    >
      <Lock aria-hidden="true" />
      Cerrar tarea
    </Button>
  );
  const dialogoCerrar = (
    <Dialog
      open={confirmarCierre}
      onOpenChange={(o) => {
        if (!pendiente) setConfirmarCierre(o);
      }}
    >
      <DialogContent
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          abrioCierre.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>{CERRAR_TITULO}</DialogTitle>
          <DialogDescription>{CERRAR_DESCRIPCION}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" disabled={pendiente}>
              Cancelar
            </Button>
          </DialogClose>
          <BotonEnLinea
            onClick={cerrarTarea}
            loading={pendiente}
            loadingLabel="Cerrando…"
          >
            <Lock aria-hidden="true" />
            Cerrar tarea
          </BotonEnLinea>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Eliminar (una tarea ya guardada, cualquier modo; D243): un diálogo para los dos esquivel. Al
  // cancelar, el foco vuelve al botón; al eliminar, la página cambia a la lista.
  const eliminarTarea = acciones?.eliminar;
  const abrioEliminar = React.useRef<HTMLButtonElement | null>(null);
  const eliminarConfirmado = () => {
    if (pendiente || !eliminarTarea || id === null) return;
    const listo = () => {
      setConfirmarEliminar(false);
      toast.success(TOAST_TAREA_ELIMINADA);
      router.push(listaHref);
    };
    enviar(async () => {
      const r = await eliminarTarea(id);
      // Ya no existe (otro profe la borró): para quien mira, el resultado es el mismo
      return !r.ok && r.error === "no-existe" ? { ok: true, id } : r;
    }, listo);
  };
  const botonEliminar =
    eliminarTarea && id !== null ? (
      <Button
        type="button"
        variant="ghost-danger"
        block
        disabled={pendiente}
        aria-haspopup="dialog"
        onClick={(e) => {
          abrioEliminar.current = e.currentTarget;
          setConfirmarEliminar(true);
        }}
      >
        <Trash2 aria-hidden="true" />
        {ELIMINAR_TAREA_BOTON}
      </Button>
    ) : null;
  const dialogoEliminar = botonEliminar ? (
    <Dialog
      open={confirmarEliminar}
      onOpenChange={(o) => {
        if (!pendiente) setConfirmarEliminar(o);
      }}
    >
      <DialogContent
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          if (abrioEliminar.current?.isConnected) abrioEliminar.current.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {eliminarTareaTitulo(
              tarea.titulo.trim() || inicial.titulo || "esta tarea",
            )}
          </DialogTitle>
          <DialogDescription>
            {eliminarTareaDescripcion(perdida)}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" disabled={pendiente}>
              Cancelar
            </Button>
          </DialogClose>
          <BotonEnLinea
            variant="danger"
            onClick={eliminarConfirmado}
            loading={pendiente}
            loadingLabel="Eliminando…"
          >
            <Trash2 aria-hidden="true" />
            {ELIMINAR_TAREA_BOTON}
          </BotonEnLinea>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ) : null;

  const aviso =
    modo === "con-entregas"
      ? AVISO_CON_ENTREGAS
      : cerrada
        ? AVISO_CERRADA
        : null;

  return (
    <div ref={raiz} data-slot="task-builder" className="page-stack">
      {/* < 1024: medidor sticky a 64 bajo la topbar (`.sticky-top` del lienzo) */}
      <SumMeter
        sum={suma}
        variant="bar"
        className="sticky top-16 z-sticky bajo:static lg:hidden"
      />

      {aviso ? <Alert variant="info">{aviso}</Alert> : null}

      <div className="g-side">
        <div className="flex flex-col gap-6">
          <section aria-labelledby={ids.datos}>
            <Card className="flex flex-col gap-4">
              <h2 id={ids.datos} className="text-h3 text-text">
                Datos
              </h2>
              <Field label="Título" error={errores.titulo} announce={false}>
                <Input
                  autoComplete="off"
                  readOnly={cerrada}
                  value={tarea.titulo}
                  onChange={(e) =>
                    dispatch({ tipo: "titulo", valor: e.currentTarget.value })
                  }
                />
              </Field>
              <div className="g2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span id={ids.tipo} className="text-label text-text">
                    Tipo
                  </span>
                  <ToggleGroup
                    block
                    aria-labelledby={ids.tipo}
                    disabled={estructuraFija}
                    value={tarea.tipo}
                    onValueChange={(v) =>
                      dispatch({
                        tipo: "tipo",
                        valor: v === "grupal" ? "grupal" : "individual",
                      })
                    }
                  >
                    <ToggleGroupItem value="individual">
                      <User aria-hidden="true" />
                      Individual
                    </ToggleGroupItem>
                    <ToggleGroupItem value="grupal">
                      <Users aria-hidden="true" />
                      Grupal
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                {/* Grupal o individual (D263): lo gana la mejor nota de cada sección */}
                <Field
                  label={
                    <>
                      Premio{" "}
                      <span className="font-normal text-text-2">
                        (opcional)
                      </span>
                    </>
                  }
                  help={ayudaPremio(tarea.tipo)}
                >
                  <Input
                    autoComplete="off"
                    placeholder="Ej. Cuenta Canva Pro por 3 meses"
                    readOnly={cerrada}
                    leading={<Gift aria-hidden="true" />}
                    value={tarea.premio}
                    onChange={(e) =>
                      dispatch({
                        tipo: "premio",
                        valor: e.currentTarget.value,
                      })
                    }
                  />
                </Field>
              </div>
              {/* Fecha y hora juntas (D352): lado a lado ≥ 768, la hora debajo en móvil */}
              <fieldset className="m-0 min-w-0 border-0 p-0">
                <legend className="mb-1.5 text-label text-text">
                  {FECHA_HORA_LEYENDA}
                </legend>
                <div className="g2 gap-4">
                  <Field label="Fecha" error={errores.fecha} announce={false}>
                    {/* Campo escribible + calendario propio (D283, reemplaza en parte D116) */}
                    <DatePicker
                      readOnly={cerrada}
                      hoy={hoy}
                      fechaGuardada={fechaGuardada}
                      value={tarea.fecha}
                      onValueChange={(valor) =>
                        dispatch({ tipo: "fecha", valor })
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
                    {/* Reloj propio (D361; antes el `type="time"` nativo de D353) */}
                    <TimePicker
                      readOnly={cerrada}
                      value={tarea.hora}
                      onValueChange={(valor) =>
                        dispatch({ tipo: "hora", valor })
                      }
                    />
                  </Field>
                </div>
              </fieldset>
              {/* Casillas por sección del catálogo, agrupadas por año (D324, D356): fila propia */}
              <TaskSections
                secciones={secciones}
                elegidas={tarea.secciones}
                disabled={estructuraFija}
                error={errores.secciones}
                onCambio={(codigo, marcada) =>
                  dispatch({ tipo: "seccion", codigo, marcada })
                }
              />
            </Card>
          </section>

          <section
            aria-labelledby={ids.preguntas}
            className="flex flex-col gap-4"
          >
            <h2 id={ids.preguntas} className="text-h2 text-text">
              {preguntasTitulo(tarea.preguntas.length)}
            </h2>
            <ol className="flex flex-col gap-6">
              {tarea.preguntas.map((p, i) => (
                <QuestionEditor
                  key={p.id}
                  pregunta={p}
                  numero={i + 1}
                  errores={errores.preguntas[p.id]}
                  puedeEliminar={tarea.preguntas.length > MIN_PREGUNTAS}
                  bloqueada={estructuraFija}
                  ampliarDesde={
                    modo === "con-entregas"
                      ? (limiteGuardado.get(p.id) ?? 1)
                      : undefined
                  }
                  onCambio={(cambios) =>
                    dispatch({ tipo: "editar", id: p.id, cambios })
                  }
                  onEliminar={() => eliminar(i)}
                />
              ))}
            </ol>
            {estructuraFija ? null : (
              <div className="flex flex-col gap-1.5">
                {/* Zona punteada `.drop` en `--accent-ink` (lienzo) */}
                <button
                  id={AGREGAR_ID}
                  type="button"
                  disabled={lleno}
                  aria-describedby={lleno ? ids.max : undefined}
                  onClick={agregar}
                  className={cn(
                    "flex min-h-11 w-full cursor-pointer items-center justify-center gap-3 rounded-md border-2 border-dashed border-accent-ink p-4 text-button text-accent-ink",
                    "transition-colors duration-fast ease-krea hover:not-disabled:bg-accent-soft",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                    "disabled:cursor-not-allowed disabled:border-input disabled:text-text-dis",
                    "[&_svg]:size-5 [&_svg]:shrink-0",
                  )}
                >
                  <Plus aria-hidden="true" />
                  Agregar pregunta
                </button>
                {lleno ? (
                  <p id={ids.max} className="text-small text-text-2">
                    {MAX_PREGUNTAS_TEXTO}
                  </p>
                ) : null}
              </div>
            )}
          </section>

          {/* < 1024: "Guardar borrador" en la topbar (página real) o en el flujo (vista previa);
              en una publicada, "Cerrar tarea" en el flujo */}
          {cerrada ? null : (
            <div className="flex flex-col gap-2 lg:hidden">
              {!esBorrador ? (
                botonCerrar
              ) : guardarEnTopbar ? (
                <TopBarAccion>{botonGuardarBorrador(true)}</TopBarAccion>
              ) : (
                botonGuardarBorrador(false)
              )}
              {notaPublicar}
            </div>
          )}
          {botonEliminar ? (
            <div className="lg:hidden">{botonEliminar}</div>
          ) : null}
        </div>

        {/* ≥ 1024: columna de 360 sticky a 24 */}
        <div className="sticky top-6 flex flex-col gap-6 max-lg:hidden">
          <SumMeter sum={suma} variant="card" headingLevel={2} />
          {cerrada ? null : (
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                size="lg"
                block
                disabled={motivo !== null}
                loading={pendiente}
                loadingLabel={textoPublicando}
                aria-describedby={motivo ? ids.motivo : undefined}
                onClick={publicar}
              >
                <IconoPublicar aria-hidden="true" />
                {textoPublicar}
              </Button>
              {motivo ? (
                <p id={ids.motivo} className="sr-only">
                  {motivo}
                </p>
              ) : null}
              {esBorrador ? botonGuardarBorrador(false) : botonCerrar}
              {notaPublicar}
            </div>
          )}
          {botonEliminar}
        </div>
      </div>

      {/* < 1024: barra de acción (§8 pide `bottom: 0` sin barra inferior: pendiente de la fase 05) */}
      {cerrada ? null : (
        <ActionBar className="lg:hidden">
          <p
            id={ids.motivoMovil}
            className={cn(
              "min-w-0 flex-1 text-small-b",
              METER_TEXT_CLASSES[SUM_STATE_TONE[info.state]],
            )}
          >
            {motivo ? (
              <>
                <span className="sr-only">{motivo}</span>
                <span aria-hidden="true">{info.message}</span>
              </>
            ) : (
              info.message
            )}
          </p>
          <Button
            type="button"
            disabled={motivo !== null}
            loading={pendiente}
            loadingLabel={textoPublicando}
            aria-describedby={motivo ? ids.motivoMovil : undefined}
            onClick={publicar}
          >
            {textoPublicar}
          </Button>
        </ActionBar>
      )}
      {esBorrador || cerrada ? null : dialogoCerrar}
      {dialogoEliminar}
    </div>
  );
}
