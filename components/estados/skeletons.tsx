import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/*
 * Skeletons por sección (HANDOFF §2.14; lienzo Vacios.dc.html «Carga · skeleton por sección»;
 * D167). Cada sección es una región `role="status"` con `aria-busy` y `aria-label` («Cargando
 * notas»); los bloques son decorativos (`aria-hidden`, en `Skeleton`). Forma real del contenido,
 * nunca un spinner global. El pulso se queda quieto con movimiento reducido (D027).
 */

/** Región de carga de una sección. */
export function Cargando({
  label,
  className,
  children,
}: {
  /** «Cargando notas» (§2.14). */
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: <output> solo admite contenido en línea y aquí van bloques (tarjetas)
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className={className}
    >
      {children}
    </div>
  );
}

/** Encabezado de página (eyebrow · h1 · línea), como `PageHeader`. */
export function SkEncabezado({ linea = true }: { linea?: boolean }) {
  return (
    <Cargando label="Cargando la página" className="flex flex-col gap-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-56 max-w-full" />
      {linea ? <Skeleton className="h-4 w-80 max-w-full" /> : null}
    </Cargando>
  );
}

/** Tarjeta de puntos (Inicio): sobre `--accent`, bloques claros translúcidos. */
export function SkPuntos() {
  return (
    <Cargando
      label="Cargando tus puntos"
      className="flex flex-col gap-4 rounded-lg bg-accent p-6 shadow-2 dark:shadow-none"
    >
      <Skeleton className="h-3 w-2/5 bg-on-accent/30" />
      <Skeleton className="h-12 w-11/20 bg-on-accent/30" />
      <Skeleton className="h-3 w-4/5 bg-on-accent/30" />
      <Skeleton className="h-11 w-35 rounded-md bg-on-accent/30" />
    </Cargando>
  );
}

const ANCHOS_FILA = [
  ["w-7/10", "w-9/20"],
  ["w-3/5", "w-1/2"],
  ["w-13/20", "w-2/5"],
] as const;

/** Lista de filas título + meta (+ píldora de nota): notas, tareas, integrantes, premios. */
export function SkLista({
  label,
  filas = 3,
  pildora = true,
  titulo = true,
}: {
  label: string;
  filas?: number;
  pildora?: boolean;
  titulo?: boolean;
}) {
  return (
    <Card>
      <Cargando label={label} className="flex flex-col gap-4">
        {titulo ? <Skeleton className="h-5 w-2/5" /> : null}
        {Array.from({ length: filas }, (_, i) => {
          const [a, b] = ANCHOS_FILA[i % ANCHOS_FILA.length];
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: filas fijas, sin orden ni estado
            <div key={i} className="flex items-center gap-4">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className={cn("h-4", a)} />
                <Skeleton className={cn("h-3", b)} />
              </div>
              {pildora ? (
                <Skeleton className="h-11 w-18 shrink-0 rounded-pill" />
              ) : null}
            </div>
          );
        })}
      </Cargando>
    </Card>
  );
}

/** Podio + filas del ranking. */
export function SkRanking({ filas = 4 }: { filas?: number }) {
  return (
    <Card>
      <Cargando label="Cargando ranking" className="flex flex-col gap-4">
        <div className="flex items-end justify-center gap-3">
          <Skeleton className="h-22 w-3/10 rounded-t-md rounded-b-sm" />
          <Skeleton className="h-30 w-3/10 rounded-t-md rounded-b-sm" />
          <Skeleton className="h-16 w-3/10 rounded-t-md rounded-b-sm" />
        </div>
        {Array.from({ length: filas }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: filas fijas, sin orden ni estado
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-7 shrink-0" />
            <Skeleton className="size-10 shrink-0 rounded-pill" />
            <Skeleton className="h-3.5 flex-1" />
            <Skeleton className="h-4 w-10 shrink-0" />
          </div>
        ))}
      </Cargando>
    </Card>
  );
}

/** Tabla del profesor (Alumnos, Equipos, Puntos): cabecera + filas. */
export function SkTabla({
  label,
  filas = 6,
}: {
  label: string;
  filas?: number;
}) {
  return (
    <Card>
      <Cargando label={label} className="flex flex-col gap-3">
        <Skeleton className="h-11 w-full" />
        {Array.from({ length: filas }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: filas fijas, sin orden ni estado
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-pill" />
            <Skeleton className={cn("h-4", ANCHOS_FILA[i % 3][0])} />
            <Skeleton className="ml-auto h-4 w-12 shrink-0" />
          </div>
        ))}
      </Cargando>
    </Card>
  );
}

/** Preguntas (Detalle de nota, Tarea, Evaluar, constructor): tarjetas número + texto. */
export function SkPreguntas({ label, n = 3 }: { label: string; n?: number }) {
  return (
    <Cargando label={label} className="flex flex-col gap-4">
      {Array.from({ length: n }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: tarjetas fijas, sin orden ni estado
        <Card key={i} className="flex items-start gap-3">
          <Skeleton className="size-8 shrink-0 rounded-sm" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className={cn("h-4", ANCHOS_FILA[i % 3][0])} />
            <Skeleton className="h-3 w-full" />
            <Skeleton className={cn("h-3", ANCHOS_FILA[i % 3][1])} />
          </div>
        </Card>
      ))}
    </Cargando>
  );
}

/** Fila de cifras (Panel del profe, cabecera de Mi equipo). */
export function SkMetricas({ label, n = 3 }: { label: string; n?: number }) {
  return (
    <Cargando label={label} className="grid gap-4 sm:grid-cols-3">
      {Array.from({ length: n }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: tarjetas fijas, sin orden ni estado
        <Card key={i} className="flex flex-col gap-3">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-10 w-2/5" />
        </Card>
      ))}
    </Cargando>
  );
}
