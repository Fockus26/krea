"use client";
import { Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { ErrorEnPantalla } from "@/components/estados/errores";
// «Eliminar alumno» desde su ficha (W12, D268). Al abrir pide al servidor cuántas notas
// individuales y ajustes se perderían (acción de solo lectura) y lo dice antes de confirmar; no
// deja confirmar hasta tenerlo. Confirmar borra su cuenta y sus datos; las grupales se quedan con
// su equipo. Si falla, el diálogo sigue abierto con el error (D171).
import { BotonEnLinea } from "@/components/krea/boton-en-linea";
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
import { Spinner } from "@/components/ui/spinner";
import { type FilaAlumno, nombreAlumno } from "@/lib/alumnos";
import {
  BORRADO_CUENTA,
  BORRADO_GRUPALES,
  borradoTexto,
  capitaniaTexto,
  type ErrorBorrarAlumno,
  errorBorrarAlumnoTexto,
  type ResultadoBorrarAlumno,
  type ResultadoResumenBorrado,
  type ResultadoResumenLote,
  type ResumenBorrado,
  sinNotaTexto,
} from "@/lib/alumnos-alta";
import type { ResultadoLote } from "@/lib/lote";
import { siNoEsDeploy } from "@/lib/recarga-deploy";

export type AccionesBorrarAlumno = {
  resumir: (cedula: string) => Promise<ResultadoResumenBorrado>;
  eliminar: (cedula: string) => Promise<ResultadoBorrarAlumno>;
  /** En lote (W22, D298); sin ellas, la tabla no ofrece casillas. */
  resumirVarios?: (cedulas: string[]) => Promise<ResultadoResumenLote>;
  eliminarVarios?: (
    cedulas: string[],
  ) => Promise<ResultadoLote<ErrorBorrarAlumno>>;
};

type Resumen =
  | { estado: "contando" }
  | { estado: "listo"; resumen: ResumenBorrado }
  | { estado: "error"; mensaje: string };

export function DeleteStudentDialog({
  alumno,
  acciones,
  onEliminado,
  compacto = false,
}: {
  alumno: Pick<FilaAlumno, "cedula" | "nombres" | "apellidos">;
  acciones: AccionesBorrarAlumno;
  onEliminado: (cedula: string) => void;
  /** Disparador de solo ícono (la fila de la tabla); sin él, «Eliminar alumno» (la ficha). */
  compacto?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [resumen, setResumen] = useState<Resumen>({ estado: "contando" });
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enviando = useRef(false);
  const pedido = useRef(0);
  const nombre = nombreAlumno(alumno);

  function abrir(v: boolean) {
    setAbierto(v);
    setError(null);
    if (!v) return;
    // Cada apertura cuenta de nuevo: otro profe pudo evaluar o ajustar mientras tanto
    const n = ++pedido.current;
    setResumen({ estado: "contando" });
    void acciones
      .resumir(alumno.cedula)
      .catch(siNoEsDeploy<ResultadoResumenBorrado>({ ok: false, error: "red" }))
      .then((r) => {
        if (n !== pedido.current) return;
        setResumen(
          r.ok
            ? { estado: "listo", resumen: r.resumen }
            : { estado: "error", mensaje: errorBorrarAlumnoTexto(r.error) },
        );
      });
  }

  async function confirmar() {
    if (enviando.current || resumen.estado !== "listo") return;
    enviando.current = true;
    setBorrando(true);
    setError(null);
    const r = await acciones
      .eliminar(alumno.cedula)
      .catch(siNoEsDeploy<ResultadoBorrarAlumno>({ ok: false, error: "red" }));
    enviando.current = false;
    setBorrando(false);
    if (!r.ok) {
      setError(errorBorrarAlumnoTexto(r.error));
      return;
    }
    setAbierto(false);
    onEliminado(alumno.cedula);
  }

  return (
    <Dialog open={abierto} onOpenChange={abrir}>
      <DialogTrigger asChild>
        {compacto ? (
          // En la fila, junto a «Editar» (D298): solo ícono, con el nombre para el lector
          <Button
            type="button"
            variant="ghost-danger"
            size="sm"
            icon
            aria-label={`Eliminar a ${nombre}`}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        ) : (
          <Button type="button" variant="ghost-danger">
            <Trash2 aria-hidden="true" />
            Eliminar alumno
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar a {nombre}?</DialogTitle>
          <DialogDescription>{BORRADO_CUENTA}</DialogDescription>
        </DialogHeader>
        {/* El recuento llega del servidor: región viva para que se lea al aparecer */}
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
                {borradoTexto(resumen.resumen)}
              </p>
              {sinNotaTexto(resumen.resumen.sinNota) ? (
                <p className="text-body text-text-2">
                  {sinNotaTexto(resumen.resumen.sinNota)}
                </p>
              ) : null}
              {capitaniaTexto(resumen.resumen.capitania) ? (
                <p className="text-body text-text-2">
                  {capitaniaTexto(resumen.resumen.capitania)}
                </p>
              ) : null}
              <p className="text-body text-text-2">{BORRADO_GRUPALES}</p>
            </>
          )}
        </div>
        {error ? (
          <ErrorEnPantalla titulo="No se eliminó">{error}</ErrorEnPantalla>
        ) : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </DialogClose>
          <BotonEnLinea
            type="button"
            variant="danger"
            disabled={resumen.estado !== "listo"}
            loading={borrando}
            loadingLabel="Eliminando…"
            onClick={confirmar}
          >
            <Trash2 aria-hidden="true" />
            Eliminar
          </BotonEnLinea>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
