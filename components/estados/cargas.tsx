import { CargaLenta } from "./carga-lenta";
import {
  SkEncabezado,
  SkLista,
  SkMetricas,
  SkPreguntas,
  SkPuntos,
  SkRanking,
  SkTabla,
} from "./skeletons";

/*
 * Carga de cada pantalla (`loading.tsx`, D167): la forma de sus secciones, en el orden del DOM de
 * la página real, más el aviso de carga lenta. Vive dentro del shell (la navegación sigue usable).
 */

/** Inicio del estudiante: misma grilla `g-home` que `HomeGrid`. */
export function CargaInicio() {
  return (
    <>
      <SkEncabezado />
      <div className="g-home max-md:gap-6">
        <div className="flex min-w-0 flex-col gap-6">
          <SkPuntos />
          <SkLista label="Cargando notas" />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <SkLista
            label="Cargando tareas por entregar"
            pildora={false}
            filas={2}
          />
          <SkLista label="Cargando tu equipo" pildora={false} filas={2} />
        </div>
      </div>
      <CargaLenta />
    </>
  );
}

/** Listas con encabezado: Mis notas, Tareas, Tareas del profe, Premios, Mi equipo. */
export function CargaLista({
  label,
  pildora = true,
  filas = 5,
}: {
  label: string;
  pildora?: boolean;
  filas?: number;
}) {
  return (
    <>
      <SkEncabezado />
      <SkLista label={label} pildora={pildora} filas={filas} titulo={false} />
      <CargaLenta />
    </>
  );
}

/** Detalle con preguntas: Detalle de nota, Tarea, Evaluar entrega, constructor. */
export function CargaDetalle({ label }: { label: string }) {
  return (
    <>
      <SkEncabezado linea={false} />
      <SkPreguntas label={label} />
      <CargaLenta />
    </>
  );
}

export function CargaRanking() {
  return (
    <>
      <SkEncabezado linea={false} />
      <SkRanking />
      <CargaLenta />
    </>
  );
}

/** Tablas del profesor: Alumnos, Equipos, Puntos. */
export function CargaTabla({ label }: { label: string }) {
  return (
    <>
      <SkEncabezado linea={false} />
      <SkTabla label={label} />
      <CargaLenta />
    </>
  );
}

/** Panel del profesor: cifras + entregas por evaluar + ajustes recientes. */
export function CargaPanel() {
  return (
    <>
      <SkEncabezado />
      <SkMetricas label="Cargando el resumen" />
      {/* Mismo estiramiento que el Panel real (`panel-view.tsx`): las dos tarjetas a la misma altura */}
      <div className="g-home max-md:gap-6 lg:items-stretch!">
        <SkLista label="Cargando entregas por evaluar" />
        <SkLista label="Cargando ajustes recientes" pildora={false} />
      </div>
      <CargaLenta />
    </>
  );
}

/** Perfil (estudiante y profe): bloques de ajustes. */
export function CargaPerfil() {
  return (
    <>
      <SkEncabezado linea={false} />
      <SkLista label="Cargando tu perfil" pildora={false} filas={2} />
      <SkLista label="Cargando apariencia" pildora={false} filas={2} />
      <CargaLenta />
    </>
  );
}
