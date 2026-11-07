import { Card } from "@/components/ui/card";

/**
 * «Mensaje del día» (D274): una línea cálida según la banda del promedio del alumno y el día.
 * El texto llega elegido (`mensajeDelDia` en `lib/mensaje-diario.ts`). Sin animación: W15 las hace.
 */
export function DailyMessage({ mensaje }: { mensaje: string }) {
  return (
    <Card
      variant="flat"
      role="region"
      className="mb-6"
      aria-labelledby="mensaje-del-dia"
    >
      {/* PROVISIONAL (fila 150): título de la tarjeta */}
      <h2 id="mensaje-del-dia" className="text-eyebrow text-text-2">
        Mensaje del día
      </h2>
      <p className="text-body mt-1 text-text">{mensaje}</p>
    </Card>
  );
}
