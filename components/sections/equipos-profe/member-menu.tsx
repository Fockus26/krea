"use client";

import { ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  type DestinoMover,
  moverLabel,
  opcionesMover,
} from "@/lib/equipos-profe";

/**
 * Menú «Mover a…» (HANDOFF §2.13): los otros equipos de la sección y, si el alumno tiene equipo,
 * «Quitar del equipo» en `--error` tras un separador. Dos disparadores: botón de ícono en las
 * tarjetas (`origen` = su equipo) y «Asignar…» en Sin equipo (`origen` = null). El menú no
 * mueve el foco: lo hace el tablero, porque el botón puede dejar de existir.
 */
export function MemberMenu({
  nombre,
  origen,
  equipos,
  onMover,
}: {
  nombre: string;
  origen: string | null;
  equipos: readonly DestinoMover[];
  onMover: (destino: string | null) => void;
}) {
  const { destinos, puedeQuitar } = opcionesMover(equipos, origen);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {origen === null ? (
          <Button variant="secondary" size="sm">
            Asignar…
            <span className="sr-only"> a {nombre} a un equipo</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            icon
            aria-label={moverLabel(nombre)}
          >
            <ArrowRightLeft aria-hidden="true" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        // El foco lo lleva el tablero (la fila puede dejar de existir)
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuLabel>Mover a…</DropdownMenuLabel>
        {destinos.map((d) => (
          <DropdownMenuItem key={d.id} onSelect={() => onMover(d.id)}>
            {d.nombre}
          </DropdownMenuItem>
        ))}
        {puedeQuitar ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => onMover(null)}
            >
              Quitar del equipo
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
