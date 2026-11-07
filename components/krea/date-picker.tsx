"use client";

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input, type InputProps } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  acotar,
  DIAS_SEMANA,
  diaDeshabilitado,
  etiquetaDia,
  focoInicial,
  hayMes,
  type Limites,
  type Mes,
  mesDe,
  moverFoco,
  semanasDelMes,
  sumarMeses,
  tituloMes,
} from "@/lib/calendario";
import { fechaCampo, fechaIso } from "@/lib/tareas-profe";
import { cn } from "@/lib/utils";

/*
 * Selector de fecha propio (D283): el campo dd/mm/aaaa se sigue escribiendo (máscara del llamador) y
 * un botón «Elegir fecha» abre un calendario: popover bajo el campo ≥ 1024 (el corte del constructor)
 * y hoja inferior < 1024. Patrón ARIA de cuadrícula de fecha: `role="grid"`, un solo día en el orden
 * de tabulación (`tabIndex` móvil), flechas / Inicio / Fin / RePág / AvPág, Enter o Espacio eligen,
 * Esc cierra y el foco vuelve al botón. Los días no elegibles (D200) llevan `aria-disabled`.
 * La lógica vive pura en `lib/calendario.ts`. Sin librerías de fechas.
 */

const CORTE = "(min-width: 1024px)";

function suscribir(avisar: () => void) {
  const mq = window.matchMedia(CORTE);
  mq.addEventListener("change", avisar);
  return () => mq.removeEventListener("change", avisar);
}

/** ≥ 1024. En el servidor, `true` (el calendario nace cerrado: no pinta nada). */
function useLaptop() {
  return React.useSyncExternalStore(
    suscribir,
    () => window.matchMedia(CORTE).matches,
    () => true,
  );
}

type DatePickerProps = Omit<
  InputProps,
  "value" | "onChange" | "leading" | "trailing"
> & {
  /** Texto del campo, "dd/mm/aaaa" (o a medias mientras se escribe). */
  value: string;
  /** Recibe el texto nuevo tal cual: al escribir, lo crudo; al elegir, "dd/mm/aaaa". */
  onValueChange: (valor: string) => void;
  /** Día civil ISO de hoy en Caracas. */
  hoy: string;
  /** Fecha ISO ya guardada de una publicada: se puede conservar aunque haya pasado (D200). */
  fechaGuardada?: string | null;
};

function DatePicker({
  value,
  onValueChange,
  hoy,
  fechaGuardada = null,
  readOnly,
  ...props
}: DatePickerProps) {
  const laptop = useLaptop();
  const [abierto, setAbierto] = React.useState(false);
  const boton = React.useRef<HTMLButtonElement>(null);
  const limites: Limites = { hoy, fechaGuardada };

  function cambiar(a: boolean) {
    if (a && readOnly) return;
    setAbierto(a);
  }
  function elegir(iso: string) {
    onValueChange(fechaCampo(iso));
    setAbierto(false);
  }
  // El foco vuelve al botón, no al borde de la página (el contenido sale del árbol)
  function volverAlBoton(e: Event) {
    e.preventDefault();
    boton.current?.focus();
  }
  const calendario = (
    <Calendario
      limites={limites}
      seleccion={fechaIso(value)}
      denso={laptop}
      onElegir={elegir}
    />
  );

  return (
    <Popover open={abierto && laptop} onOpenChange={cambiar}>
      <PopoverAnchor asChild>
        <div>
          <Input
            inputMode="numeric"
            autoComplete="off"
            placeholder="dd/mm/aaaa"
            maxLength={10}
            readOnly={readOnly}
            {...props}
            value={value}
            onChange={(e) => onValueChange(e.currentTarget.value)}
            trailing={
              <PopoverTrigger asChild>
                <Button
                  ref={boton}
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon
                  aria-label="Elegir fecha"
                  aria-haspopup="dialog"
                  aria-disabled={readOnly || undefined}
                  className="-mr-2"
                >
                  <Calendar aria-hidden="true" />
                </Button>
              </PopoverTrigger>
            }
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        role="dialog"
        aria-label="Elegir fecha de entrega"
        className="w-auto p-3"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={volverAlBoton}
      >
        {calendario}
      </PopoverContent>
      <Sheet open={abierto && !laptop} onOpenChange={cambiar}>
        <SheetContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={volverAlBoton}
        >
          <SheetHeader>
            <SheetTitle>Elegir fecha</SheetTitle>
            <SheetDescription className="sr-only">
              Usa las flechas para moverte por los días y Enter para elegir.
            </SheetDescription>
          </SheetHeader>
          {calendario}
        </SheetContent>
      </Sheet>
    </Popover>
  );
}

