"use client";

import * as React from "react";
import { toast } from "@/components/ui/sonner";
import {
  type AplicarAjuste,
  errorAjusteTexto,
  type ResultadoAjuste,
} from "@/lib/ajustes-datos";
import type { InicialAjuste } from "@/lib/demo/puntos";
import type { SeccionId } from "@/lib/modelo";
import {
  aplicarOperacionMotivos,
  type CatalogoMotivos,
  idMotivoNuevo,
  type OperacionMotivos,
  type ResultadoMotivos,
} from "@/lib/motivos";
import {
  ajusteAnuladoTexto,
  anular,
  type CandidatosPuntos,
  deltasSesion,
  FILTRO_VACIO,
  type FilaHistorial,
  type FiltroHistorial,
  isoLocal,
} from "@/lib/puntos";
import { AdjustmentForm } from "./adjustment-form";
import { AdjustmentHistory } from "./adjustment-history";
import { type AccionesMotivos, MotivosDialog } from "./motivos-dialog";

/** Server Actions de Ajustes de puntos (W7, D207) y de sus opciones fijas (D375). */
export type AccionesPuntos = {
  aplicar: (e: AplicarAjuste) => Promise<ResultadoAjuste>;
  anular: (e: { ajusteId: string }) => Promise<ResultadoAjuste>;
  motivos: AccionesMotivos;
};

const sinRed = (): ResultadoAjuste => ({ ok: false, error: "red" });

/**
 * Ajustes de puntos (HANDOFF §3; D118–D121): `g-home` 7/5 con el formulario y el historial; una
 * columna por debajo de 1024 en el orden del DOM. Sin `acciones` (vista previa de /secciones) el
 * estado es local: aplicar y anular añaden filas al historial y mueven los puntos de la vista
 * previa. Con `acciones` (W7) se guarda en Firestore y el servidor devuelve el historial y los
 * puntos ya recalculados (la página se refresca). Las opciones de Motivo (D375) siguen la misma
 * regla: sin `acciones` se editan en el estado local; con ellas, la acción devuelve la lista guardada.
 */
export function PuntosView({
  candidatos,
  secciones,
  motivos: motivosServidor,
  historial,
  inicial,
  profe,
  acciones,
}: {
  candidatos: CandidatosPuntos;
  /** Secciones del catálogo, ordenadas (D322). */
  secciones: readonly SeccionId[];
  /** Opciones fijas de Motivo (`config/motivos`, D375). */
  motivos: CatalogoMotivos;
  historial: readonly FilaHistorial[];
  inicial?: InicialAjuste;
  profe: string;
  acciones?: AccionesPuntos;
}) {
  const [filas, setFilas] = React.useState<readonly FilaHistorial[]>(historial);
  // El servidor manda un historial nuevo tras aplicar o anular: reemplaza al local
  const [historialPrevio, setHistorialPrevio] = React.useState(historial);
  if (historialPrevio !== historial) {
    setHistorialPrevio(historial);
    setFilas(historial);
  }
  const [motivos, setMotivos] = React.useState(motivosServidor);
  const [motivosPrevios, setMotivosPrevios] = React.useState(motivosServidor);
  if (motivosPrevios !== motivosServidor) {
    setMotivosPrevios(motivosServidor);
    setMotivos(motivosServidor);
  }
  const [filtro, setFiltro] = React.useState<FiltroHistorial>(FILTRO_VACIO);

  /** Pinta la lista que devuelve la operación (del servidor o, sin `acciones`, la local). */
  const conLista = async (
    r: ResultadoMotivos | Promise<ResultadoMotivos>,
  ): Promise<ResultadoMotivos> => {
    const x = await r;
    if (x.ok) setMotivos(x.motivos);
    return x;
  };
  const local = (op: OperacionMotivos) => aplicarOperacionMotivos(motivos, op);
  const accionesMotivos: AccionesMotivos = {
    crear: (e) =>
      conLista(
        acciones
          ? acciones.motivos.crear(e)
          : local({ tipo: "crear", id: idMotivoNuevo(), ...e }),
      ),
    editar: (e) =>
      conLista(
        acciones ? acciones.motivos.editar(e) : local({ tipo: "editar", ...e }),
      ),
    borrar: (id) =>
      conLista(
        acciones ? acciones.motivos.borrar(id) : local({ tipo: "borrar", id }),
      ),
  };
  const deltas = deltasSesion(filas);

  const onAnular = async (id: string) => {
    const original = filas.find((f) => f.id === id);
    if (!original) return;
    if (acciones) {
      const r = await acciones.anular({ ajusteId: id }).catch(sinRed);
      if (r.ok) toast.success(ajusteAnuladoTexto(original));
      else toast.error(errorAjusteTexto(r.error));
      return;
    }
    setFilas(
      anular(filas, id, {
        nuevoId: `anula-${id}-${Date.now()}`,
        fecha: isoLocal(new Date()),
        profe,
      }),
    );
    toast.success(ajusteAnuladoTexto(original));
  };

  return (
    <div className="g-home max-md:gap-6">
      <AdjustmentForm
        candidatos={candidatos}
        secciones={secciones}
        motivos={motivos}
        editarOpciones={
          <MotivosDialog motivos={motivos} acciones={accionesMotivos} />
        }
        deltas={deltas}
        inicial={inicial}
        profe={profe}
        onAplicar={async (f, motivo) => {
          if (!acciones) {
            setFilas((prev) => [f, ...prev]);
            return true;
          }
          const r = await acciones
            .aplicar({
              destino: f.tipo,
              destinoId: f.destinoId,
              motivoId: motivo,
              valor: f.valor,
              nota: f.detalle ?? "",
            })
            .catch(sinRed);
          if (!r.ok) toast.error(errorAjusteTexto(r.error));
          return r.ok;
        }}
      />
      <AdjustmentHistory
        filas={filas}
        secciones={secciones}
        motivos={motivos}
        filtro={filtro}
        onFiltro={setFiltro}
        onAnular={onAnular}
      />
    </div>
  );
}
