"use client";

import { Trophy } from "lucide-react";
import { useState } from "react";
import {
  type Companero,
  CompaneroCard,
} from "@/components/krea/companero-card";
import { EmptyState } from "@/components/krea/empty-state";
import { PodioConfeti } from "@/components/krea/podio-confeti";
import { Podium, type PodiumEntrada } from "@/components/krea/podium";
import { RankList, type RankListFila } from "@/components/krea/rank-list";
import { TeamLogo } from "@/components/krea/team-logo";
import { UserAvatar } from "@/components/krea/user-avatar";
import { Card } from "@/components/ui/card";
import { rutaAlumnos } from "@/lib/alumnos";
import {
  etiquetasRanking,
  type ItemRanking,
  partirRanking,
  type RolRanking,
  type SeccionRanking,
  tituloLista,
  type Vista,
  vacioRanking,
} from "@/lib/ranking-vista";

/** Cómo se abre un alumno (D259): el profe va a su ficha, el estudiante ve su tarjeta. */
type Abrir = (i: ItemRanking) => { href?: string; onAbrir?: () => void };

function aEntrada(i: ItemRanking, abrir: Abrir): PodiumEntrada {
  const base = {
    id: i.id,
    puesto: i.puesto,
    nombre: i.nombre,
    puntos: i.puntos,
  };
  return i.tipo === "estudiante"
    ? {
        ...base,
        ...abrir(i),
        tipo: "estudiante",
        estilo: i.estilo,
        seed: i.seed,
      }
    : { ...base, tipo: "equipo", teamId: i.id, tema: i.tema, src: i.src };
}

function aFila(i: ItemRanking, abrir: Abrir): RankListFila {
  return {
    ...abrir(i),
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
  rol,
  seccion,
}: {
  vista: Vista;
  items: readonly ItemRanking[];
  rol: RolRanking;
  seccion: SeccionRanking;
}) {
  const { podio, resto } = partirRanking(items);
  const etiquetas = etiquetasRanking(vista);
  // Se guarda el id y no la fila: la tarjeta abierta sigue a la fila cuando el ranking se mueve
  const [abiertoId, setAbiertoId] = useState<string | null>(null);

  const abrir: Abrir = (i) => {
    if (i.tipo !== "estudiante") return {};
    return rol === "profesor"
      ? { href: rutaAlumnos({ alumno: i.id, seccion }) }
      : { onAbrir: () => setAbiertoId(i.id) };
  };

  const abierto = items.find((i) => i.id === abiertoId);
  const companero: Companero | null =
    abierto?.tipo === "estudiante"
      ? {
          id: abierto.id,
          nombre: abierto.nombre,
          equipo: abierto.subtitulo,
          puesto: abierto.puesto,
          puntos: abierto.puntos,
          empate: abierto.empate,
          estilo: abierto.estilo,
          seed: abierto.seed,
        }
      : null;

  const vacio = vacioRanking(vista, seccion, items.length);
  if (vacio) {
    return (
      <Card>
        <EmptyState
          icon={Trophy}
          headingLevel={2}
          title={vacio.titulo}
          description={vacio.descripcion}
        />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card variant="hero" className="overflow-hidden pb-0 md:pb-0">
        <section aria-labelledby="rk-podio" className="relative">
          <h2 id="rk-podio" className="sr-only">
            Podio
          </h2>
          <Podium
            entradas={podio.map((i) => aEntrada(i, abrir))}
            label={etiquetas.podio}
          />
          <PodioConfeti vista={vista} />
        </section>
      </Card>
      {resto.length > 0 ? (
        <section aria-labelledby="rk-lista">
          <h2 id="rk-lista" className="sr-only">
            {tituloLista(items.length)}
          </h2>
          <RankList
            filas={resto.map((i) => aFila(i, abrir))}
            label={etiquetas.lista}
          />
        </section>
      ) : null}
      {rol === "estudiante" ? (
        <CompaneroCard
          companero={companero}
          onCerrar={() => setAbiertoId(null)}
        />
      ) : null}
    </div>
  );
}
