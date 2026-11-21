"use client";
import { EllipsisVertical, Star, Trash2, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ErrorEnPantalla } from "@/components/estados/errores";
// «Devolver al alumno» y «Eliminar entrega» (tanda 11-14 X1, D411–D415). Dos formas del mismo
// par de acciones: `menu` (la fila de la lista de entregas de una tarea: botón ícono «Más
// acciones de …» con un menú) y `botones` (Evaluar entrega, bajo la cabecera). Las dos piden
// confirmación en un diálogo que dice QUÉ SE PIERDE; si falla, el diálogo sigue abierto con el
// error (D171). Sin `acciones` (galería) solo se cierra con el toast.
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/sonner";
import {
  DEVOLVER_SOLO_ABIERTAS,
  type DevolverEntrega,
  devolverDescripcion,
  devolverTextoBoton,
  devolverTitulo,
  devueltaTexto,
  ELIMINAR_TEXTO_BOTON,
  type EliminarEntrega,
  eliminadaTexto,
  eliminarDescripcion,
  eliminarTitulo,
  errorDevolverTexto,
  masAccionesLabel,
  type ResultadoDevolver,
  type ResultadoEliminarEntrega,
  type TitularAccion,
} from "@/lib/devolver-entrega";
import { MARCAR_IDEAL_TEXTO } from "@/lib/ideal";
import { siNoEsDeploy } from "@/lib/recarga-deploy";

export type AccionesDevolverEntrega = {
  devolver: (e: DevolverEntrega) => Promise<ResultadoDevolver>;
  eliminar: (e: EliminarEntrega) => Promise<ResultadoEliminarEntrega>;
};

type Dialogo = "devolver" | "eliminar";

