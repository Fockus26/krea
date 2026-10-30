"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { type SeccionAlumnos, seccionOpcionTexto } from "@/lib/alumnos";

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
}: {
  seccion: SeccionAlumnos;
  onSeccion: (seccion: SeccionAlumnos) => void;
  conteos: Record<SeccionAlumnos, number>;
  consulta: string;
  onConsulta: (consulta: string) => void;
  /** Frase del contador (`contadorTexto`). */
  contador: string;
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
      <div className="flex min-w-60 max-w-105 flex-1 flex-col">
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
    </section>
  );
}
