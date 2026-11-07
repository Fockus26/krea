"use client";

import { CircleAlert, Pencil, Upload } from "lucide-react";
import { type ReactNode, useId, useRef, useState } from "react";
import { CaptainBadge } from "@/components/krea/status-badge";
import { TeamLogo } from "@/components/krea/team-logo";
import { useFlip } from "@/components/krea/use-flip";
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
import type { DicebearEstilo } from "@/lib/dicebear";
import {
  CAPITAN_AYUDA,
  chipPuestoTexto,
  type DestinoMover,
  EQUIPO_VACIO,
  LOGO_ACCEPT,
  logoLabel,
  metaEquipoTexto,
} from "@/lib/equipos-profe";
import {
  archivoDeEntrada,
  arrastreLlevaArchivos,
  IMAGE_DROP_TEXT,
} from "@/lib/image-entrada";
import { cn } from "@/lib/utils";

export type MiembroTarjeta = {
  cedula: string;
  nombre: string;
  /** Avatar del perfil (D191); sin él, el de por defecto con la cédula (vista previa). */
  estilo?: DicebearEstilo;
  seed?: string;
};

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
  acciones,
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
  /** «Editar» y «Eliminar» del equipo (W12, D270): al pie de la tarjeta. */
  acciones?: ReactNode;
}) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  // Arrastrar y pegar un logo (D246): el archivo va a `onLogo`, que valida con las reglas del logo
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  const accion = logoSrc ? "Cambiar" : "Subir logo";
  const Icono = logoSrc ? Pencil : Upload;
  // Cambiar el capitán reordena (va primero) y mover a alguien aquí lo suma: viaje y entrada (D281)
  const { registrar } = useFlip<HTMLLIElement>({
    duracion: "--d-normal",
    entrada: true,
  });

  return (
    <Card className="flex flex-col gap-4">
      {/* Si la columna del nombre no llega a 8rem (texto grande, D226), baja debajo del logo */}
      <div className="flex flex-wrap items-start gap-4">
        {/* biome-ignore lint/a11y/noStaticElementInteractions: solo recibe el arrastre; la acción accesible es el botón */}
        <div
          className={cn(
            "flex shrink-0 flex-col items-center gap-2 rounded-md border-2 p-1",
            dragging
              ? "border-accent-ink bg-accent-soft"
              : "border-transparent",
          )}
          onDragEnter={(e) => {
            if (!arrastreLlevaArchivos(e.dataTransfer)) return;
            e.preventDefault();
            dragDepth.current += 1;
            setDragging(true);
          }}
          onDragOver={(e) => {
            if (!arrastreLlevaArchivos(e.dataTransfer)) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDragLeave={() => {
            dragDepth.current = Math.max(0, dragDepth.current - 1);
            if (dragDepth.current === 0) setDragging(false);
          }}
          onDrop={(e) => {
            dragDepth.current = 0;
            setDragging(false);
            e.preventDefault();
            const f = archivoDeEntrada(e.dataTransfer);
            if (f) onLogo(f);
          }}
        >
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
            onPaste={(e) => {
              const f = archivoDeEntrada(e.clipboardData);
              if (!f) return;
              e.preventDefault();
              onLogo(f);
            }}
          >
            <Icono aria-hidden="true" className="size-4" />
            {accion}
          </Button>
          <output
            className={
              dragging
                ? "text-small-b max-w-28 text-center text-text"
                : "sr-only"
            }
          >
            {dragging ? IMAGE_DROP_TEXT : ""}
          </output>
        </div>
        <div className="flex min-w-[min(--spacing(32),100%)] flex-1 flex-col items-start gap-1">
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
          {/* Con «empate» o en 320 px no cabe en una línea: envuelve dentro de su columna (D216) */}
          <Badge
            variant="acc"
            className="nums h-auto min-h-7 max-w-full py-1 whitespace-normal"
          >
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
              ref={registrar(m.cedula)}
              className="flex min-h-11 flex-wrap items-center gap-3 border-b border-divider py-1 last:border-b-0"
            >
              <UserAvatar
                estilo={m.estilo ?? "adventurer-neutral"}
                seed={m.seed ?? m.cedula}
                nombre={m.nombre}
                size={32}
              />
              {/* Con texto grande el nombre no baja de 6rem: «Mover a…» pasa a otra línea (D226) */}
              <span className="text-body-strong min-w-[min(--spacing(24),100%)] flex-1 text-text">
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

      {acciones ? (
        <div className="flex flex-wrap justify-end gap-1 border-t border-divider pt-3">
          {acciones}
        </div>
      ) : null}
    </Card>
  );
}
