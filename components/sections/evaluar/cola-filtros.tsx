"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId } from "react";
import { SelectorSeccion } from "@/components/sections/shared/selector-seccion";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  FILTRO_TIPO_TEXTO,
  type FiltrosEvaluar,
  hayFiltros,
  rutaCola,
} from "@/lib/evaluar-datos";

/** PROVISIONAL (CONTENT_CHECKLIST fila 197): rótulos y opciones de los filtros de la cola. */
const TODOS = "todos";
const TODAS_SECCIONES = "todas";
const TIPO_TODAS = "Todas";
const TAREA_TODAS = "Todas las tareas";
const ALUMNO_TODOS = "Todos los alumnos";

export type OpcionFiltro = { valor: string; texto: string };

/**
 * Filtros de la cola de Evaluar (D384): Tipo, Sección, Tarea y Alumno. Viven en la URL: cada
 * cambio hace `router.replace` a `/profe/evaluar?…` y la cola se vuelve a leer en el servidor.
 * Las opciones de Tarea y Alumno salen de las entregas por evaluar (`useId` une cada rótulo
 * visible con su control).
 */
export function ColaFiltros({
  filtros,
  secciones,
  tareas,
  alumnos,
}: {
  filtros: FiltrosEvaluar;
  secciones: readonly string[];
  tareas: readonly OpcionFiltro[];
  alumnos: readonly OpcionFiltro[];
}) {
  const router = useRouter();
  const id = useId();
  const cambiar = (parcial: Partial<Record<keyof FiltrosEvaluar, string>>) => {
    const sig: FiltrosEvaluar = { ...filtros };
    for (const [k, v] of Object.entries(parcial)) {
      const clave = k as keyof FiltrosEvaluar;
      if (v === undefined || v === TODOS || v === TODAS_SECCIONES)
        delete sig[clave];
      else (sig as Record<string, string>)[clave] = v;
    }
    router.replace(rutaCola(sig), { scroll: false });
  };

  const rotuloTipo = `${id}-tipo`;
  const rotuloSeccion = `${id}-seccion`;
  const rotuloTarea = `${id}-tarea`;
  const rotuloAlumno = `${id}-alumno`;
  const seccionesTodas =
    filtros.seccion && !secciones.includes(filtros.seccion)
      ? [...secciones, filtros.seccion]
      : secciones;

  return (
    <section
      // PROVISIONAL (CONTENT_CHECKLIST fila 197)
      aria-label="Filtrar la cola"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="flex min-w-0 flex-col gap-2">
        <span id={rotuloTipo} className="text-small-b text-text">
          Tipo
        </span>
        <ToggleGroup
          aria-labelledby={rotuloTipo}
          value={filtros.tipo ?? TODOS}
          onValueChange={(v) => cambiar({ tipo: v })}
          block
        >
          <ToggleGroupItem value={TODOS}>{TIPO_TODAS}</ToggleGroupItem>
          <ToggleGroupItem value="individual">
            {FILTRO_TIPO_TEXTO.individual}
          </ToggleGroupItem>
          <ToggleGroupItem value="grupal">
            {FILTRO_TIPO_TEXTO.grupal}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <span id={rotuloSeccion} className="text-small-b text-text">
          Sección
        </span>
        <SelectorSeccion
          labelledBy={rotuloSeccion}
          secciones={seccionesTodas}
          valor={filtros.seccion ?? TODAS_SECCIONES}
          todas={{ valor: TODAS_SECCIONES, texto: TIPO_TODAS }}
          onCambio={(v) => cambiar({ seccion: v })}
          className="sm:w-full"
        />
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <span id={rotuloTarea} className="text-small-b text-text">
          Tarea
        </span>
        <FiltroSelect
          labelledBy={rotuloTarea}
          valor={filtros.tarea ?? TODOS}
          todos={TAREA_TODAS}
          opciones={tareas}
          onCambio={(v) => cambiar({ tarea: v })}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <span id={rotuloAlumno} className="text-small-b text-text">
          Alumno
        </span>
        <FiltroSelect
          labelledBy={rotuloAlumno}
          valor={filtros.alumno ?? TODOS}
          todos={ALUMNO_TODOS}
          opciones={alumnos}
          onCambio={(v) => cambiar({ alumno: v })}
        />
      </div>

      {hayFiltros(filtros) ? (
        <div className="sm:col-span-2 lg:col-span-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.replace(rutaCola(), { scroll: false })}
          >
            <X aria-hidden="true" />
            Quitar filtros
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function FiltroSelect({
  labelledBy,
  valor,
  todos,
  opciones,
  onCambio,
}: {
  labelledBy: string;
  valor: string;
  todos: string;
  opciones: readonly OpcionFiltro[];
  onCambio: (v: string) => void;
}) {
  return (
    <Select value={valor} onValueChange={onCambio}>
      <SelectTrigger aria-labelledby={labelledBy} className="w-full min-w-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={TODOS}>{todos}</SelectItem>
        {opciones.map((o) => (
          <SelectItem key={o.valor} value={o.valor}>
            {o.texto}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
