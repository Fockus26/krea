"use client";

import { useRef } from "react";
import { UserAvatar } from "@/components/krea/user-avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DicebearEstilo } from "@/lib/dicebear";
import { puntosTexto } from "@/lib/rank-row";

export type Companero = {
  id: string;
  nombre: string;
  equipo?: string;
  puesto: number;
  puntos: number;
  empate: boolean;
  estilo: DicebearEstilo;
  seed: string;
};

/*
 * Tarjeta de solo lectura de un compañero (D259): avatar, nombre, equipo, puesto y puntos. Nunca
 * notas ni nada que el ranking no traiga. Es un diálogo (foco atrapado, Esc, devuelve el foco al
 * botón de la fila). Recibe el compañero ya resuelto contra las filas en vivo: si su puesto cambia
 * con el diálogo abierto, la tarjeta se actualiza sin cerrarse.
 */
export function CompaneroCard({
  companero,
  onCerrar,
}: {
  companero: Companero | null;
  onCerrar: () => void;
}) {
  // Durante la animación de cierre `companero` ya es null: se conserva el último para no vaciarla
  const ultimo = useRef(companero);
  if (companero) ultimo.current = companero;
  const c = companero ?? ultimo.current;
  return (
    <Dialog open={companero !== null} onOpenChange={(o) => !o && onCerrar()}>
      <DialogContent className="max-w-sm items-center text-center">
        {c ? (
          <>
            <UserAvatar
              estilo={c.estilo}
              seed={c.seed}
              nombre={c.nombre}
              size={96}
              ring
            />
            <DialogHeader className="items-center pr-0">
              {/* PROVISIONAL (filas 142–144): copy de la tarjeta del compañero */}
              <DialogTitle>{c.nombre}</DialogTitle>
              <DialogDescription>{c.equipo ?? "Sin equipo"}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge variant="neutral">Puesto {c.puesto}</Badge>
              {c.empate ? <Badge variant="neutral">Empate</Badge> : null}
              <Badge variant="ok">{puntosTexto(c.puntos)}</Badge>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
