import { cn } from "@/lib/utils";

type SpinnerProps = {
  /**
   * Texto para lectores de pantalla. Solo cuando el spinner va suelto: entonces va en un
   * `<output>` (rol `status`). Sin `label` es decorativo (`aria-hidden`), como dentro de un
   * botón, donde el estado lo dicen `aria-busy` y la etiqueta en gerundio.
   */
  label?: string;
  className?: string;
};

/** Aro de 18 px que gira 800 ms lineal (HANDOFF §2.1); quieto con movimiento reducido. */
function Spinner({ label, className }: SpinnerProps) {
  const ring = cn("spinner inline-block size-4.5 shrink-0", className);

  if (!label) {
    return <span data-slot="spinner" aria-hidden="true" className={ring} />;
  }

  return (
    <output data-slot="spinner" className="inline-flex items-center">
      <span aria-hidden="true" className={ring} />
      <span className="sr-only">{label}</span>
    </output>
  );
}

export { Spinner };
