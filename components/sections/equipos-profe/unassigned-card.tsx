"use client";

import { TriangleAlert } from "lucide-react";
import { UserAvatar } from "@/components/krea/user-avatar";
import { MemberMenu } from "@/components/sections/equipos-profe/member-menu";
import { Card } from "@/components/ui/card";
import type { DicebearEstilo } from "@/lib/dicebear";
import {
  type DestinoMover,
  SIN_EQUIPO_NOTA,
  SIN_EQUIPO_VACIO,
  sinEquipoTitulo,
} from "@/lib/equipos-profe";

export type AlumnoFila = {
  cedula: string;
  nombre: string;
  /** Avatar del perfil (D191); sin él, el de por defecto con la cédula (vista previa). */
  estilo?: DicebearEstilo;
  seed?: string;
};

/**
 * Card «Sin equipo» (HANDOFF §3 Equipos): borde interior de 2 px `--warning` (el aviso lleva
 * además ícono, título y nota: el estado no va solo en el color). Filas con «Asignar…», que abre
 * el mismo menú que el de las tarjetas.
 */
export function UnassignedCard({
  alumnos,
  equipos,
  onMover,
  tituloId,
}: {
  alumnos: readonly AlumnoFila[];
  equipos: readonly DestinoMover[];
  onMover: (cedula: string, destino: string | null) => void;
  tituloId: string;
}) {
  return (
    <Card
      className="flex flex-col gap-4 ring-2 ring-warning ring-inset"
      role="region"
      aria-labelledby={tituloId}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2
          id={tituloId}
          tabIndex={-1}
          className="text-h2 flex icono-linea gap-2 text-text outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <TriangleAlert aria-hidden="true" className="size-6 text-warning" />
          {sinEquipoTitulo(alumnos.length)}
        </h2>
        <p className="text-small text-text-2">{SIN_EQUIPO_NOTA}</p>
      </div>
      {alumnos.length === 0 ? (
        <p className="text-body text-text-2">{SIN_EQUIPO_VACIO}</p>
      ) : (
        <ul className="m-0 grid list-none grid-cols-1 gap-x-6 gap-y-2 p-0 md:grid-cols-2 lg:grid-cols-3">
          {alumnos.map((a) => (
            <li key={a.cedula} className="flex min-h-11 items-center gap-3">
              <UserAvatar
                estilo={a.estilo ?? "adventurer-neutral"}
                seed={a.seed ?? a.cedula}
                nombre={a.nombre}
                size={32}
              />
              <span className="text-body-strong min-w-0 flex-1 text-text">
                {a.nombre}
              </span>
              <MemberMenu
                nombre={a.nombre}
                origen={null}
                equipos={equipos}
                onMover={(d) => onMover(a.cedula, d)}
              />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
