"use client";

import {
  Check,
  Minus,
  Plus,
  TrendingDown,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import * as React from "react";
import { NumberStepper } from "@/components/krea/number-stepper";
import { focusPrimerInvalido } from "@/components/sections/auth/focus-invalid";
import { alertVariants } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { CandidatosPuntos, InicialAjuste } from "@/lib/demo/puntos";
import { chipAjuste } from "@/lib/panel";
import {
  ajusteAplicadoTexto,
  chipMotivo,
  conDeltas,
  type FilaHistorial,
  isoLocal,
  MOTIVOS,
  type MotivoId,
  nuevoAjuste,
  PUNTOS_MAX,
  PUNTOS_MIN,
  PUNTOS_PASO,
  type SeccionPuntos,
  sinErrores,
  type TipoDestino,
  validarAjuste,
  valorPropuesto,
  vistaPrevia,
} from "@/lib/puntos";
import { cn } from "@/lib/utils";
import { RecipientCombobox } from "./recipient-combobox";

const SECCIONES: readonly SeccionPuntos[] = ["5A", "5C"];

/**
 * «Nuevo ajuste» (HANDOFF §3 Ajustes de puntos; D118–D120). Formulario cliente que valida al enviar
 * (D071: foco al primer inválido, `Field announce={false}`). Destino (Alumno/Equipo + 5A/5C, radiogroups;
 * cambiarlos limpia «¿A quién?»), combobox, Motivo con 8 radios reales, Puntos con signo (texto + ícono,
 * el color solo refuerza), Detalle (obligatorio en «Otro») y la vista previa: una sola región `role="status"`.
 * Un ajuste mueve puntos del ranking, nunca la nota (D007).
 */
export function AdjustmentForm({
  candidatos,
  deltas,
  inicial,
  profe,
  onAplicar,
}: {
  candidatos: CandidatosPuntos;
  /** Puntos movidos en esta sesión por destino (`deltasSesion`): la vista previa parte del estado local. */
  deltas: Readonly<Record<string, number>>;
  inicial?: InicialAjuste;
  profe: string;
  /**
   * Aplica el ajuste ya validado: `true` si quedó (el formulario avisa y se vacía), `false` si
   * no (quien llama ya avisó del error y el formulario se queda como estaba). Con Firestore (W7)
   * es asíncrono.
   */
  onAplicar: (
    fila: FilaHistorial,
    motivo: MotivoId,
  ) => boolean | Promise<boolean>;
}) {
  const ids = React.useId();
  const lAjustar = `${ids}-ajustar`;
  const lSeccion = `${ids}-seccion`;
  const lPuntos = `${ids}-puntos`;
  const idPuntos = `${ids}-puntos-campo`;
  const hPuntos = `${ids}-puntos-ayuda`;
  const ePuntos = `${ids}-puntos-error`;
  const sPuntos = `${ids}-puntos-signo`;
  const eMotivo = `${ids}-motivo-error`;
  const hTitulo = `${ids}-titulo`;

  const [tipo, setTipo] = React.useState<TipoDestino>(
    inicial?.tipo ?? "alumno",
  );
  const [seccion, setSeccion] = React.useState<SeccionPuntos>(
    inicial?.seccion ?? "5A",
  );
  const [destinoId, setDestinoId] = React.useState<string | null>(
    inicial?.destinoId ?? null,
  );
  const [motivo, setMotivo] = React.useState<MotivoId | null>(
    inicial?.motivo ?? null,
  );
  const [valor, setValor] = React.useState<number | null>(
    inicial ? valorPropuesto(inicial.motivo) : null,
  );
  const [detalle, setDetalle] = React.useState(inicial?.detalle ?? "");
  const [intentado, setIntentado] = React.useState(false);
  // Dirección del último −/+ (o ↑/↓): desde «sin valor» el stepper parte de `min` en las dos
  // direcciones (D103), que aquí sería −20; con la dirección se parte de ±0,5 (D119).
  const direccion = React.useRef<1 | -1 | null>(null);
  // Un envío a la vez (doble clic mientras se guarda)
  const enviando = React.useRef(false);

  const opciones = conDeltas(candidatos[tipo][seccion], deltas);
  const destino = opciones.find((o) => o.id === destinoId) ?? null;
  const borrador = { tipo, destinoId, motivo, valor, detalle };
  const errores = intentado ? validarAjuste(borrador) : {};
  const previa =
    destino && valor !== null && valor !== 0
      ? vistaPrevia({ destino, valor, ranking: opciones })
      : null;
  const chipValor = valor !== null && valor !== 0 ? chipAjuste(valor) : null;

  const cambiarDestino = (t: TipoDestino, s: SeccionPuntos) => {
    setTipo(t);
    setSeccion(s);
    setDestinoId(null);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (enviando.current) return;
    const err = validarAjuste(borrador);
    if (!sinErrores(err) || !destino || !motivo || valor === null) {
      setIntentado(true);
      focusPrimerInvalido(e.currentTarget);
      return;
    }
    const fila = nuevoAjuste({
      id: `nuevo-${Date.now()}`,
      destino,
      motivo,
      valor,
      detalle,
      fecha: isoLocal(new Date()),
      profe,
    });
    enviando.current = true;
    const ok = await onAplicar(fila, motivo);
    enviando.current = false;
    if (!ok) return;
    toast.success(ajusteAplicadoTexto(fila));
    // Se queda el destino (puede llevar otro ajuste); motivo, puntos y detalle vuelven a vacío
    setMotivo(null);
    setValor(null);
    setDetalle("");
    setIntentado(false);
  };

  const errValor = errores.valor;

  return (
    <Card>
      <form
        method="post"
        aria-labelledby={hTitulo}
        noValidate
        onSubmit={onSubmit}
        className="flex flex-col gap-6"
      >
        <h2 id={hTitulo} className="text-h3 text-text">
          Nuevo ajuste
        </h2>

        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1.5">
            <span id={lAjustar} className="text-label text-text">
              Ajustar a
            </span>
            <ToggleGroup
              aria-labelledby={lAjustar}
              value={tipo}
              onValueChange={(v) => cambiarDestino(v as TipoDestino, seccion)}
            >
              <ToggleGroupItem value="alumno">
                <User aria-hidden="true" />
                Alumno
              </ToggleGroupItem>
              <ToggleGroupItem value="equipo">
                <Users aria-hidden="true" />
                Equipo
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="flex flex-col gap-1.5">
            <span id={lSeccion} className="text-label text-text">
              Sección
            </span>
            <ToggleGroup
              aria-labelledby={lSeccion}
              value={seccion}
              onValueChange={(v) => cambiarDestino(tipo, v as SeccionPuntos)}
            >
              {SECCIONES.map((s) => (
                <ToggleGroupItem key={s} value={s}>
                  {s}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>

        <Field label="¿A quién?" error={errores.destino} announce={false}>
          <RecipientCombobox
            // Al cambiar de tipo o sección, la lista es otra: el combobox empieza de cero
            key={`${tipo}-${seccion}`}
            opciones={opciones}
            value={destinoId}
            onChange={setDestinoId}
            placeholder={
              tipo === "alumno"
                ? `Busca un alumno de ${seccion}`
                : `Busca un equipo de ${seccion}`
            }
          />
        </Field>

        <fieldset
          className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0"
          aria-describedby={errores.motivo ? eMotivo : undefined}
        >
          <legend className="mb-2 text-label text-text">
            Motivo{" "}
            <span aria-hidden="true" className="text-error">
              *
            </span>
            <span className="sr-only">(obligatorio)</span>
          </legend>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {MOTIVOS.map((m) => {
              const chip = chipMotivo(m.valor);
              const elegido = motivo === m.id;
              return (
                <label
                  key={m.id}
                  className={cn(
                    "flex min-h-13 cursor-pointer items-center justify-between gap-2 rounded-nav border border-input bg-surface px-3 py-2 text-body font-semibold text-text",
                    "transition-[border-color,background-color,box-shadow] duration-fast ease-krea motion-reduce:transition-none",
                    "hover:border-text-2",
                    "has-checked:border-accent has-checked:bg-accent-soft has-checked:inset-ring has-checked:inset-ring-accent",
                    "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus",
                  )}
                >
                  <input
                    type="radio"
                    name={`${ids}-motivo`}
                    value={m.id}
                    checked={elegido}
                    required
                    aria-invalid={errores.motivo ? true : undefined}
                    aria-describedby={errores.motivo ? eMotivo : undefined}
                    className="sr-only"
                    onChange={() => {
                      setMotivo(m.id);
                      direccion.current = null;
                      setValor(valorPropuesto(m.id));
                    }}
                  />
                  <span className="flex min-w-0 items-center gap-2">
                    {elegido ? (
                      <Check
                        aria-hidden="true"
                        className="size-5 shrink-0 text-accent-ink"
                      />
                    ) : null}
                    <span className="break-words">{m.etiqueta}</span>
                  </span>
                  <Badge variant={chip.variante} className="nums">
                    <span aria-hidden="true">{chip.visible}</span>
                    <span className="sr-only">{chip.accesible}</span>
                  </Badge>
                </label>
              );
            })}
          </div>
          {errores.motivo ? (
            <p
              id={eMotivo}
              className="text-small-b flex items-start gap-1.5 text-error"
            >
              {errores.motivo}
            </p>
          ) : null}
        </fieldset>

        <div className="flex flex-wrap items-start gap-4">
          <div className="flex flex-col gap-1.5">
            <Label id={lPuntos} htmlFor={idPuntos}>
              Puntos
            </Label>
            {/* Solo lee qué botón del stepper se pulsó (los botones son del NumberStepper) */}
            <div
              className="flex flex-wrap items-center gap-2"
              onClickCapture={(e) => {
                const b = (e.target as Element).closest("button");
                const nombre = b?.getAttribute("aria-label") ?? "";
                direccion.current = nombre.startsWith("Sumar")
                  ? 1
                  : nombre.startsWith("Restar")
                    ? -1
                    : null;
              }}
              onKeyDownCapture={(e) => {
                direccion.current =
                  e.key === "ArrowUp" ? 1 : e.key === "ArrowDown" ? -1 : null;
              }}
            >
              <NumberStepper
                id={idPuntos}
                aria-labelledby={lPuntos}
                value={valor}
                min={PUNTOS_MIN}
                max={PUNTOS_MAX}
                step={PUNTOS_PASO}
                unit="pts"
                emptyText="Sin valor"
                aria-invalid={errValor ? true : undefined}
                aria-describedby={[
                  chipValor ? sPuntos : null,
                  hPuntos,
                  errValor ? ePuntos : null,
                ]
                  .filter(Boolean)
                  .join(" ")}
                className={cn(
                  valor !== null && valor > 0 && "[&_input]:text-success",
                  valor !== null && valor < 0 && "[&_input]:text-error",
                )}
                onChange={(n) => {
                  const dir = direccion.current;
                  direccion.current = null;
                  setValor(
                    valor === null && n === PUNTOS_MIN && dir !== null
                      ? dir * PUNTOS_PASO
                      : n,
                  );
                }}
              />
              {chipValor ? (
                <Badge
                  id={sPuntos}
                  variant={chipValor.signo === "mas" ? "ok" : "err"}
                  className="nums"
                >
                  {chipValor.signo === "mas" ? (
                    <Plus aria-hidden="true" />
                  ) : (
                    <Minus aria-hidden="true" />
                  )}
                  <span aria-hidden="true">
                    {chipValor.signo === "mas" ? "Suma" : "Resta"}{" "}
                    {chipValor.texto}
                  </span>
                  <span className="sr-only">{chipValor.accesible}</span>
                </Badge>
              ) : null}
            </div>
            <p id={hPuntos} className="text-small text-text-2">
              {motivo === "otro"
                ? "Escribe el valor: positivo suma, negativo resta. Pasos de 0,5."
                : "Propuesto por el motivo. Pasos de 0,5."}
            </p>
            {errValor ? (
              <p
                id={ePuntos}
                className="text-small-b flex items-start gap-1.5 text-error"
              >
                {errValor}
              </p>
            ) : null}
          </div>

          <Field
            className="min-w-[min(--spacing(60),100%)] flex-1"
            label={
              <>
                Detalle{" "}
                <span className="font-normal text-text-2">
                  (obligatorio en «Otro»)
                </span>
              </>
            }
            error={errores.detalle}
            announce={false}
          >
            <Textarea
              rows={2}
              compact
              value={detalle}
              required={motivo === "otro"}
              onChange={(e) => setDetalle(e.currentTarget.value)}
            />
          </Field>
        </div>

        {/* Única región viva del formulario: la frase completa, estable (no cifras sueltas) */}
        <output aria-live="polite" aria-atomic="true" className="block">
          {previa ? (
            // `<output>` solo admite contenido de frase: spans con el aspecto de Alert ok/err
            <span
              data-variant={previa.variante}
              className={alertVariants({ variant: previa.variante })}
            >
              {previa.variante === "ok" ? (
                <TrendingUp
                  aria-hidden="true"
                  className="mt-px size-5 shrink-0 text-success"
                />
              ) : (
                <TrendingDown
                  aria-hidden="true"
                  className="mt-px size-5 shrink-0 text-error"
                />
              )}
              <span className="min-w-0 flex-1">
                {previa.partes.prefijo}
                <b>{previa.partes.nombre}</b>
                {previa.partes.medio}
                <b>{previa.partes.puntos}</b>
                {previa.partes.cola}
              </span>
            </span>
          ) : null}
        </output>

        <Button type="submit" size="lg" className="self-start">
          <Check aria-hidden="true" />
          Aplicar ajuste
        </Button>
      </form>
    </Card>
  );
}
