"use client";

import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  type EstadoAlumnos,
  type SeccionAlumnos,
  seccionOpcionTexto,
} from "@/lib/alumnos";

const SECCIONES: readonly SeccionAlumnos[] = ["5A", "5C"];

/**
 * Filtros de Alumnos (HANDOFF §3 Alumnos): segmentado de sección con recuentos, búsqueda y
 * contador. El segmentado es un radiogroup (D090); la etiqueta de la búsqueda es `sr-only` (el
 * placeholder repite el texto, como el lienzo) y el contador es la única región `role="status"`:
 * frase completa y estable, no un número suelto.
 */
export function StudentFilters({
  seccion,
  onSeccion,
  conteos,
  consulta,
  onConsulta,
  contador,
  filtroActivo,
}: {
  seccion: SeccionAlumnos;
  onSeccion: (seccion: SeccionAlumnos) => void;
  conteos: Record<SeccionAlumnos, number>;
  consulta: string;
  onConsulta: (consulta: string) => void;
  /** Frase del contador (`contadorTexto`). */
  contador: string;
  /** Filtro que llegó por la URL (estado y/o tarea): chip con «Quitar filtro» (D252). */
  filtroActivo?: {
    estado?: EstadoAlumnos;
    tarea?: string;
    onQuitar: () => void;
  };
}) {
  return (
    <section aria-label="Filtros" className="flex flex-wrap items-center gap-3">
      <ToggleGroup
        aria-label="Sección"
        value={seccion}
        onValueChange={(v) => onSeccion(v as SeccionAlumnos)}
      >
        {SECCIONES.map((s) => (
          <ToggleGroupItem key={s} value={s} className="nums">
            {seccionOpcionTexto(s, conteos[s])}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div className="flex min-w-[min(--spacing(60),100%)] max-w-105 flex-1 flex-col">
        <Label htmlFor="buscar-alumno" className="sr-only">
          Buscar por nombre o cédula
        </Label>
        <Input
          id="buscar-alumno"
          type="search"
          autoComplete="off"
          placeholder="Buscar por nombre o cédula"
          leading={<Search aria-hidden="true" />}
          value={consulta}
          onChange={(e) => onConsulta(e.currentTarget.value)}
        />
      </div>
      <output
        aria-live="polite"
        aria-atomic="true"
        className="text-small text-text-2"
      >
        {contador}
      </output>
      {filtroActivo ? (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral" className="capitalize">
            {[filtroActivo.estado, filtroActivo.tarea]
              .filter(Boolean)
              .join(" · ")}
          </Badge>
          <Button type="button" variant="ghost" size="sm" onClick={filtroActivo.onQuitar}>
            <X aria-hidden="true" />
            Quitar filtro
          </Button>
        </div>
      ) : null}
    </section>
  );
}
