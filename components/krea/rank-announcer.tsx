import { agruparAnuncios, type RankEvento } from "@/lib/rank-row";

type RankAnnouncerProps = {
  /** Cambios llegados en la misma ventana de 1 s; varios se agrupan en una sola frase. */
  eventos: readonly RankEvento[];
};

/*
 * Región viva de anuncios del ranking — HANDOFF §6. Debe haber UNA por página (no una por fila);
 * la página decide cuándo vaciar `eventos`. Se anuncia también con el movimiento normal.
 * Siempre montada y vacía al principio: las regiones vega que aparecen con texto no se leen.
 */
export function RankAnnouncer({ eventos }: RankAnnouncerProps) {
  return (
    <output
      data-slot="rank-announcer"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {agruparAnuncios(eventos)}
    </output>
  );
}
