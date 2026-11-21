"use client";

import { Sparkles } from "lucide-react";
import * as React from "react";
import { BotonEnLinea } from "@/components/krea/boton-en-linea";
import { Badge } from "@/components/ui/badge";
import {
  type AnalizarTexto,
  type EstadoAnalisisIA,
  errorAnalisisTexto,
  IA_ANALIZANDO,
  IA_AYUDA,
  IA_BOTON,
  IA_BOTON_DE_NUEVO,
  IA_CORTO,
  IA_ORIENTATIVO,
  IA_RESULTADO_TEXTO,
  IA_SIN_ANALISIS,
  IA_TITULO,
  iaBotonEtiqueta,
  iaDesactualizadoTexto,
  porcentajeTexto,
  type ResultadoAnalisisIA,
} from "@/lib/ia-texto";
import { siNoEsDeploy } from "@/lib/recarga-deploy";

export type AnalizarIA = (e: AnalizarTexto) => Promise<ResultadoAnalisisIA>;

/*
 * % orientativo de uso de IA de una respuesta de texto (D425–D429), solo en Evaluar (profesor).
 * Va en el hueco `bajoRespuesta` de `QuestionCardReview`. Badge neutro (nunca colores de nota):
 * el número siempre con la palabra «orientativo» y la ayuda de que no es prueba de nada. El
 * resultado y los errores se anuncian en una región `polite` / `role="alert"`.
 */
export function AnalisisIA({
  entregaId,
  preguntaId,
  numero,
  estado,
  analizar,
}: {
  entregaId: string;
  preguntaId: string;
  numero: number;
  estado: EstadoAnalisisIA;
  analizar: AnalizarIA;
}) {
  const [pendiente, iniciar] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  // El resultado recién pedido, hasta que la página (refresh) traiga el mismo
  const [nuevo, setNuevo] = React.useState<number | null>(null);

  const vigente =
    nuevo ?? (estado.tipo === "vigente" ? estado.porcentaje : null);
  const desactualizado =
    nuevo === null && estado.tipo === "desactualizado" ? estado : null;
  const deNuevo = vigente !== null || desactualizado !== null;

  const pedir = () => {
    setError(null);
    iniciar(async () => {
      const r = await analizar({ entregaId, preguntaId }).catch(
        siNoEsDeploy<ResultadoAnalisisIA>({ ok: false, error: "red" }),
      );
      if (r.ok) setNuevo(r.porcentaje);
      else setError(errorAnalisisTexto(r.error));
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-small-b text-text">
        {IA_TITULO}{" "}
        <span className="font-normal text-text-2">· {IA_ORIENTATIVO}</span>
      </p>
      <div aria-live="polite" className="flex flex-col gap-1">
        {vigente !== null ? (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-callout text-text">
            <Badge>{porcentajeTexto(vigente)}</Badge>
            <span>
              {IA_RESULTADO_TEXTO} ({IA_ORIENTATIVO})
            </span>
          </p>
        ) : null}
        {desactualizado ? (
          <p className="text-small text-text">
            {iaDesactualizadoTexto(desactualizado.porcentaje)}
          </p>
        ) : null}
        {estado.tipo === "corto" ? (
          <p className="text-small text-text-2">{IA_CORTO}</p>
        ) : null}
        {estado.tipo === "sin-analisis" && nuevo === null ? (
          <p className="text-small text-text-2">{IA_SIN_ANALISIS}</p>
        ) : null}
      </div>
      {vigente !== null ? (
        <p className="text-small text-text-2">{IA_AYUDA}</p>
      ) : null}
      {estado.tipo === "corto" ? null : (
        <div>
          <BotonEnLinea
            type="button"
            variant="secondary"
            size="sm"
            aria-busy={pendiente || undefined}
            aria-label={
              pendiente ? undefined : iaBotonEtiqueta(numero, deNuevo)
            }
            onClick={() => {
              if (!pendiente) pedir();
            }}
          >
            <Sparkles aria-hidden="true" />
            {pendiente ? IA_ANALIZANDO : deNuevo ? IA_BOTON_DE_NUEVO : IA_BOTON}
          </BotonEnLinea>
        </div>
      )}
      {error ? (
        <p role="alert" className="text-small text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
