"use client";

import { Clock, X } from "lucide-react";
import * as React from "react";
import { useLaptop } from "@/components/krea/date-picker";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatHora } from "@/lib/fecha";
import {
  cambiarPieza,
  HORAS_12,
  minutosConGuardado,
  type Periodo,
  partesDeHora,
} from "@/lib/reloj";
import { QUITAR_HORA } from "@/lib/tareas-profe";
import { cn } from "@/lib/utils";

/*
 * Selector de hora propio (D361; reemplaza el `type="time"` nativo de D353): el campo muestra la
 * hora elegida («3:30 p. m.») o «Sin hora», y el reloj abre un panel con tres grupos: hora (1–12),
 * minutos (de 5 en 5) y a. m./p. m. Mismo contenedor que el calendario (D283): popover ≥ 1024 y
 * hoja inferior < 1024. Cada grupo es un `radiogroup` con un solo elemento en el orden de
 * tabulación; las flechas mueven y eligen (←/→ de a uno, ↑/↓ de fila en fila). Elegir cambia el
 * valor al momento; «Listo» o Esc cierran y el foco vuelve al botón del reloj. El valor sigue
 * siendo "HH:MM" en 24 h o "" (sin hora, D352).
 */

type TimePickerProps = Omit<
  InputProps,
  "value" | "onChange" | "leading" | "trailing" | "type"
> & {
  /** "HH:MM" (24 h) o "" = sin hora. */
  value: string;
  onValueChange: (valor: string) => void;
};

function TimePicker({
  value,
  onValueChange,
  readOnly,
  ...props
}: TimePickerProps) {
  const laptop = useLaptop();
  const [abierto, setAbierto] = React.useState(false);
  const boton = React.useRef<HTMLButtonElement>(null);
  const campo = React.useRef<HTMLInputElement>(null);

  function cambiar(a: boolean) {
    if (a && readOnly) return;
    setAbierto(a);
  }
  function volverAlBoton(e: Event) {
    e.preventDefault();
    boton.current?.focus();
  }
  const reloj = (
    <Reloj
      value={value}
      onValueChange={onValueChange}
      onListo={() => setAbierto(false)}
    />
  );

  return (
    <Popover open={abierto && laptop} onOpenChange={cambiar}>
      <PopoverAnchor asChild>
        <div>
          <Input
            ref={campo}
            // No se escribe (la hora sale del reloj), pero tampoco es `readOnly`: el Input lo
            // pintaría bloqueado (borde punteado y candado). Solo lo es con la tarea cerrada.
            readOnly={readOnly}
            inputMode="none"
            autoComplete="off"
            placeholder="Sin hora"
            inputClassName={cn(
              "nums caret-transparent",
              !readOnly && "cursor-pointer",
            )}
            {...props}
            value={value ? formatHora(value) : ""}
            onChange={() => {}}
            onBeforeInput={(e) => e.preventDefault()}
            onPaste={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            onClick={() => cambiar(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
                e.preventDefault();
                cambiar(true);
              } else if (e.key === "Backspace" || e.key === "Delete") {
                // Borrar = sin hora (no se edita letra a letra)
                e.preventDefault();
                if (!readOnly) onValueChange("");
              }
            }}
            trailing={
              <span className="-mr-2 flex items-center">
                {value && !readOnly ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon
                    aria-label={QUITAR_HORA}
                    onClick={() => {
                      onValueChange("");
                      // El botón desaparece: el foco vuelve al campo
                      campo.current?.focus();
                    }}
                  >
                    <X aria-hidden="true" />
                  </Button>
                ) : null}
                <PopoverTrigger asChild>
                  <Button
                    ref={boton}
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon
                    aria-label="Elegir hora"
                    aria-haspopup="dialog"
                    aria-disabled={readOnly || undefined}
                  >
                    <Clock aria-hidden="true" />
                  </Button>
                </PopoverTrigger>
              </span>
            }
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        role="dialog"
        aria-label="Elegir hora de entrega"
        className="w-auto p-3"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={volverAlBoton}
      >
        {reloj}
      </PopoverContent>
      <Sheet open={abierto && !laptop} onOpenChange={cambiar}>
        <SheetContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={volverAlBoton}
        >
          <SheetHeader>
            <SheetTitle>Elegir hora</SheetTitle>
            <SheetDescription className="sr-only">
              Elige la hora, los minutos y si es de la mañana o de la tarde. Usa
              las flechas dentro de cada grupo.
            </SheetDescription>
          </SheetHeader>
          {reloj}
        </SheetContent>
      </Sheet>
    </Popover>
  );
}

