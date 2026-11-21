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
import {
  agregarPremioHref,
  agregarPremioLabel,
  avancePremioTexto,
  COMPARTIR_LABEL,
  compartidoChipTexto,
  type DecisionEmpate,
  darPremioLabel,
  decisionDar,
  editarPremioLabel,
  empateChipTexto,
  ganoTexto,
  menuPremioLabel,
  nombreCortoTitular,
  notaFechaTexto,
  subtituloPremio,
  type TarjetaPremio,
} from "@/lib/premios";
import { cn } from "@/lib/utils";

const CUADRO =
  "grid size-14 shrink-0 place-items-center rounded-done [&_svg]:size-8";

/**
 * Tarjeta de un premio (HANDOFF §3 Premios; lienzo Premios.dc.html): cuadro 56 con ícono decorativo,
 * h3 con el premio, "{tarea} · {sección}" y el estado en un chip con texto. "Por definir" es una
 * tarjeta punteada con el enlace "Agregar premio". Con empate, el menú de la tarjeta deja al profe
 * elegir (HANDOFF §9 #3). Tras decidir, el menú desaparece: el foco pasa al h3 (`tabIndex={-1}`).
 * Individual (D263): los empatados y el ganador son alumnos. Con foto (D265) la tarjeta la
 * muestra firmada, con `alt` = el premio. Con `onEditar` (página real, D266), «Agregar premio» y
 * «Editar premio» abren el diálogo en vez de ir al constructor.
 */
export function PrizeCardTeacher({
  tarjeta,
  nombres,
  onDecidir,
  onEditar,
  liRef,
}: {
  /** Al `<li>`: es lo que el FLIP del tablero traslada (`useFlip().registrar(id)`). */
  liRef?: (el: HTMLLIElement | null) => void;
  tarjeta: TarjetaPremio;
  /** Nombre completo de cada equipo (grupales) y de cada alumno (individuales) por id. */
  nombres: Readonly<Record<string, string>>;
  onDecidir: (id: string, decision: DecisionEmpate) => void;
  onEditar?: (tarjeta: TarjetaPremio) => void;
}) {
  const { estado } = tarjeta;
  const titulo = useRef<HTMLHeadingElement>(null);
  const nombre = (id: string) => nombres[id] ?? id;
  const cortos = (ids: readonly string[]) =>
    ids.map((id) => nombreCortoTitular(tarjeta.tipoTarea, nombre(id)));

  const porDefinir = estado.tipo === "por-definir";
  const titular = tarjeta.premio ?? "Premio por definir";

  return (
    <li ref={liRef} className="flex">
      <Card
        className={cn(
          "flex h-full w-full flex-col gap-4",
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
                {estado.titularIds.map((id) => (
                  <DropdownMenuItem
                    key={id}
                    onSelect={() =>
                      onDecidir(
                        tarjeta.id,
                        decisionDar(tarjeta.tipoTarea ?? "grupal", id),
                      )
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

        {tarjeta.fotoUrl && tarjeta.premio ? (
          // biome-ignore lint/performance/noImgElement: URL firmada de B2 de vida corta (D046, D212)
          <img
            src={tarjeta.fotoUrl}
            alt={tarjeta.premio}
            loading="lazy"
            decoding="async"
            className="aspect-video w-full rounded-md bg-surface-2 object-cover"
          />
        ) : null}

        {estado.tipo === "ganado" ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
            <Badge variant="cap" className="h-auto whitespace-normal">
              <Crown aria-hidden="true" />
              {ganoTexto(nombre(estado.titularId))}
            </Badge>
            <span className="nums text-small text-text-2">
              {notaFechaTexto(estado.nota, estado.fecha)}
            </span>
          </div>
        ) : null}

        {estado.tipo === "compartido" ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
            <Badge variant="cap" className="h-auto whitespace-normal">
              <Users aria-hidden="true" />
              {compartidoChipTexto(cortos(estado.titularIds))}
            </Badge>
            <span className="nums text-small text-text-2">
              {notaFechaTexto(estado.nota, estado.fecha)}
            </span>
          </div>
        ) : null}

        {estado.tipo === "empate" ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
            <Badge variant="warn" className="h-auto whitespace-normal">
              <Scale aria-hidden="true" />
              {empateChipTexto(cortos(estado.titularIds))}
            </Badge>
            <span className="nums text-small text-text-2">
              {notaFechaTexto(estado.nota, estado.fecha)}
            </span>
          </div>
        ) : null}

        {estado.tipo === "en-juego" ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
            <Badge variant="ok" className="h-auto whitespace-normal">
              <Clock aria-hidden="true" />
              En juego
            </Badge>
            <span className="nums text-small text-text-2">
              {avancePremioTexto(
                estado.entregaron,
                estado.total,
                estado.vence,
                tarjeta.tipoTarea,
                { hora: estado.venceHora, vencida: estado.vencida },
              )}
            </span>
          </div>
        ) : null}

        {porDefinir ? (
          // D383: reserva el alto de la fila de estado (chip 28 + gap 8 + meta de 2 líneas) para que, sola
          // en su fila, mida lo mismo que una tarjeta definida sin foto
          <div
            aria-hidden="true"
            className="text-small min-h-[calc(--spacing(7)+--spacing(2)+2lh)]"
          />
        ) : null}

        {onEditar && tarjeta.editable ? (
          // Diálogo de premio (D266): con premio, «Editar premio»; sin él, «Agregar premio»
          <Button
            variant="secondary"
            size="sm"
            className="mt-auto self-start"
            aria-label={
              tarjeta.premio
                ? editarPremioLabel(tarjeta.premio)
                : agregarPremioLabel(tarjeta.tarea)
            }
            onClick={() => onEditar(tarjeta)}
          >
            <Pencil aria-hidden="true" className="size-4" />
            {tarjeta.premio ? "Editar premio" : "Agregar premio"}
          </Button>
        ) : porDefinir ? (
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="mt-auto self-start"
          >
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
