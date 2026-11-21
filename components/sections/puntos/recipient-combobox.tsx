"use client";

import { Check, ChevronDown } from "lucide-react";
import * as React from "react";
import { TeamLogo } from "@/components/krea/team-logo";
import { UserAvatar } from "@/components/krea/user-avatar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import {
  type Candidato,
  filtrarCandidatos,
  puntosTexto,
  sinResultadosTexto,
} from "@/lib/puntos";
import { cn } from "@/lib/utils";

function AvatarDe({ c }: { c: Candidato }) {
  return c.avatar.tipo === "alumno" ? (
    <UserAvatar
      estilo={c.avatar.estilo}
      seed={c.avatar.seed}
      nombre={c.nombre}
      size={32}
    />
  ) : (
    <TeamLogo
      teamId={c.id}
      tema={c.avatar.tema}
      src={c.avatar.logo}
      className="size-8"
    />
  );
}

/**
 * Combobox «¿A quién?» (HANDOFF §3 Ajustes de puntos; D118): patrón ARIA 1.2 «combobox con listbox»
 * sobre `Popover` (Radix, no modal). El foco nunca sale del input: las opciones se recorren con
 * `aria-activedescendant` (↓/↑, Inicio/Fin con la lista abierta, Enter elige, Esc cierra sin borrar,
 * Alt+↓ abre). Escribir filtra sin tildes. Fuera del foco el input muestra el nombre elegido.
 * Va dentro de un `Field`: el `Input` toma de él `id`, `aria-describedby` y `aria-invalid`.
 */
