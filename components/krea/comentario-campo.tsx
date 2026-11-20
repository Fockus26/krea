"use client";

import { SmilePlus } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { EMOJIS_AULA, insertarEnCursor } from "@/lib/comentarios";

/**
 * Campo de comentario opcional de Evaluar (D445, D446, D448): `Textarea compact autoGrow` (crece
 * con el texto, D262) con `maxLength`, y debajo una fila con el botón «Emoji» y el contador
 * «n / 300». El botón abre un `Popover` con una rejilla fija de emojis (`EMOJIS_AULA`); cada uno
 * es un botón de 44 con `aria-label` en español. Elegir uno lo inserta donde estaba el cursor (o
 * reemplaza la selección), cierra y devuelve el foco al campo con el cursor tras el emoji; Esc
 * cierra y el foco vuelve al botón (Radix). Los que ya no caben en el máximo salen deshabilitados.
 * Va dentro de un `Field` (id, ayuda y error los pone el contexto). Controlado.
 */
export function ComentarioCampo({
  value,
  onChange,
  maxLength,
  emojiEtiqueta,
}: {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  /** `aria-label` del botón «Emoji»: empieza por «Emoji» (lo visible, WCAG 2.5.3). */
  emojiEtiqueta: string;
}) {
  const campo = React.useRef<HTMLTextAreaElement | null>(null);
  const [abierto, setAbierto] = React.useState(false);
  // Cursor a restaurar tras insertar un emoji (al renderizar con el valor nuevo)
  const cursor = React.useRef<number | null>(null);
  const contadorId = React.useId();

  React.useLayoutEffect(() => {
    const el = campo.current;
    const c = cursor.current;
    if (!el || c === null || el.value !== value) return;
    cursor.current = null;
    el.focus();
    el.setSelectionRange(c, c);
  }, [value]);

  const elegir = (emoji: string) => {
    const el = campo.current;
    const r = insertarEnCursor(
      value,
      emoji,
      el?.selectionStart ?? value.length,
      el?.selectionEnd ?? value.length,
      maxLength,
    );
    if (!r) return;
    cursor.current = r.cursor;
    setAbierto(false);
    onChange(r.texto);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Textarea
        ref={campo}
        compact
        autoGrow
        maxLength={maxLength}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        aria-describedby={contadorId}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Popover open={abierto} onOpenChange={setAbierto}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={emojiEtiqueta}
            >
              <SmilePlus aria-hidden="true" />
              {/* PROVISIONAL (CONTENT_CHECKLIST fila 252) */}
              Emoji
            </Button>
          </PopoverTrigger>
          <PopoverContent
            aria-label="Emojis"
            className="w-auto"
            onCloseAutoFocus={(e) => {
              // Tras elegir, el foco ya está en el campo (efecto de arriba): que Radix no lo mueva
              if (
                cursor.current !== null ||
                document.activeElement === campo.current
              )
                e.preventDefault();
            }}
          >
            <ul className="m-0 grid list-none grid-cols-6 gap-0.5 p-0">
              {EMOJIS_AULA.map(({ emoji, nombre }) => (
                <li key={emoji}>
                  <button
                    type="button"
                    aria-label={nombre}
                    disabled={value.length + emoji.length > maxLength}
                    onClick={() => elegir(emoji)}
                    className="grid size-11 place-items-center rounded-nav text-h3 hover:not-disabled:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-75 disabled:grayscale"
                  >
                    <span aria-hidden="true">{emoji}</span>
                  </button>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
        <p id={contadorId} className="text-small nums text-text-2">
          {value.length} / {maxLength}
        </p>
      </div>
    </div>
  );
}
