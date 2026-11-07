import {
  Gift,
  Pencil,
  Trash2,
  TriangleAlert,
  Trophy,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { MeterBar } from "@/components/krea/meter-bar";
import { StatusBadge } from "@/components/krea/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cardVariants } from "@/components/ui/card";
import { rutaAlumnos } from "@/lib/alumnos";
import {
  barraEvaluadas,
  eliminarTareaLabel,
  evaluarLabel,
  evaluarTexto,
  metaTarea,
  RUTA_EVALUAR,
  rutaTarea,
  sumaChip,
  type TareaProfe,
} from "@/lib/tareas-profe";
import { cn } from "@/lib/utils";

/** Id del título de una tarjeta: la lista le lleva el foco tras eliminar la anterior. */
export const tituloTareaId = (id: string) => `tarea-${id}-titulo`;

/*
 * Tarjeta fila de una tarea (HANDOFF §3 Tareas del profesor; lienzo TareasProfe): chips de estado,
 * tipo y premio (siempre con ícono + palabra), título, meta, barra de evaluadas (máx. 320) y las
 * acciones según el estado. Las acciones son enlaces con nombre que incluye la tarea; la tarjeta
 * no es un enlace (D100: tiene varios interactivos). El título es `h2` con tamaño h3, como el
 * lienzo, para no saltar niveles bajo el `<h1>` (D115). Las acciones van arriba, alineadas con
 * la fila de chips (que toma el alto de un botón), y al final; si no caben, debajo (D244).
 * «Eliminar» (ícono, `--error`) está en todos los estados y lo confirma la lista (D243).
 */
export function TeacherTaskCard({
  tarea,
  hoy,
  ref,
  saliendo = false,
  onEliminar,
}: {
  tarea: TareaProfe;
  /** Día civil ISO para "vence" / "venció". */
  hoy: string;
  /** El `<li>`: la lista lo mide (FLIP) y anima su salida. */
  ref?: React.Ref<HTMLLIElement>;
  /** Ya eliminada y animando su salida: fuera del árbol de accesibilidad y del teclado. */
  saliendo?: boolean;
  /** Abre la confirmación; recibe el botón para devolverle el foco al cancelar. */
  onEliminar?: (boton: HTMLButtonElement) => void;
}) {
  const chipSuma = sumaChip(tarea);
  const barra = barraEvaluadas(tarea);
  const editar = rutaTarea(tarea.id);
  // Chips largos (premios) envuelven en vez de desbordar a 320
  const chipLargo = "h-auto min-h-7 py-1 whitespace-normal";

  return (
    <li
      ref={ref}
      inert={saliendo || undefined}
      className={cn(cardVariants(), "flex flex-wrap items-start gap-4")}
    >
      <div className="flex min-w-[min(--spacing(60),100%)] flex-1 flex-col gap-2">
        {/* Alto de un botón `sm` (36 · 44 < lg): los chips quedan centrados con las acciones */}
        <div className="flex min-h-9 flex-wrap items-center gap-2 max-lg:min-h-11">
          <StatusBadge status={tarea.estado} />
          <Badge>
            {tarea.tipo === "grupal" ? (
              <Users aria-hidden="true" />
            ) : (
              <User aria-hidden="true" />
            )}
            {tarea.tipo === "grupal" ? "Grupal" : "Individual"}
          </Badge>
          {tarea.premio ? (
            <Badge variant="prize" className={chipLargo}>
              {tarea.estado === "evaluada" ? (
                <Trophy aria-hidden="true" />
              ) : (
                <Gift aria-hidden="true" />
              )}
              <span className="sr-only">Premio: </span>
              {tarea.premio}
            </Badge>
          ) : null}
          {chipSuma ? (
            <Badge variant="warn">
              <TriangleAlert aria-hidden="true" />
              {chipSuma}
            </Badge>
          ) : null}
        </div>
        {/* `tabIndex={-1}`: recibe el foco cuando se elimina la tarjeta anterior */}
        <h2
          id={tituloTareaId(tarea.id)}
          tabIndex={-1}
          className="text-h3 text-text"
        >
          {tarea.titulo}
        </h2>
        <p className="text-small nums text-text-2">{metaTarea(tarea, hoy)}</p>
        {barra !== null ? (
          <MeterBar pct={barra} tone="accent" className="h-2 max-w-80" />
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tarea.estado === "abierta" && tarea.porEvaluar > 0 ? (
          <Button asChild variant="secondary" size="sm">
            <Link
              href={RUTA_EVALUAR}
              aria-label={evaluarLabel(tarea.porEvaluar, tarea.titulo)}
            >
              {evaluarTexto(tarea.porEvaluar)}
            </Link>
          </Button>
        ) : null}
        {tarea.estado === "abierta" ? (
          <Button asChild variant="ghost" size="sm" icon>
            <Link href={editar} aria-label={`Editar ${tarea.titulo}`}>
              <Pencil aria-hidden="true" />
            </Link>
          </Button>
        ) : null}
        {tarea.estado === "borrador" ? (
          <Button asChild variant="secondary" size="sm">
            <Link href={editar} aria-label={`Seguir editando ${tarea.titulo}`}>
              Seguir editando
            </Link>
          </Button>
        ) : null}
        {tarea.estado === "evaluada" ? (
          <Button asChild variant="ghost" size="sm">
            <Link
              href={rutaAlumnos({ tarea: tarea.id })}
              aria-label={`Ver notas de ${tarea.titulo}`}
            >
              Ver notas
            </Link>
          </Button>
        ) : null}
        {onEliminar ? (
          <Button
            type="button"
            variant="ghost-danger"
            size="sm"
            icon
            aria-haspopup="dialog"
            aria-label={eliminarTareaLabel(tarea.titulo)}
            onClick={(e) => onEliminar(e.currentTarget)}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </li>
  );
}
