"use client";

import {
  EllipsisVertical,
  Filter,
  Minus,
  Plus,
  Scale,
  Undo2,
} from "lucide-react";
import { useId } from "react";
import { EmptyState } from "@/components/krea/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardList, CardListItem } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { chipAjuste } from "@/lib/panel";
import {
  FILTRO_VACIO,
  type FilaHistorial,
  type FiltroHistorial,
  filtrarHistorial,
  filtrarLabel,
  filtroHistorialTexto,
  filtrosActivos,
  historialMetaTexto,
  MOTIVOS_FILTRO,
  motivoNoAnulable,
  motivoTexto,
  opcionesAjusteLabel,
} from "@/lib/puntos";

const SECCIONES: ReadonlyArray<readonly [FiltroHistorial["seccion"], string]> =
  [
    ["todas", "Ambas secciones"],
    ["5A", "5A"],
    ["5C", "5C"],
  ];
const TIPOS: ReadonlyArray<readonly [FiltroHistorial["tipo"], string]> = [
  ["todos", "Alumnos y equipos"],
  ["alumno", "Solo alumnos"],
  ["equipo", "Solo equipos"],
];

/** Un ítem de radio que no cierra el menú: se pueden combinar los tres filtros de una vez. */
const quedarseAbierto = (e: Event) => e.preventDefault();

/**
 * «Historial» (HANDOFF §3 Ajustes de puntos; D121): filas con chip ± (ícono + texto, no solo color),
 * a quién (h3 con aspecto h4), motivo (+ detalle entre comillas en «Otro»), fecha + profe. «Filtrar»
 * (ghost sm) = menú con sección, tipo y motivo; el filtro activo se dice en un `<output>` de frase estable
 * (D099). Cada fila tiene su menú «Opciones del ajuste de …» con «Anular ajuste»: no borra, crea el inverso.
 */
export function AdjustmentHistory({
  filas,
  filtro,
  onFiltro,
  onAnular,
}: {
  filas: readonly FilaHistorial[];
  filtro: FiltroHistorial;
  onFiltro: (f: FiltroHistorial) => void;
  onAnular: (id: string) => void;
}) {
  const tituloId = useId();
  const visibles = filtrarHistorial(filas, filtro);
  const activos = filtrosActivos(filtro);

  return (
    <Card>
      <section aria-labelledby={tituloId}>
        <CardHeader>
          <h2 id={tituloId} className="text-h3 text-text">
            Historial
          </h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label={filtrarLabel(filtro)}
              >
                <Filter aria-hidden="true" />
                Filtrar
                {activos > 0 ? (
                  <Badge variant="acc" className="nums" aria-hidden="true">
                    {activos}
                  </Badge>
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Sección</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={filtro.seccion}
                onValueChange={(v) =>
                  onFiltro({
                    ...filtro,
                    seccion: v as FiltroHistorial["seccion"],
                  })
                }
              >
                {SECCIONES.map(([v, t]) => (
                  <DropdownMenuRadioItem
                    key={v}
                    value={v}
                    onSelect={quedarseAbierto}
                  >
                    {t}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Ajustado a</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={filtro.tipo}
                onValueChange={(v) =>
                  onFiltro({ ...filtro, tipo: v as FiltroHistorial["tipo"] })
                }
              >
                {TIPOS.map(([v, t]) => (
                  <DropdownMenuRadioItem
                    key={v}
                    value={v}
                    onSelect={quedarseAbierto}
                  >
                    {t}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Motivo</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={filtro.motivo}
                onValueChange={(v) => onFiltro({ ...filtro, motivo: v })}
              >
                <DropdownMenuRadioItem value="todos" onSelect={quedarseAbierto}>
                  Todos los motivos
                </DropdownMenuRadioItem>
                {MOTIVOS_FILTRO.map((m) => (
                  <DropdownMenuRadioItem
                    key={m}
                    value={m}
                    onSelect={quedarseAbierto}
                  >
                    {m}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={activos === 0}
                onSelect={() => onFiltro(FILTRO_VACIO)}
              >
                Quitar filtros
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <output
          aria-live="polite"
          aria-atomic="true"
          className="mb-2 block text-small text-text-2"
        >
          {filtroHistorialTexto(filtro, visibles.length, filas.length)}
        </output>

        {visibles.length === 0 ? (
          <EmptyState
            icon={Scale}
            title={
              filas.length === 0
                ? "Sin ajustes todavía"
                : "Sin ajustes con estos filtros"
            }
            description={
              filas.length === 0
                ? "Los puntos que sumes o restes por conducta aparecen aquí, con su motivo."
                : "Cambia o quita los filtros para ver el resto del historial."
            }
          />
        ) : (
          <CardList>
            {visibles.map((f) => {
              const chip = chipAjuste(f.valor);
              const Signo = chip.signo === "mas" ? Plus : Minus;
              const bloqueo = motivoNoAnulable(f);
              return (
                <CardListItem key={f.id} className="items-start">
                  <Badge
                    variant={chip.signo === "mas" ? "ok" : "err"}
                    className="min-w-13 justify-center nums"
                  >
                    <Signo aria-hidden="true" />
                    <span aria-hidden="true">{chip.texto}</span>
                    <span className="sr-only">{chip.accesible}</span>
                  </Badge>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h3 className="text-h4 break-words text-text">
                        {f.nombre}
                      </h3>
                      {f.anulado ? (
                        <Badge variant="neutral">Anulado</Badge>
                      ) : null}
                    </div>
                    <p className="text-small break-words text-text">
                      {motivoTexto(f)}
                    </p>
                    <p className="text-small break-words text-text-2">
                      {historialMetaTexto(f)}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        icon
                        aria-label={opcionesAjusteLabel(f.nombre)}
                      >
                        <EllipsisVertical aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        variant={bloqueo ? "default" : "destructive"}
                        disabled={bloqueo !== null}
                        onSelect={() => onAnular(f.id)}
                      >
                        <Undo2 aria-hidden="true" />
                        {bloqueo ?? "Anular ajuste"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardListItem>
              );
            })}
          </CardList>
        )}
      </section>
    </Card>
  );
}