export function AccionesEntrega({
  entregaId,
  titular,
  enviadaEn,
  evaluadaEn,
  puedeDevolver,
  tareaCerrada = false,
  acciones,
  variante,
  despuesHref,
  idealHref,
}: {
  entregaId: string;
  titular: TitularAccion;
  /** Lo que el profe ve: si cambió, el servidor no toca nada (`cambio`). */
  enviadaEn: number | null;
  evaluadaEn: number | null;
  /** Evaluada y con la tarea abierta (D411). */
  puedeDevolver: boolean;
  /** En `botones`, con nota y la tarea cerrada: la línea que explica por qué no hay «Devolver». */
  tareaCerrada?: boolean;
  acciones?: AccionesDevolverEntrega;
  variante: "menu" | "botones";
  /** A dónde ir al terminar (Evaluar: la cola); sin él, se queda y se refresca. */
  despuesHref?: string;
  /** Solo en `menu`: «Marcar como entrega ideal» (20 / 20, tanda 11-14 Z2, D431). */
  idealHref?: string | null;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  // Se conserva al cerrar: el diálogo no cambia de texto durante su animación de salida
  const [dialogo, setDialogo] = useState<Dialogo>("eliminar");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ocupado = useRef(false);
  const desdeMenu = useRef(false);
  const disparador = useRef<HTMLButtonElement>(null);

  const abrir = (d: Dialogo) => {
    setError(null);
    setDialogo(d);
    desdeMenu.current = variante === "menu";
    setAbierto(true);
  };

  const terminar = (texto: string) => {
    setAbierto(false);
    toast.success(texto);
    if (despuesHref) router.push(despuesHref);
    // «Devolver» ya refresca desde el servidor. «Eliminar» no (la página de Evaluar de esa
    // entrega daría 404 antes de navegar): se refresca aquí, después de navegar si hay a dónde,
    // para que la cola o la lista no salgan de la caché del router (`staleTimes`)
    if (dialogo === "eliminar") router.refresh();
  };

  async function confirmar() {
    if (ocupado.current) return;
    ocupado.current = true;
    setEnviando(true);
    setError(null);
    const r = !acciones
      ? ({ ok: true, id: entregaId } as const)
      : dialogo === "devolver" && evaluadaEn !== null
        ? await acciones
            .devolver({ entregaId, evaluadaEn })
            .catch(siNoEsDeploy<ResultadoDevolver>({ ok: false, error: "red" }))
        : dialogo === "eliminar"
          ? await acciones.eliminar({ entregaId, enviadaEn, evaluadaEn }).catch(
              siNoEsDeploy<ResultadoEliminarEntrega>({
                ok: false,
                error: "red",
              }),
            )
          : // «Devolver» sin nota a la vista: no hay qué devolver
            ({ ok: false, error: "no-evaluada" } as const);
    ocupado.current = false;
    setEnviando(false);
    if (!r.ok) {
      setError(errorDevolverTexto(r.error));
      return;
    }
    terminar(
      dialogo === "devolver"
        ? devueltaTexto(titular.nombre)
        : eliminadaTexto(titular.nombre),
    );
  }

  const textoDevolver = devolverTextoBoton(titular.tipo);

  return (
    <>
      {variante === "menu" ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              ref={disparador}
              type="button"
              variant="ghost"
              size="sm"
              icon
              aria-label={masAccionesLabel(titular.nombre)}
            >
              <EllipsisVertical aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onCloseAutoFocus={(e) => {
              // Si se abrió un diálogo, el foco es suyo; el menú no se lo quita
              if (desdeMenu.current) e.preventDefault();
            }}
          >
            {idealHref ? (
              <>
                <DropdownMenuItem asChild>
                  <Link href={idealHref}>
                    <Star aria-hidden="true" />
                    {MARCAR_IDEAL_TEXTO}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            ) : null}
            {puedeDevolver ? (
              <>
                <DropdownMenuItem onSelect={() => abrir("devolver")}>
                  <Undo2 aria-hidden="true" />
                  {textoDevolver}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            ) : null}
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => abrir("eliminar")}
            >
              <Trash2 aria-hidden="true" />
              {ELIMINAR_TEXTO_BOTON}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {puedeDevolver ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => abrir("devolver")}
              >
                <Undo2 aria-hidden="true" />
                {textoDevolver}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost-danger"
              size="sm"
              onClick={() => abrir("eliminar")}
            >
              <Trash2 aria-hidden="true" />
              {ELIMINAR_TEXTO_BOTON}
            </Button>
          </div>
          {tareaCerrada && titular.evaluada ? (
            <p className="text-small text-text-2">{DEVOLVER_SOLO_ABIERTAS}</p>
          ) : null}
        </div>
      )}

      <Dialog
        open={abierto}
        onOpenChange={(v) => {
          if (!v && !ocupado.current) setAbierto(false);
        }}
      >
        <DialogContent
          onCloseAutoFocus={(e) => {
            // Abierto desde el menú: el ítem ya no existe; el foco vuelve al botón «Más acciones»
            if (!desdeMenu.current) return;
            desdeMenu.current = false;
            e.preventDefault();
            disparador.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {dialogo === "devolver"
                ? devolverTitulo(titular)
                : eliminarTitulo(titular)}
            </DialogTitle>
            <DialogDescription>
              {dialogo === "devolver"
                ? devolverDescripcion(titular)
                : eliminarDescripcion(titular)}
            </DialogDescription>
          </DialogHeader>
          {error ? (
            <ErrorEnPantalla
              titulo={
                dialogo === "devolver" ? "No se devolvió" : "No se eliminó"
              }
            >
              {error}
            </ErrorEnPantalla>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </DialogClose>
            {dialogo === "devolver" ? (
              <BotonEnLinea
                type="button"
                loading={enviando}
                loadingLabel="Devolviendo…"
                onClick={confirmar}
              >
                <Undo2 aria-hidden="true" />
                {textoDevolver}
              </BotonEnLinea>
            ) : (
              <BotonEnLinea
                type="button"
                variant="danger"
                loading={enviando}
                loadingLabel="Eliminando…"
                onClick={confirmar}
              >
                <Trash2 aria-hidden="true" />
                {ELIMINAR_TEXTO_BOTON}
              </BotonEnLinea>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
