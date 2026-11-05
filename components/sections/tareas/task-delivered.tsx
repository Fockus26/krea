import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Tarea entregada (HANDOFF §3): tarjeta con borde interior 2 px `--success` (también en oscuro,
 * donde la tarjeta ya no tiene sombra), cuadro 56 `--success` con Check en `--surface`, h2 "¡Tarea entregada!", quién y cuándo, y "Volver al inicio".
 * Las respuestas en solo lectura van debajo (las pinta la página).
 */
export function TaskDelivered({
  quien,
  fecha,
  hora,
  evaluada = false,
  inicioHref,
}: {
  /** Quién la envió; `null` si la nota vino del Excel sin ese registro. */
  quien: string | null;
  /** dd/mm/aaaa; `null` sin registro de envío. */
  fecha: string | null;
  /** "4:12 p. m.". */
  hora: string | null;
  /** Ya tiene nota: cambia el texto de abajo. */
  evaluada?: boolean;
  inicioHref: string;
}) {
  return (
    <Card className="shadow-done dark:shadow-done flex flex-col items-start gap-3">
      <span className="grid size-14 place-items-center rounded-done bg-success text-surface">
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
          ? // PLACEHOLDER de copy (fila 129)
            "Tu profe ya la evaluó: la nota está en Mis notas."
          : "Tu profe la evaluará pronto. Cuando tengas la nota, aparece en Mis notas."}
      </p>
      <Button asChild variant="secondary" className="mt-1">
        <Link href={inicioHref}>Volver al inicio</Link>
      </Button>
    </Card>
  );
}
