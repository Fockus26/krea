"use client";

import {
  Clock,
  Crown,
  EllipsisVertical,
  Gift,
  Pencil,
  Scale,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TarjetaPremio } from "@/lib/demo/premios";
import {
  agregarPremioHref,
  agregarPremioLabel,
  avancePremioTexto,
  COMPARTIR_LABEL,
  compartidoChipTexto,
  type DecisionEmpate,
  darPremioLabel,
  empateChipTexto,
  ganoTexto,
  menuPremioLabel,
  nombreCortoEquipo,
  notaFechaTexto,
  subtituloPremio,
} from "@/lib/premios";
import { cn } from "@/lib/utils";

const CUADRO =
  "grid size-14 shrink-0 place-items-center rounded-done [&_svg]:size-8";

/**
 * Tarjeta de un premio (HANDOFF §3 Premios; lienzo Premios.dc.html): cuadro 56 con ícono decorativo,
 * h3 con el premio, "{tarea} · {sección}" y el estado en un chip con texto. "Por definir" es una
 * tarjeta punteada con el enlace "Agregar premio". Con empate, el menú de la tarjeta deja al profe
 * elegir (HANDOFF §9 #3). Tras decidir, el menú desaparece: el foco pasa al h3 (`tabIndex={-1}`).
 */
export function PrizeCardTeacher({
  tarjeta,
  nombres,
  onDecidir,
}: {
  tarjeta: TarjetaPremio;
  /** Nombre completo de cada equipo por id. */
  nombres: Readonly<Record<string, string>>;
  onDecidir: (id: string, decision: DecisionEmpate) => void;
}) {
  const { estado } = tarjeta;
  const titulo = useRef<HTMLHeadingElement>(null);
  const nombre = (id: string) => nombres[id] ?? id;
  const cortos = (ids: readonly string[]) =>
    ids.map((id) => nombreCortoEquipo(nombre(id)));

  const porDefinir = estado.tipo === "por-definir";
  const titular = tarjeta.premio ?? "Premio por definir";

  return (
    <li className="flex">
      <Card
        className={cn(
          "flex w-full flex-col gap-4",
          porDefinir &&
            "border-2 border-dashed border-input bg-transparent shadow-none dark:border-2",
        )}
      >
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className={cn(
              CUADRO,
              (estado.tipo === "ganado" || estado.tipo === "compartido") &&
                "bg-secondary text-on-secondary",
              (estado.tipo === "en-juego" || estado.tipo === "empate") &&
                "bg-chip-prize text-text",
              porDefinir && "bg-surface-2 text-text-2",
            )}
          >
            {estado.tipo === "ganado" || estado.tipo === "compartido" ? (
              <Trophy />
            ) : (
              <Gift />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h3
              ref={titulo}
              tabIndex={-1}
              className="text-h3 text-text outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              {titular}
            </h3>
            <p className="text-small text-text-2">
              {subtituloPremio(
                tarjeta.tarea,
                tarjeta.seccion,
                tarjeta.borrador,
              )}
            </p>
          </div>
          {estado.tipo === "empate" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  icon
                  aria-label={menuPremioLabel(titular)}
                  className="shrink-0"
                >
                  <EllipsisVertical aria-hidden="true" className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onCloseAutoFocus={(e) => {
                  // El botón del menú ya no existe tras decidir: el foco va al título de la tarjeta
                  e.preventDefault();
                  titulo.current?.focus();
                }}
              >
                {estado.equipoIds.map((id) => (
                  <DropdownMenuItem
                    key={id}
                    onSelect={() =>
                      onDecidir(tarjeta.id, { tipo: "dar", equipoId: id })
                    }
                  >
                    <Crown aria-hidden="true" />
                    {darPremioLabel(nombre(id))}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem
                  onSelect={() => onDecidir(tarjeta.id, { tipo: "compartir" })}
                >
                  <Users aria-hidden="true" />
                  {COMPARTIR_LABEL}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>

        {estado.tipo === "ganado" ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
            <Badge
              variant="cap"
              className="h-auto min-h-7 py-1 whitespace-normal"
            >
              <Crown aria-hidden="true" />
              {ganoTexto(nombre(estado.equipoId))}
            </Badge>
            <span className="nums text-small text-text-2">
              {notaFechaTexto(estado.nota, estado.fecha)}
            </span>
          </div>
        ) : null}

        {estado.tipo === "compartido" ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
            <Badge
              variant="cap"
              className="h-auto min-h-7 py-1 whitespace-normal"
            >
              <Users aria-hidden="true" />
              {compartidoChipTexto(cortos(estado.equipoIds))}
            </Badge>
            <span className="nums text-small text-text-2">
              {notaFechaTexto(estado.nota, estado.fecha)}
            </span>
          </div>
        ) : null}

        {estado.tipo === "empate" ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
            <Badge
              variant="warn"
              className="h-auto min-h-7 py-1 whitespace-normal"
            >
              <Scale aria-hidden="true" />
              {empateChipTexto(cortos(estado.equipoIds))}
            </Badge>
            <span className="nums text-small text-text-2">
              {notaFechaTexto(estado.nota, estado.fecha)}
            </span>
          </div>
        ) : null}

        {estado.tipo === "en-juego" ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
            <Badge
              variant="ok"
              className="h-auto min-h-7 py-1 whitespace-normal"
            >
              <Clock aria-hidden="true" />
              En juego
            </Badge>
            <span className="nums text-small text-text-2">
              {avancePremioTexto(estado.entregaron, estado.total, estado.vence)}
            </span>
          </div>
        ) : null}

        {porDefinir ? (
          <Button asChild variant="secondary" size="sm" className="self-start">
            <Link
              href={agregarPremioHref(tarjeta.tareaId)}
              aria-label={agregarPremioLabel(tarjeta.tarea)}
            >
              <Pencil aria-hidden="true" className="size-4" />
              Agregar premio
            </Link>
          </Button>
        ) : null}
      </Card>
    </li>
  );
}
