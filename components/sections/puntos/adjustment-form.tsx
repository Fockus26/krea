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
import { focusPrimerInvalido } from "@/components/sections/auth/focus-invalid";
import { SelectorSeccion } from "@/components/sections/shared/selector-seccion";
import { alertVariants } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { BOTON_LARGO_LG, Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { InicialAjuste } from "@/lib/demo/puntos";
import type { SeccionId } from "@/lib/modelo";
import { type CatalogoMotivos, type Motivo, motivoPorId } from "@/lib/motivos";
import { chipAjuste } from "@/lib/panel";
import {
  ajusteAplicadoTexto,
  type CandidatosPuntos,
  chipMotivo,
  conDeltas,
  type FilaHistorial,
  isoLocal,
  nuevoAjuste,
  sinErrores,
  type TipoDestino,
  validarAjuste,
  vistaPrevia,
} from "@/lib/puntos";
import { cn } from "@/lib/utils";
import { PuntosStepper } from "./puntos-stepper";
import { RecipientCombobox } from "./recipient-combobox";

/**
 * «Nuevo ajuste» (HANDOFF §3 Ajustes de puntos; D118–D120). Formulario cliente que valida al enviar
 * (D071: foco al primer inválido, `Field announce={false}`). Destino (Alumno/Equipo radiogroup + el
 * selector de sección del catálogo, D322; cambiarlos limpia «¿A quién?»), combobox, Motivo con un radio
 * real por opción de `config/motivos` (D375; `editarOpciones` = el botón «Editar opciones», D377), Puntos
 * con signo (texto + ícono, el color solo refuerza), Detalle (opcional, D376) y la vista previa: una sola
 * región `role="status"`. Un ajuste mueve puntos del ranking, nunca la nota (D007).
 */
export function AdjustmentForm({
  candidatos,
  secciones,
  motivos,
  editarOpciones,
  deltas,
  inicial,
  profe,
  onAplicar,
}: {
  candidatos: CandidatosPuntos;
  /** Secciones del catálogo, ordenadas (al menos una: sin ninguna, la página muestra el vacío). */
  secciones: readonly SeccionId[];
  /** Opciones fijas vigentes, en su orden (al menos una). */
  motivos: CatalogoMotivos;
  /** El botón «Editar opciones» (abre su diálogo), debajo de las opciones de Motivo. */
  editarOpciones?: React.ReactNode;
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
    motivoId: string,
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
  const [seccion, setSeccion] = React.useState<SeccionId>(
    inicial?.seccion ?? secciones[0] ?? "",
  );
  const [destinoId, setDestinoId] = React.useState<string | null>(
    inicial?.destinoId ?? null,
  );
  const [motivoId, setMotivoId] = React.useState<string | null>(
    inicial?.motivo ?? null,
  );
  const [valor, setValor] = React.useState<number | null>(
    inicial ? (motivoPorId(motivos, inicial.motivo)?.valor ?? null) : null,
  );
  const [detalle, setDetalle] = React.useState(inicial?.detalle ?? "");
  const [intentado, setIntentado] = React.useState(false);
  // Un envío a la vez (doble clic mientras se guarda)
  const enviando = React.useRef(false);

  const opciones = conDeltas(candidatos[tipo][seccion] ?? [], deltas);
  const destino = opciones.find((o) => o.id === destinoId) ?? null;
  // Si otro profe (o el diálogo) borró la opción elegida, cuenta como sin elegir
  const motivo: Motivo | null =
    (motivoId === null ? undefined : motivoPorId(motivos, motivoId)) ?? null;
  const borrador = {
    tipo,
    destinoId,
    motivo: motivo?.id ?? null,
    valor,
    detalle,
  };
  const errores = intentado ? validarAjuste(borrador) : {};
  const previa =
    destino && valor !== null && valor !== 0
      ? vistaPrevia({ destino, valor, ranking: opciones })
      : null;
  const chipValor = valor !== null && valor !== 0 ? chipAjuste(valor) : null;

  const cambiarDestino = (t: TipoDestino, s: SeccionId) => {
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
    const ok = await onAplicar(fila, motivo.id);
    enviando.current = false;
    if (!ok) return;
    toast.success(ajusteAplicadoTexto(fila));
    // Se queda el destino (puede llevar otro ajuste); motivo, puntos y detalle vuelven a vacío
    setMotivoId(null);
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
            <SelectorSeccion
              labelledBy={lSeccion}
              secciones={secciones}
              valor={seccion}
              onCambio={(s) => cambiarDestino(tipo, s)}
            />
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
            {motivos.map((m) => {
              const chip = chipMotivo(m.valor);
              const elegido = motivo?.id === m.id;
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
                      setMotivoId(m.id);
                      setValor(m.valor);
                    }}
                  />
                  <span className="flex min-w-0 icono-linea gap-2">
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
          {editarOpciones ? (
            <div className="mt-1 flex">{editarOpciones}</div>
          ) : null}
        </fieldset>

        {/* D262: una columna en todos los anchos: Motivo → Puntos → Detalle */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <Label id={lPuntos} htmlFor={idPuntos}>
              Puntos
            </Label>
            <div className="flex flex-wrap items-center gap-2">
              <PuntosStepper
                id={idPuntos}
                aria-labelledby={lPuntos}
                value={valor}
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
                onChange={setValor}
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
              Propuesto por el motivo. Pasos de 0,5.
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
            className="w-full"
            label={
              <>
                Detalle {/* PROVISIONAL (CONTENT_CHECKLIST fila 193) */}
                <span className="font-normal text-text-2">(opcional)</span>
              </>
            }
          >
            <Textarea
              rows={2}
              compact
              autoGrow
              value={detalle}
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
                  className="size-5 shrink-0 text-success"
                />
              ) : (
                <TrendingDown
                  aria-hidden="true"
                  className="size-5 shrink-0 text-error"
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

        <Button
          type="submit"
          size="lg"
          className={cn("self-start", BOTON_LARGO_LG)}
        >
          <Check aria-hidden="true" />
          Aplicar ajuste
        </Button>
      </form>
    </Card>
  );
}
