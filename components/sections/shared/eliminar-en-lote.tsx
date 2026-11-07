"use client";
// Eliminar en lote (W22, D298–D300): la barra «N seleccionados · Eliminar» y su confirmación.
// Alumnos, Profesores, Tareas y Equipos la comparten (por `id`: cédula, tarea o equipo, D314);
// cada pantalla pone su acción de servidor, sus textos y, si
// quiere, un detalle de lo que se borra (Alumnos lo cuenta en el servidor al abrir). Confirmar
// borra trozo a trozo (TOPE_LOTE); si alguno falla, el diálogo sigue abierto con quiénes y por qué,
// y esos siguen seleccionados para reintentar. Sin fallos: se cierra con un toast.
import { Trash2, X } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
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
import { toast } from "@/components/ui/sonner";
import {
  AYUDA_RANGO,
  eliminadosTexto,
  eliminarLoteBoton,
  eliminarLoteTitulo,
  eliminarPorTrozos,
  fallidosTitulo,
  REINTENTAR_LOTE,
  type ResultadoLote,
  type Sustantivo,
  seleccionadosTexto,
  separarResultados,
} from "@/lib/lote";

export type ItemLote = { id: string; nombre: string };

type Fallo = { id: string; nombre: string; motivo: string };

export function EliminarEnLote<E>({
  seleccionados,
  sustantivo,
  onLimpiar,
  descripcion,
  detalle,
  listo = true,
  onAbrir,
  eliminar,
  errorTexto,
  errorRed,
  onEliminados,
  focoAlTerminar,
}: {
  /** Lo seleccionado y visible, en el orden de la lista. */
  seleccionados: readonly ItemLote[];
  sustantivo: Sustantivo;
  onLimpiar: () => void;
  /** Qué se borra de cada uno (y qué se queda). */
  descripcion: ReactNode;
  /** Lo contado al abrir (región viva); `listo` = se puede confirmar. */
  detalle?: ReactNode;
  listo?: boolean;
  onAbrir?: (ids: string[]) => void;
  eliminar: (ids: string[]) => Promise<ResultadoLote<E>>;
  errorTexto: (e: E) => string;
  errorRed: E;
  /** Los ids que ya no están: la pantalla los quita de la lista y de la selección. */
  onEliminados: (ids: string[]) => void;
  /** Id del control que recibe el foco si se borraron todos (la barra desaparece). */
  focoAlTerminar?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [fallos, setFallos] = useState<Fallo[]>([]);
  const [hechos, setHechos] = useState(0);
  const enviando = useRef(false);
  const terminado = useRef(false);
  const n = seleccionados.length;
  // Mientras el diálogo se cierra tras borrar a todos, sigue diciendo a quiénes (no «0»)
  const [ultimos, setUltimos] = useState(seleccionados);
  if (n > 0 && seleccionados !== ultimos) setUltimos(seleccionados);
  const mostrados = n > 0 ? seleccionados : ultimos;
  // «Ningún … seleccionado» se anuncia al vaciar, no al entrar a la pantalla
  const [tocado, setTocado] = useState(false);
  if (n > 0 && !tocado) setTocado(true);

  function abrir(v: boolean) {
    setAbierto(v);
    setFallos([]);
    setHechos(0);
    if (v) {
      terminado.current = false;
      onAbrir?.(seleccionados.map((s) => s.id));
    }
  }

  async function confirmar() {
    if (enviando.current || !listo || n === 0) return;
    enviando.current = true;
    setBorrando(true);
    setFallos([]);
    const lista = [...seleccionados];
    const r = await eliminarPorTrozos(
      lista.map((s) => s.id),
      eliminar,
      errorRed,
    );
    enviando.current = false;
    setBorrando(false);
    const { ok, fallidos } = separarResultados(r);
    if (ok.length) onEliminados(ok);
    if (fallidos.length === 0) {
      terminado.current = true;
      setAbierto(false);
      toast(eliminadosTexto(ok.length, sustantivo));
      return;
    }
    const nombre = new Map(lista.map((s) => [s.id, s.nombre]));
    setHechos(ok.length);
    setFallos(
      fallidos.map((f) => ({
        id: f.id,
        nombre: nombre.get(f.id) ?? f.id,
        motivo: errorTexto(f.error),
      })),
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {/* Se anuncia cada cambio de la selección; con 0 queda solo para el lector */}
      <p
        aria-live="polite"
        aria-atomic="true"
        className={n === 0 ? "sr-only" : "text-label text-text"}
      >
        {n === 0 && !tocado ? "" : seleccionadosTexto(n, sustantivo)}
      </p>
      {n > 0 ? (
        // PROVISIONAL (D311, sin fila): ayuda del Shift; el teclado la tiene como Shift+Espacio
        <span className="text-small text-text-2">{AYUDA_RANGO}</span>
      ) : null}
      {/* El diálogo no depende de la selección: si se borraron todos, cierra con su animación */}
      <Dialog open={abierto} onOpenChange={abrir}>
        {n > 0 ? (
          <DialogTrigger asChild>
            <Button type="button" variant="ghost-danger" size="sm">
              <Trash2 aria-hidden="true" />
              Eliminar
              <span className="sr-only">
                {" "}
                {seleccionadosTexto(n, sustantivo).toLowerCase()}
              </span>
            </Button>
          </DialogTrigger>
        ) : null}
        <DialogContent
          onCloseAutoFocus={(e) => {
            // Sin selección la barra (y su botón) ya no existe: el foco va a un sitio fijo
            if (terminado.current && focoAlTerminar) {
              e.preventDefault();
              document.getElementById(focoAlTerminar)?.focus();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {eliminarLoteTitulo(mostrados.length, sustantivo)}
            </DialogTitle>
            <DialogDescription>{descripcion}</DialogDescription>
          </DialogHeader>
          {detalle}
          <ul
            // biome-ignore lint/a11y/noNoninteractiveTabindex: lista desplazable: el teclado tiene que poder recorrerla
            tabIndex={0}
            aria-label={`Lista de ${sustantivo.varios} que se eliminan`}
            className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-sm bg-surface-2 px-3 py-2 text-body text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {mostrados.map((s) => (
              <li key={s.id} className="break-words">
                {s.nombre}
              </li>
            ))}
          </ul>
          {fallos.length ? (
            <ErrorEnPantalla
              titulo={fallidosTitulo(hechos, fallos.length, sustantivo)}
            >
              <span className="flex flex-col gap-1">
                {fallos.map((f) => (
                  <span key={f.id}>
                    <span className="text-small-b">{f.nombre}</span>: {f.motivo}
                  </span>
                ))}
                <span>{REINTENTAR_LOTE}</span>
              </span>
            </ErrorEnPantalla>
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
              disabled={!listo || n === 0}
              loading={borrando}
              loadingLabel="Eliminando…"
              onClick={confirmar}
            >
              <Trash2 aria-hidden="true" />
              {eliminarLoteBoton(mostrados.length)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {n > 0 ? (
        <Button type="button" variant="ghost" size="sm" onClick={onLimpiar}>
          <X aria-hidden="true" />
          Quitar selección
        </Button>
      ) : null}
    </div>
  );
}
