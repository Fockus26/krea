"use client";

import { Calendar, Gift, Plus, Send, User, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { SumMeter } from "@/components/krea/sum-meter";
import { TopBarAccion } from "@/components/layout/top-bar-accion";
import { ActionBar } from "@/components/sections/shared/action-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DESHACER_MS } from "@/lib/evaluar";
import { METER_TEXT_CLASSES, SUM_STATE_TONE, sumMeterInfo } from "@/lib/meters";
import {
  borradorReducer,
  crearBorrador,
  type DatosBorrador,
  type ErroresTarea,
  esSeccionTarea,
  MAX_PREGUNTAS,
  MAX_PREGUNTAS_TEXTO,
  MIN_PREGUNTAS,
  motivoSuma,
  preguntasTitulo,
  SECCIONES_TAREA,
  sumaValores,
  TOAST_BORRADOR,
  TOAST_ELIMINADA,
  TOAST_PUBLICADA,
  tieneErrores,
  validarTarea,
} from "@/lib/tareas-profe";
import { cn } from "@/lib/utils";
import { preguntaDomId, QuestionEditor } from "./question-editor";

const SIN_ERRORES: ErroresTarea = { preguntas: {} };
const AGREGAR_ID = "agregar-pregunta";

/*
 * Constructor de tareas (HANDOFF §3; lienzos Constructor y Constructor-movil; D114–D117).
 * `g-side`: Datos + Preguntas a la izquierda; ≥ 1024 la columna de 360 sticky con la tarjeta
 * "Suma de valores", "Publicar tarea" (deshabilitado si la suma ≠ 20, con el motivo por
 * `aria-describedby`), "Guardar borrador" y la nota. < 1024 el medidor va sticky arriba y
 * "Publicar" en la `ActionBar`; cada corte oculta el otro con `display: none`, así hay una sola
 * región viva activa (la del `SumMeter`). Con la suma en 20, "Publicar" valida el resto al pulsar
 * (título, fecha, enunciados y valores) y lleva el foco al primer campo inválido (D071, D114).
 * Eliminar una pregunta no pide confirmación: toast "Pregunta eliminada" + "Deshacer" (§3).
 * Nada se guarda en la vista previa: publicar y guardar solo avisan con un toast.
 */
export function TaskBuilder({
  inicial,
  hoy,
  listaHref,
  guardarEnTopbar = false,
}: {
  inicial: DatosBorrador;
  /** Día civil ISO: una fecha de entrega anterior no se puede publicar. */
  hoy: string;
  /** A dónde vuelve al publicar. */
  listaHref: string;
  /**
   * Página real (D152): "Guardar borrador" < 1024 va en la topbar del shell (`TopBarAccion`, D130)
   * en vez de en el flujo. En `/secciones` (sin topbar) se queda en el flujo.
   */
  guardarEnTopbar?: boolean;
}) {
  const router = useRouter();
  const raiz = React.useRef<HTMLDivElement>(null);
  const [tarea, dispatch] = React.useReducer(
    borradorReducer,
    inicial,
    crearBorrador,
  );
  const [intentado, setIntentado] = React.useState(false);
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
  const errores = intentado ? validarTarea(tarea, hoy) : SIN_ERRORES;
  const lleno = tarea.preguntas.length >= MAX_PREGUNTAS;
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

  const publicar = () => {
    if (motivo) return;
    setIntentado(true);
    if (tieneErrores(validarTarea(tarea, hoy))) {
      // Un cuadro para que React pinte `aria-invalid`
      requestAnimationFrame(() => {
        raiz.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus();
      });
      return;
    }
    // Fase 07: aquí se escribe la tarea en Firestore (`tareaAGuardar`)
    toast.success(TOAST_PUBLICADA);
    router.push(listaHref);
  };

  // Fase 07: guarda `tareaAGuardar(tarea)` como borrador
  const guardar = () => toast.success(TOAST_BORRADOR);

  const notaPublicar = (
    // Copy del lienzo
    <p className="text-center text-small text-text-2">
      Al publicar, las secciones elegidas la ven en «Por entregar».
    </p>
  );

  return (
    <div
      ref={raiz}
      data-slot="task-builder"
      className="flex flex-col gap-section"
    >
      {/* < 1024: medidor sticky a 64 bajo la topbar (`.sticky-top` del lienzo) */}
      <SumMeter
        sum={suma}
        variant="bar"
        className="sticky top-16 z-sticky lg:hidden"
      />

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
                <Field
                  label="Fecha de entrega"
                  error={errores.fecha}
                  announce={false}
                >
                  {/* Sin calendario emergente (D116): el ícono es decorativo */}
                  <Input
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="dd/mm/aaaa"
                    maxLength={10}
                    leading={<Calendar aria-hidden="true" />}
                    value={tarea.fecha}
                    onChange={(e) =>
                      dispatch({ tipo: "fecha", valor: e.currentTarget.value })
                    }
                  />
                </Field>
              </div>
              <div className="g2 gap-4">
                <Field label="Sección">
                  <Select
                    value={tarea.seccion}
                    onValueChange={(v) => {
                      if (esSeccionTarea(v))
                        dispatch({ tipo: "seccion", valor: v });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SECCIONES_TAREA.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                {/* Solo grupal; al pasar a Individual se oculta sin perder lo escrito (D116) */}
                {tarea.tipo === "grupal" ? (
                  <Field
                    label={
                      <>
                        Premio{" "}
                        <span className="font-normal text-text-2">
                          (solo grupal, opcional)
                        </span>
                      </>
                    }
                    help="Lo gana el equipo con mejor nota."
                  >
                    <Input
                      autoComplete="off"
                      placeholder="Ej. Cuenta Canva Pro por 3 meses"
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
                ) : null}
              </div>
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
                  onCambio={(cambios) =>
                    dispatch({ tipo: "editar", id: p.id, cambios })
                  }
                  onEliminar={() => eliminar(i)}
                />
              ))}
            </ol>
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
          </section>

          {/* < 1024: "Guardar borrador" en la topbar (página real) o en el flujo (vista previa) */}
          <div className="flex flex-col gap-2 lg:hidden">
            {guardarEnTopbar ? (
              <TopBarAccion>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={guardar}
                >
                  Guardar borrador
                </Button>
              </TopBarAccion>
            ) : (
              <Button type="button" variant="secondary" block onClick={guardar}>
                Guardar borrador
              </Button>
            )}
            {notaPublicar}
          </div>
        </div>

        {/* ≥ 1024: columna de 360 sticky a 24 */}
        <div className="sticky top-6 flex flex-col gap-6 max-lg:hidden">
          <SumMeter sum={suma} variant="card" headingLevel={2} />
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              size="lg"
              block
              disabled={motivo !== null}
              aria-describedby={motivo ? ids.motivo : undefined}
              onClick={publicar}
            >
              <Send aria-hidden="true" />
              Publicar tarea
            </Button>
            {motivo ? (
              <p id={ids.motivo} className="sr-only">
                {motivo}
              </p>
            ) : null}
            <Button type="button" variant="secondary" block onClick={guardar}>
              Guardar borrador
            </Button>
            {notaPublicar}
          </div>
        </div>
      </div>

      {/* < 1024: barra de acción (§8 pide `bottom: 0` sin barra inferior: pendiente de la fase 05) */}
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
          aria-describedby={motivo ? ids.motivoMovil : undefined}
          onClick={publicar}
        >
          Publicar tarea
        </Button>
      </ActionBar>
    </div>
  );
}
