"use client";

import { CircleAlert, Pencil, Upload } from "lucide-react";
import { useId, useRef } from "react";
import { CaptainBadge } from "@/components/krea/status-badge";
import { TeamLogo } from "@/components/krea/team-logo";
import { UserAvatar } from "@/components/krea/user-avatar";
import { MemberMenu } from "@/components/sections/equipos-profe/member-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CAPITAN_AYUDA,
  chipPuestoTexto,
  type DestinoMover,
  EQUIPO_VACIO,
  LOGO_ACCEPT,
  logoLabel,
  metaEquipoTexto,
} from "@/lib/equipos-profe";

export type MiembroTarjeta = { cedula: string; nombre: string };

export type DatosTarjeta = {
  id: string;
  nombre: string;
  tema: string | null;
  puesto: number;
  puntos: number;
  empate: boolean;
};

/**
 * Tarjeta de equipo (HANDOFF §3 Equipos): logo 72 con «Subir logo»/«Cambiar» debajo, nombre h3,
 * tema y número, chip de puesto, Select «Capitán» (oculto con 0 o 1 integrante: con 1 es capitán
 * automático) y la lista de integrantes con su menú «Mover a…». `miembros` llega con el capitán
 * primero. El h3 es enfocable (`tabIndex=-1`): el tablero le lleva el foco tras mover (D111).
 */
export function TeamCard({
  equipo,
  miembros,
  capitan,
  equipos,
  logoSrc,
  logoError,
  tituloId,
  onLogo,
  onCapitan,
  onMover,
  capitanFemenino = false,
}: {
  equipo: DatosTarjeta;
  miembros: readonly MiembroTarjeta[];
  capitan: string | null;
  /** Todos los equipos de la sección, para el menú. */
  equipos: readonly DestinoMover[];
  logoSrc?: string;
  logoError?: string;
  tituloId: string;
  onLogo: (file: File) => void;
  onCapitan: (cedula: string) => void;
  onMover: (cedula: string, destino: string | null) => void;
  /** Género del capitán (D075): por defecto «Capitán», no se infiere del nombre. */
  capitanFemenino?: boolean;
}) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  const accion = logoSrc ? "Cambiar" : "Subir logo";
  const Icono = logoSrc ? Pencil : Upload;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <div className="flex shrink-0 flex-col items-center gap-2">
          <TeamLogo
            teamId={equipo.id}
            tema={equipo.tema ?? equipo.nombre}
            src={logoSrc}
            size={72}
          />
          <input
            ref={inputRef}
            type="file"
            hidden
            accept={LOGO_ACCEPT}
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              const f = e.currentTarget.files?.[0];
              // Permite elegir el mismo archivo otra vez
              e.currentTarget.value = "";
              if (f) onLogo(f);
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            aria-label={logoLabel(accion, equipo.nombre)}
            aria-describedby={logoError ? errorId : undefined}
            onClick={() => inputRef.current?.click()}
          >
            <Icono aria-hidden="true" className="size-4" />
            {accion}
          </Button>
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
          <h3
            id={tituloId}
            tabIndex={-1}
            className="text-h3 text-text outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {equipo.nombre}
          </h3>
          <p className="text-small text-text-2">
            {metaEquipoTexto(equipo.tema, miembros.length)}
          </p>
          <Badge variant="acc" className="nums">
            {chipPuestoTexto(equipo.puesto, equipo.puntos, equipo.empate)}
          </Badge>
        </div>
      </div>

      {logoError ? (
        <p
          id={errorId}
          role="alert"
          className="text-small-b flex items-start gap-1.5 text-error"
        >
          <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
          <span>{logoError}</span>
        </p>
      ) : null}

      {miembros.length > 1 && capitan ? (
        <Field
          label="Capitán"
          controlId={`${inputId}-capitan`}
          help={CAPITAN_AYUDA}
        >
          <Select value={capitan} onValueChange={onCapitan}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {miembros.map((m) => (
                <SelectItem key={m.cedula} value={m.cedula}>
                  {m.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      ) : null}

      {miembros.length === 0 ? (
        <p className="text-small text-text-2">{EQUIPO_VACIO}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {miembros.map((m) => (
            <li
              key={m.cedula}
              className="flex min-h-11 items-center gap-3 border-b border-divider py-1 last:border-b-0"
            >
              <UserAvatar
                estilo="adventurer-neutral"
                seed={m.cedula}
                nombre={m.nombre}
                size={32}
              />
              <span className="text-body-strong min-w-0 flex-1 text-text">
                {m.nombre}
              </span>
              {m.cedula === capitan ? (
                <CaptainBadge femenino={capitanFemenino} className="h-6" />
              ) : null}
              <MemberMenu
                nombre={m.nombre}
                origen={equipo.id}
                equipos={equipos}
                onMover={(d) => onMover(m.cedula, d)}
              />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
