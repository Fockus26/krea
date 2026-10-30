import { Podium, type PodiumEntrada } from "@/components/krea/podium";
import { RankList, type RankListFila } from "@/components/krea/rank-list";
import { TeamLogo } from "@/components/krea/team-logo";
import { UserAvatar } from "@/components/krea/user-avatar";
import { Card } from "@/components/ui/card";
import {
  etiquetasRanking,
  type ItemRanking,
  partirRanking,
  tituloLista,
  type Vista,
} from "@/lib/ranking-vista";

function aEntrada(i: ItemRanking): PodiumEntrada {
  const base = {
    id: i.id,
    puesto: i.puesto,
    nombre: i.nombre,
    puntos: i.puntos,
  };
  return i.tipo === "estudiante"
    ? { ...base, tipo: "estudiante", estilo: i.estilo, seed: i.seed }
    : { ...base, tipo: "equipo", teamId: i.id, tema: i.tema, src: i.src };
}

function aFila(i: ItemRanking): RankListFila {
  return {
    id: i.id,
    puesto: i.puesto,
    empate: i.empate,
    enRiesgo: i.enRiesgo,
    nombre: i.nombre,
    puntos: i.puntos,
    subtitulo: i.subtitulo,
    delta: i.delta,
    esTu: i.esTu,
    media:
      i.tipo === "estudiante" ? (
        <UserAvatar
          estilo={i.estilo}
          seed={i.seed}
          nombre={i.nombre}
          size={40}
        />
      ) : (
        <TeamLogo teamId={i.id} tema={i.tema} src={i.src} size={40} />
      ),
  };
}

/*
 * Cuerpo del Ranking (HANDOFF §3 Ranking §2–4): podio (§2.10) en una card hero SIN padding
 * inferior —los escalones tocan el borde— y, debajo, la lista 4–N (§2.9) sin tarjeta con el
 * separador de la zona de riesgo que pinta `RankList`. Cada bloque lleva un `h2` solo para
 * lectores. El podio sigue `rankCompetition` (D052); aquí no se recalcula ningún puesto.
 */
export function RankingBoard({
  vista,
  items,
}: {
  vista: Vista;
  items: readonly ItemRanking[];
}) {
  const { podio, resto } = partirRanking(items);
  const etiquetas = etiquetasRanking(vista);
  return (
    <div className="flex flex-col gap-6">
      <Card variant="hero" className="overflow-hidden pb-0 md:pb-0">
        <section aria-labelledby="rk-podio">
          <h2 id="rk-podio" className="sr-only">
            Podio
          </h2>
          <Podium entradas={podio.map(aEntrada)} label={etiquetas.podio} />
        </section>
      </Card>
      {resto.length > 0 ? (
        <section aria-labelledby="rk-lista">
          <h2 id="rk-lista" className="sr-only">
            {tituloLista(items.length)}
          </h2>
          <RankList filas={resto.map(aFila)} label={etiquetas.lista} />
        </section>
      ) : null}
    </div>
  );
}