function Calendario({
  limites,
  seleccion,
  denso,
  onElegir,
}: {
  limites: Limites;
  seleccion: string | null;
  /** Popover de laptop (celdas de 36) o hoja táctil (celdas de 44). */
  denso: boolean;
  onElegir: (iso: string) => void;
}) {
  const { hoy } = limites;
  const [foco, setFoco] = React.useState(() => focoInicial(seleccion, limites));
  const [mes, setMes] = React.useState<Mes>(() => mesDe(foco));
  const celdas = React.useRef<HTMLTableElement>(null);
  const moverDom = React.useRef(true); // al abrir, el foco va al día
  const titulo = React.useId();

  React.useEffect(() => {
    if (!moverDom.current) return;
    moverDom.current = false;
    celdas.current?.querySelector<HTMLElement>(`[data-iso="${foco}"]`)?.focus();
  }, [foco]);

  function irA(iso: string, conFoco: boolean) {
    moverDom.current = conFoco;
    setFoco(iso);
    setMes(mesDe(iso));
  }
  function mesAdyacente(n: -1 | 1) {
    if (!hayMes(mes, n, limites)) return;
    // El foco conserva el día (recortado al mes) pero dentro del rango elegible
    irA(acotar(sumarMeses(foco, n), limites), false);
  }
  function alTeclear(e: React.KeyboardEvent) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const destino = moverFoco(foco, e.key, limites, e.shiftKey);
    if (!destino) return;
    e.preventDefault();
    irA(destino, true);
  }

  const semanas = semanasDelMes(mes);
  const alto = denso ? "h-9" : "h-11";

  return (
    <div className={cn("flex flex-col gap-2", denso && "w-63")}>
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon
          aria-label="Mes anterior"
          aria-disabled={!hayMes(mes, -1, limites) || undefined}
          onClick={() => mesAdyacente(-1)}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <h2
          id={titulo}
          aria-live="polite"
          className="text-body-strong text-text"
        >
          {tituloMes(mes)}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon
          aria-label="Mes siguiente"
          aria-disabled={!hayMes(mes, 1, limites) || undefined}
          onClick={() => mesAdyacente(1)}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
      {/* biome-ignore-start lint/a11y/noNoninteractiveElementToInteractiveRole: cuadrícula de fecha (APG) */}
      {/* biome-ignore-start lint/a11y/useSemanticElements: cuadrícula de fecha (APG) */}
      <table
        ref={celdas}
        role="grid"
        aria-labelledby={titulo}
        onKeyDown={alTeclear}
        className="w-full table-fixed border-separate border-spacing-0"
      >
        <thead>
          <tr>
            {DIAS_SEMANA.map((d) => (
              <th
                key={d.largo}
                scope="col"
                aria-label={d.largo}
                className={cn(
                  "text-eyebrow font-medium text-text-2 normal-case",
                  alto,
                )}
              >
                {d.corto}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {semanas.map((semana) => (
            <tr key={semana[0]}>
              {semana.map((iso) => {
                if (mesDe(iso).mes !== mes.mes) return <td key={iso} />;
                const elegido = iso === seleccion;
                const deshabilitado = diaDeshabilitado(iso, limites);
                return (
                  // biome-ignore lint/a11y/useAriaPropsSupportedByRole: la celda de una tabla con role="grid" es un gridcell
                  <td
                    key={iso}
                    aria-selected={elegido}
                    className="p-0 text-center"
                  >
                    <button
                      type="button"
                      data-iso={iso}
                      tabIndex={iso === foco ? 0 : -1}
                      aria-label={etiquetaDia(iso, hoy)}
                      aria-disabled={deshabilitado || undefined}
                      aria-current={iso === hoy ? "date" : undefined}
                      onClick={() => {
                        if (deshabilitado) return;
                        onElegir(iso);
                      }}
                      className={cn(
                        "w-full cursor-pointer rounded-nav text-body tabular-nums",
                        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
                        alto,
                        elegido
                          ? "bg-accent font-semibold text-on-accent"
                          : "text-text hover:bg-accent-soft",
                        // Hoy: aro (no solo color); sobre el relleno del acento, aro claro
                        iso === hoy &&
                          (elegido
                            ? "ring-2 ring-surface ring-inset"
                            : "ring-2 ring-accent-ink ring-inset"),
                        deshabilitado &&
                          "cursor-not-allowed text-text-dis hover:bg-transparent",
                      )}
                    >
                      {Number(iso.slice(8))}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {/* biome-ignore-end lint/a11y/useSemanticElements: fin */}
      {/* biome-ignore-end lint/a11y/noNoninteractiveElementToInteractiveRole: fin */}
    </div>
  );
}

export { DatePicker };
