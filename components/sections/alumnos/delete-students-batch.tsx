"use client";
import { useRef, useState } from "react";
import { ErrorEnPantalla } from "@/components/estados/errores";
import {
  EliminarEnLote,
  type ItemLote,
} from "@/components/sections/shared/eliminar-en-lote";
import { Spinner } from "@/components/ui/spinner";
import {
  BORRADO_CUENTAS_LOTE,
  BORRADO_GRUPALES,
  borradoLoteTexto,
  capitanesTexto,
  type ErrorBorrarAlumno,
  errorBorrarAlumnoTexto,
  type ResultadoResumenLote,
  type ResumenBorradoLote,
  sinNotaTexto,
} from "@/lib/alumnos-alta";
import { ALUMNOS, partirEnLotes, type ResultadoLote } from "@/lib/lote";
// Eliminar varios alumnos (W22, D298–D300). Como el de uno (D268): al abrir pide al servidor la
// suma de lo que se perdería y no deja confirmar hasta tenerla. El resto (barra, confirmación,
// resultado por alumno) es la pieza compartida `EliminarEnLote`.
import { siNoEsDeploy } from "@/lib/recarga-deploy";

type Resumen =
  | { estado: "contando" }
  | { estado: "listo"; resumen: ResumenBorradoLote }
  | { estado: "error"; mensaje: string };

/** Suma los resúmenes de cada trozo; un trozo caído deja todo en error. */
async function resumirTodo(
  cedulas: string[],
  resumir: (c: string[]) => Promise<ResultadoResumenLote>,
): Promise<ResultadoResumenLote> {
  const total: ResumenBorradoLote = {
    notas: 0,
    sinNota: 0,
    ajustes: 0,
    capitanes: 0,
  };
  for (const trozo of partirEnLotes(cedulas)) {
    const r = await resumir(trozo).catch(
      siNoEsDeploy<ResultadoResumenLote>({ ok: false, error: "red" }),
    );
    if (!r.ok) return r;
    total.notas += r.resumen.notas;
    total.sinNota += r.resumen.sinNota;
    total.ajustes += r.resumen.ajustes;
    total.capitanes += r.resumen.capitanes;
  }
  return { ok: true, resumen: total };
}

export function DeleteStudentsBatch({
  seleccionados,
  onLimpiar,
  resumir,
  eliminar,
  onEliminados,
  focoAlTerminar,
}: {
  seleccionados: readonly ItemLote[];
  onLimpiar: () => void;
  resumir: (cedulas: string[]) => Promise<ResultadoResumenLote>;
  eliminar: (cedulas: string[]) => Promise<ResultadoLote<ErrorBorrarAlumno>>;
  onEliminados: (cedulas: string[]) => void;
  focoAlTerminar?: string;
}) {
  const [resumen, setResumen] = useState<Resumen>({ estado: "contando" });
  const pedido = useRef(0);

  function contar(cedulas: string[]) {
    // Cada apertura cuenta de nuevo: otro profe pudo evaluar o ajustar mientras tanto
    const n = ++pedido.current;
    setResumen({ estado: "contando" });
    void resumirTodo(cedulas, resumir).then((r) => {
      if (n !== pedido.current) return;
      setResumen(
        r.ok
          ? { estado: "listo", resumen: r.resumen }
          : { estado: "error", mensaje: errorBorrarAlumnoTexto(r.error) },
      );
    });
  }

  return (
    <EliminarEnLote<ErrorBorrarAlumno>
      seleccionados={seleccionados}
      sustantivo={ALUMNOS}
      onLimpiar={onLimpiar}
      descripcion={BORRADO_CUENTAS_LOTE}
      listo={resumen.estado === "listo"}
      onAbrir={contar}
      eliminar={eliminar}
      errorTexto={errorBorrarAlumnoTexto}
      errorRed="red"
      onEliminados={onEliminados}
      focoAlTerminar={focoAlTerminar}
      detalle={
        // El recuento llega del servidor: región viva para que se lea al aparecer
        <div aria-live="polite" className="flex flex-col gap-2">
          {resumen.estado === "contando" ? (
            <p className="flex icono-linea gap-2 text-body text-text-2">
              <span className="icono-linea-caja">
                <Spinner />
              </span>
              Contando sus notas y ajustes…
            </p>
          ) : resumen.estado === "error" ? (
            <ErrorEnPantalla titulo="No pudimos contar sus datos">
              {resumen.mensaje}
            </ErrorEnPantalla>
          ) : (
            <>
              <p className="text-body-strong text-text">
                {borradoLoteTexto(resumen.resumen)}
              </p>
              {sinNotaTexto(resumen.resumen.sinNota) ? (
                <p className="text-body text-text-2">
                  {sinNotaTexto(resumen.resumen.sinNota)}
                </p>
              ) : null}
              {capitanesTexto(resumen.resumen.capitanes) ? (
                <p className="text-body text-text-2">
                  {capitanesTexto(resumen.resumen.capitanes)}
                </p>
              ) : null}
              <p className="text-body text-text-2">{BORRADO_GRUPALES}</p>
            </>
          )}
        </div>
      }
    />
  );
}