const COLUMNAS = 4;

function Reloj({
  value,
  onValueChange,
  onListo,
}: {
  value: string;
  onValueChange: (valor: string) => void;
  onListo: () => void;
}) {
  const partes = partesDeHora(value);
  const primero = React.useRef<HTMLDivElement>(null);
  // Al abrir, el foco va a la hora elegida (o a la primera)
  React.useEffect(() => {
    const el =
      primero.current?.querySelector<HTMLButtonElement>('[tabindex="0"]');
    el?.focus();
  }, []);

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 sm:w-72">
      <Rejilla
        ref={primero}
        etiqueta="Hora"
        opciones={HORAS_12.map((h) => ({ valor: h, texto: String(h) }))}
        elegido={partes?.hora ?? null}
        onElegir={(hora) => onValueChange(cambiarPieza(value, { hora }))}
      />
      <Rejilla
        etiqueta="Minutos"
        opciones={minutosConGuardado(value).map((m) => ({
          valor: m,
          texto: `:${String(m).padStart(2, "0")}`,
        }))}
        elegido={partes?.minuto ?? null}
        onElegir={(minuto) => onValueChange(cambiarPieza(value, { minuto }))}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          aria-label="Mañana o tarde"
          value={partes?.periodo ?? ""}
          onValueChange={(v) =>
            onValueChange(cambiarPieza(value, { periodo: v as Periodo }))
          }
        >
          <ToggleGroupItem value="am">a. m.</ToggleGroupItem>
          <ToggleGroupItem value="pm">p. m.</ToggleGroupItem>
        </ToggleGroup>
        <Button type="button" size="sm" onClick={onListo}>
          Listo
        </Button>
      </div>
    </div>
  );
}

type Opcion = { valor: number; texto: string };

const Rejilla = React.forwardRef<
  HTMLDivElement,
  {
    etiqueta: string;
    opciones: readonly Opcion[];
    elegido: number | null;
    onElegir: (valor: number) => void;
  }
>(function Rejilla({ etiqueta, opciones, elegido, onElegir }, ref) {
  const id = React.useId();
  const caja = React.useRef<HTMLDivElement>(null);
  React.useImperativeHandle(ref, () => caja.current as HTMLDivElement);
  const indice = Math.max(
    0,
    opciones.findIndex((o) => o.valor === elegido),
  );

  function alTeclear(e: React.KeyboardEvent, i: number) {
    const paso: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: COLUMNAS,
      ArrowUp: -COLUMNAS,
    };
    let destino: number | null = null;
    if (e.key in paso)
      destino = (i + (paso[e.key] ?? 0) + opciones.length) % opciones.length;
    else if (e.key === "Home") destino = 0;
    else if (e.key === "End") destino = opciones.length - 1;
    if (destino === null) return;
    e.preventDefault();
    const o = opciones[destino];
    if (!o) return;
    onElegir(o.valor);
    caja.current
      ?.querySelectorAll<HTMLButtonElement>("button")
      [destino]?.focus();
  }

  return (
    <div className="flex flex-col gap-2">
      <p id={id} className="text-small-b text-text-2">
        {etiqueta}
      </p>
      <div
        ref={caja}
        role="radiogroup"
        aria-labelledby={id}
        className="grid grid-cols-4 gap-1.5"
      >
        {opciones.map((o, i) => {
          const activo = o.valor === elegido;
          return (
            // biome-ignore lint/a11y/useSemanticElements: radio del patrón APG con botón (estilo de chip)
            <button
              key={o.valor}
              type="button"
              role="radio"
              aria-checked={activo}
              tabIndex={i === indice ? 0 : -1}
              onClick={() => onElegir(o.valor)}
              onKeyDown={(e) => alTeclear(e, i)}
              className={cn(
                "min-h-11 cursor-pointer rounded-nav text-body tabular-nums transition-[background-color] duration-fast ease-krea motion-reduce:transition-none",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                activo
                  ? "bg-accent font-semibold text-on-accent"
                  : "text-text hover:bg-accent-soft",
              )}
            >
              {o.texto}
            </button>
          );
        })}
      </div>
    </div>
  );
});

export { TimePicker };
