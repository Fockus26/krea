import { RankDelta } from "@/components/krea/rank-delta";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import {
  MOVIMIENTOS_TITULO,
  type Movimiento,
  movimientoTexto,
  puntosAccesible,
  puntosConSigno,
  tiempoRelativo,
  ultimosMovimientos,
} from "@/lib/ranking-vista";

/*
 * Aside «Últimos movimientos» (HANDOFF §3 Ranking, §6; D096): feed de hasta 6 filas, solo ≥ 1024
 * (en móvil no se muestra y los cambios se anunciarán con toast o `RankAnnouncer` en la fase 07).
 * La lista es LA región viva de la página (`aria-live="polite"`, siempre montada): no se monta
 * `RankAnnouncer` a la vez para no anunciar dos veces lo mismo. `ahora` lo fija quien monta la
 * sección: el servidor no lee el reloj.
 */
export function RankingFeed({
  movimientos,
  ahora,
  className,
}: {
  movimientos: readonly Movimiento[];
  /** Epoch ms de «ahora», para el tiempo relativo. */
  ahora: number;
  className?: string;
}) {
  return (
    <section aria-labelledby="rk-movimientos" className={className}>
      <Card className="flex flex-col gap-3">
        <CardTitle level={2} id="rk-movimientos">
          {MOVIMIENTOS_TITULO}
        </CardTitle>
        <ul
          aria-live="polite"
          className="text-small m-0 flex list-none flex-col gap-2 p-0"
        >
          {movimientos.length === 0 ? (
            // PLACEHOLDER de copy (CONTENT_CHECKLIST fila 127): el feed arranca vacío (D190)
            <li className="text-text-2">
              Aquí verás quién sube y quién baja mientras tengas la página
              abierta.
            </li>
          ) : null}
          {ultimosMovimientos(movimientos).map((m) => (
            <li key={m.id} className="flex items-start gap-2">
              {m.tipo === "puntos" ? (
                <>
                  <Badge
                    aria-hidden="true"
                    variant={m.valor < 0 ? "err" : "ok"}
                    size="sm"
                    className="shrink-0"
                  >
                    {puntosConSigno(m.valor)}
                  </Badge>
                  <span className="sr-only">{puntosAccesible(m.valor)}: </span>
                </>
              ) : (
                // La flecha y la frase dicen lo mismo: el chip se oculta al lector
                <span aria-hidden="true" className="shrink-0">
                  <RankDelta delta={m.tipo === "sube" ? m.cambio : -m.cambio} />
                </span>
              )}
              <span className="min-w-0 flex-1">{movimientoTexto(m)}</span>
              <span className="shrink-0 text-text-2">
                {tiempoRelativo(ahora, m.hace)}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
