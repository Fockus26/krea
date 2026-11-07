"use client";
// «Eliminar alumno» desde su ficha (W12, D268). Al abrir pide al servidor cuántas notas
// individuales y ajustes se perderían (acción de solo lectura) y lo dice antes de confirmar; no
// deja confirmar hasta tenerlo. Confirmar borra su cuenta y sus datos; las grupales se quedan con
// su equipo. Si falla, el diálogo sigue abierto con el error (D171).
import { Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { ErrorEnPantalla } from "@/components/estados/errores";
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
  errorBorrarAlumnoTexto,
  type ResultadoBorrarAlumno,
  type ResultadoResumenBorrado,
  type ResumenBorrado,
  sinNotaTexto,
} from "@/lib/alumnos-alta";

export type AccionesBorrarAlumno = {
  resumir: (cedula: string) => Promise<ResultadoResumenBorrado>;
  eliminar: (cedula: string) => Promise<ResultadoBorrarAlumno>;
};

type Resumen =
  | { estado: "contando" }
  | { estado: "listo"; resumen: ResumenBorrado }
  | { estado: "error"; mensaje: string };

export function DeleteStudentDialog({
  alumno,
  acciones,
  onEliminado,
}: {
  alumno: Pick<FilaAlumno, "cedula" | "nombres" | "apellidos">;
  acciones: AccionesBorrarAlumno;
  onEliminado: (cedula: string) => void;
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
      .catch((): ResultadoResumenBorrado => ({ ok: false, error: "red" }))
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
      .catch((): ResultadoBorrarAlumno => ({ ok: false, error: "red" }));
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
        <Button type="button" variant="ghost" className="text-error">
          <Trash2 aria-hidden="true" />
          Eliminar alumno
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar a {nombre}?</DialogTitle>
          <DialogDescription>{BORRADO_CUENTA}</DialogDescription>
        </DialogHeader>
        {/* El recuento llega del servidor: región viva para que se lea al aparecer */}
        <div aria-live="polite" className="flex flex-col gap-2">
          {resumen.estado === "contando" ? (
            <p className="flex items-center gap-2 text-body text-text-2">
              <Spinner />
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
          <Button
            type="button"
            variant="danger"
            disabled={resumen.estado !== "listo"}
            loading={borrando}
            loadingLabel="Eliminando…"
            onClick={confirmar}
          >
            <Trash2 aria-hidden="true" />
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