export function RecipientCombobox({
  opciones,
  value,
  onChange,
  placeholder,
}: {
  opciones: readonly Candidato[];
  value: string | null;
  onChange: (id: string) => void;
  placeholder: string;
}) {
  const baseId = React.useId();
  const listboxId = `${baseId}-lista`;
  const optionId = (id: string) => `${baseId}-op-${id}`;
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [open, setOpen] = React.useState(false);
  // `null` = no se está escribiendo: el input muestra el nombre elegido
  const [consulta, setConsulta] = React.useState<string | null>(null);
  const [activo, setActivo] = React.useState<string | null>(null);

  const elegido = opciones.find((o) => o.id === value) ?? null;
  const visibles = filtrarCandidatos(opciones, consulta ?? "");
  const activoValido =
    open && activo && visibles.some((o) => o.id === activo) ? activo : null;

  // La opción activa a la vista dentro de la lista (no mueve el foco)
  React.useEffect(() => {
    if (!activoValido) return;
    document
      .getElementById(optionId(activoValido))
      ?.scrollIntoView({ block: "nearest" });
  });

  const abrir = (hacia: "primero" | "ultimo" | "elegido" = "elegido") => {
    setOpen(true);
    const lista = visibles;
    if (hacia === "ultimo") setActivo(lista.at(-1)?.id ?? null);
    else if (hacia === "primero") setActivo(lista[0]?.id ?? null);
    else setActivo(elegido?.id ?? lista[0]?.id ?? null);
  };

  const cerrar = () => {
    setOpen(false);
    setActivo(null);
  };

  const elegir = (c: Candidato) => {
    onChange(c.id);
    setConsulta(null);
    cerrar();
  };

  const mover = (paso: 1 | -1) => {
    if (visibles.length === 0) return;
    const i = visibles.findIndex((o) => o.id === activoValido);
    const sig =
      i === -1
        ? paso === 1
          ? 0
          : visibles.length - 1
        : Math.min(visibles.length - 1, Math.max(0, i + paso));
    setActivo(visibles[sig].id);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open)
          abrir(); // también Alt+↓
        else if (!e.altKey) mover(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) abrir("ultimo");
        else mover(-1);
        break;
      case "Home":
      case "End":
        if (!open || visibles.length === 0) return;
        e.preventDefault();
        setActivo(
          (e.key === "Home" ? visibles[0] : visibles[visibles.length - 1]).id,
        );
        break;
      case "Enter": {
        if (!open) return; // sin lista abierta, Enter envía el formulario
        e.preventDefault();
        const c = visibles.find((o) => o.id === activoValido);
        if (c) elegir(c);
        else cerrar();
        break;
      }
      case "Escape":
        if (!open) return;
        e.preventDefault();
        cerrar(); // no borra lo escrito ni lo elegido
        break;
      case "Tab":
        if (open) cerrar();
        break;
    }
  };

  const textoInput = consulta ?? elegido?.nombre ?? "";
  const dentroDelAncla = (target: EventTarget | null) =>
    target instanceof Node && Boolean(anchorRef.current?.contains(target));

  return (
    <Popover open={open} onOpenChange={(o) => (o ? setOpen(true) : cerrar())}>
      <PopoverAnchor asChild>
        <div ref={anchorRef}>
          <Input
            ref={inputRef}
            type="text"
            role="combobox"
            autoComplete="off"
            spellCheck={false}
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={open ? listboxId : undefined}
            aria-haspopup="listbox"
            aria-activedescendant={
              activoValido ? optionId(activoValido) : undefined
            }
            placeholder={placeholder}
            value={textoInput}
            leading={
              elegido && consulta === null ? <AvatarDe c={elegido} /> : null
            }
            trailing={
              <>
                {elegido && consulta === null ? (
                  <span className="text-small nums text-text-2">
                    {puntosTexto(elegido.puntos)}
                  </span>
                ) : null}
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    "transition-transform duration-fast ease-krea motion-reduce:transition-none",
                    open && "rotate-180",
                  )}
                />
              </>
            }
            onClick={() => (open ? undefined : abrir())}
            onChange={(e) => {
              setConsulta(e.currentTarget.value);
              setOpen(true);
              setActivo(
                filtrarCandidatos(opciones, e.currentTarget.value)[0]?.id ??
                  null,
              );
            }}
            onKeyDown={onKeyDown}
            onBlur={(e) => {
              // Al salir sin elegir, vuelve el nombre elegido (lo escrito no deja un valor a medias)
              if (dentroDelAncla(e.relatedTarget)) return;
              setConsulta(null);
              cerrar();
            }}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        // Lista, no diálogo: el contenedor no es un rol propio (el listbox lo es)
        role="presentation"
        className="w-(--radix-popover-trigger-width)"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if (dentroDelAncla(e.target)) e.preventDefault();
        }}
      >
        {/* Patrón aria-activedescendant: las opciones no reciben foco; el teclado vive en el input */}
        <div
          id={listboxId}
          role="listbox"
          aria-label="Resultados"
          className="flex flex-col"
        >
          {visibles.length === 0 ? (
            // biome-ignore lint/a11y/useFocusableInteractive: opción deshabilitada que solo informa
            <div
              role="option"
              aria-disabled="true"
              aria-selected="false"
              id={`${baseId}-vacio`}
              className="px-2.5 py-2.5 text-small text-text-2"
            >
              {sinResultadosTexto(consulta ?? "")}
            </div>
          ) : (
            visibles.map((c) => {
              const esActivo = c.id === activoValido;
              const esElegido = c.id === value;
              return (
                // biome-ignore lint/a11y/useFocusableInteractive: la opción activa la marca aria-activedescendant
                // biome-ignore lint/a11y/useKeyWithClickEvents: ↓/↑/Enter se manejan en el input
                <div
                  key={c.id}
                  id={optionId(c.id)}
                  role="option"
                  aria-selected={esElegido}
                  data-active={esActivo || undefined}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center gap-2 rounded-nav px-2.5 py-1.5 text-sm font-semibold",
                    "hover:bg-surface-2 data-active:bg-surface-2 data-active:outline-2 data-active:-outline-offset-2 data-active:outline-focus",
                  )}
                  // El foco se queda en el input
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => elegir(c)}
                >
                  <AvatarDe c={c} />
                  <span className="min-w-0 flex-1 break-words">{c.nombre}</span>
                  <span className="shrink-0 text-small nums text-text-2">
                    {puntosTexto(c.puntos)}
                  </span>
                  {/* Elegida = check (no solo color); `aria-selected` lo dice al lector */}
                  <Check
                    aria-hidden="true"
                    className={cn(
                      "size-4 shrink-0 text-accent-ink",
                      !esElegido && "invisible",
                    )}
                  />
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
