import { Check } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Tarea entregada (HANDOFF §3): tarjeta con borde interior 2 px `--success` (también en oscuro,
 * donde la tarjeta ya no tiene sombra), cuadro 56 `--success` con Check en `--surface`, h2 "¡Tarea entregada!", quién y cuándo, y "Volver a tareas".
 * Las respuestas en solo lectura van debajo (las pinta la página). `accion`: «Editar entrega»
 * (D395), antes de «Volver a tareas».
 */
export function TaskDelivered({
  quien,
  fecha,
  hora,
  evaluada = false,
  notaHref,
  volverHref,
  accion,
}: {
  /** Quién la envió; `null` si la nota vino del Excel sin ese registro. */
  quien: string | null;
  /** dd/mm/aaaa; `null` sin registro de envío. */
  fecha: string | null;
  /** "4:12 p. m.". */
  hora: string | null;
  /** Ya tiene nota: cambia el texto de abajo. */
  evaluada?: boolean;
  /** Detalle de la nota (D248): con él, evaluada ofrece «Ver mi nota» en vez de mandar a Mis notas. */
  notaHref?: string | null;
  /** Destino de «Volver a tareas» (D140: tras entregar se vuelve a la lista de tareas). */
  volverHref: string;
  accion?: ReactNode;
}) {
  return (
    <Card className="shadow-done dark:shadow-done flex flex-col items-start gap-3">
      <span className="grid size-14 place-items-center rounded-done bg-success-fill text-on-success">
        <Check aria-hidden="true" className="size-7" />
      </span>
      <h2 className="text-h2 text-text">¡Tarea entregada!</h2>
      {quien && fecha && hora ? (
        <p className="text-body text-text">
          La envió <strong className="font-bold">{quien}</strong> el {fecha} a
          las {hora}.
        </p>
      ) : quien ? (
        <p className="text-body text-text">
          La envió <strong className="font-bold">{quien}</strong>.
        </p>
      ) : (
        // PLACEHOLDER de copy (CONTENT_CHECKLIST fila 129): entrega cargada desde el Excel
        <p className="text-body text-text">
          Esta entrega se cargó con la nota, sin el registro del envío.
        </p>
      )}
      <p className="text-body text-text-2">
        {evaluada
          ? notaHref
            ? // PROVISIONAL (fila 141)
              "Tu profe ya la evaluó. Mira tu nota y cómo salió cada pregunta."
            : // PLACEHOLDER de copy (fila 129)
              "Tu profe ya la evaluó: la nota está en Mis notas."
          : "Tu profe la evaluará pronto. Cuando tengas la nota, aparece en Mis notas."}
      </p>
      <div className="mt-1 flex flex-wrap gap-3">
        {evaluada && notaHref ? (
          <Button asChild>
            {/* PROVISIONAL (fila 141) */}
            <Link href={notaHref}>Ver mi nota</Link>
          </Button>
        ) : null}
        {accion}
        <Button asChild variant="secondary">
          {/* PROVISIONAL (fila 263) */}
          <Link href={volverHref}>Volver a tareas</Link>
        </Button>
      </div>
    </Card>
  );
}
