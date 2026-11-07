import type { ReactNode } from "react";

/**
 * Orden de Inicio (HANDOFF §3 Inicio): < 1024 una columna 1-2-3-4-5 (orden del DOM);
 * ≥ 1024 el saludo arriba a todo el ancho y `g-home` (7/5): izquierda puntos + notas,
 * derecha por entregar + equipo. Entre tarjetas de una columna, 24.
 */
export function HomeGrid({
  saludo,
  mensaje,
  puntos,
  notas,
  pendientes,
  equipo,
}: {
  saludo: ReactNode;
  /** «Mensaje del día» (D274), opcional: va entre el saludo y las tarjetas. */
  mensaje?: ReactNode;
  puntos: ReactNode;
  notas: ReactNode;
  pendientes: ReactNode;
  equipo: ReactNode;
}) {
  return (
    <>
      {saludo}
      {mensaje}
      <div className="g-home max-md:gap-6">
        <div className="flex min-w-0 flex-col gap-6">
          {puntos}
          {notas}
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          {pendientes}
          {equipo}
        </div>
      </div>
    </>
  );
}
