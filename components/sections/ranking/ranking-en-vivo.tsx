"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ErrorEnPantalla, SesionVencida } from "@/components/estados/errores";
import { RankAnnouncer } from "@/components/krea/rank-announcer";
import {
  type RankingPublico,
  type SeccionId,
  zRankingPublico,
  zRankingSeccion,
} from "@/lib/modelo";
import type { RankEvento } from "@/lib/rank-row";
import {
  eventosEntre,
  type InfoEquipos,
  itemsDeRanking,
  MOVIMIENTOS_GUARDADOS,
  movimientosEntre,
  puestosDe,
  type Tu,
} from "@/lib/ranking-en-vivo";
import type { Movimiento, Vista } from "@/lib/ranking-vista";
import { estaCortado, fallosTras, SONDEO_MS, useSondeo } from "@/lib/sondeo";
import { Ranking } from "./ranking";

/** Cada cuánto se refresca «hace N min» del feed. */
const RELOJ_MS = 30_000;

/**
 * Ranking en vivo (D011, D190, D327): pinta primero lo que leyó el servidor y pregunta cada
 * SONDEO_MS a /api/ranking/{seccion} (con la cookie de la sesión) si cambió. 401 = la sesión se
 * cerró o se revocó (D171); FALLOS_PARA_CORTADO fallos seguidos = sin red (D437). Los chips de puesto son lo que cambió desde que
 * se abrió la página; el feed (≥ 1024) y `RankAnnouncer` (< 1024, D096) salen de la diferencia
 * entre instantáneas.
 */
export function RankingEnVivo({
  rol = "estudiante",
  seccion,
  vista,
  inicial,
  tu,
  info,
  enlaces,
}: {
  /** El profesor: sin fila «tú» (`tu` vacío) y con el selector de sección (`enlaces.seccion`, D322). */
  rol?: "estudiante" | "profesor";
  seccion: SeccionId;
  vista: Vista;
  /** Para el alumno, con ids públicos (D494); para el profe, con cédulas (enlazan a Alumnos). */
  inicial: RankingPublico;
  tu: Tu;
  info: InfoEquipos;
  enlaces: {
    vista: Record<Vista, string>;
    /** Ruta de cada sección del catálogo, en orden (la misma pestaña). */
    seccion?: Readonly<Record<SeccionId, string>>;
  };
}) {
  const [ranking, setRanking] = useState(inicial);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [eventos, setEventos] = useState<RankEvento[]>([]);
  const [cortado, setCortado] = useState(false);
  const [sesionCerrada, setSesionCerrada] = useState(false);
  // Sin reloj en el render del servidor: «ahora» arranca en la hora del documento
  const [ahora, setAhora] = useState(inicial.actualizadoEn);

  const puestosAntes = useMemo(
    () => puestosDe(itemsDeRanking(inicial, vista, tu, info)),
    [inicial, vista, tu, info],
  );
  const items = useMemo(
    () => itemsDeRanking(ranking, vista, tu, info, puestosAntes),
    [ranking, vista, tu, info, puestosAntes],
  );
  const previos = useRef(items);

  useEffect(() => {
    setAhora(Date.now());
    const reloj = setInterval(() => setAhora(Date.now()), RELOJ_MS);
    return () => clearInterval(reloj);
  }, []);

  // Diferencia con la instantánea anterior → feed y anuncios
  useEffect(() => {
    const antes = previos.current;
    previos.current = items;
    if (antes === items) return;
    const t = Date.now();
    const nuevos = movimientosEntre(antes, items, t);
    if (nuevos.length > 0) {
      setMovimientos((m) => [...nuevos, ...m].slice(0, MOVIMIENTOS_GUARDADOS));
    }
    setEventos(eventosEntre(antes, items));
    setAhora(t);
  }, [items]);

  const version = useRef(inicial.actualizadoEn);
  // Fallos seguidos: el aviso sale al tercero (≈ 15 s), no por uno suelto (D437)
  const fallos = useRef(0);
  const anotar = (ok: boolean) => {
    fallos.current = fallosTras(fallos.current, ok);
    setCortado(estaCortado(fallos.current));
  };
  useSondeo(
    async (senal) => {
      try {
        const res = await fetch(
          `/api/ranking/${encodeURIComponent(seccion)}?desde=${version.current}`,
          { cache: "no-store", signal: senal },
        );
        if (res.status === 401) {
          setSesionCerrada(true);
          return;
        }
        if (res.status === 204) {
          anotar(true);
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        // La API responde con la forma de la sesión: cédulas al profe, ids públicos al alumno
        const r = (
          rol === "profesor" ? zRankingSeccion : zRankingPublico
        ).safeParse(await res.json());
        if (!r.success) return;
        version.current = r.data.actualizadoEn;
        anotar(true);
        setRanking(r.data);
      } catch {
        if (!senal.aborted) anotar(false);
      }
    },
    SONDEO_MS,
    !sesionCerrada,
  );

  return (
    <div className="flex flex-col gap-6">
      {sesionCerrada ? (
        // PLACEHOLDER de copy (CONTENT_CHECKLIST fila 136)
        <SesionVencida>
          Ves los puntos de la última vez que cargó. Entra de nuevo para seguir
          el ranking en vivo.
        </SesionVencida>
      ) : cortado ? (
        // PLACEHOLDER de copy (CONTENT_CHECKLIST fila 127)
        <ErrorEnPantalla
          variant="warn"
          titulo="El ranking no se está actualizando"
        >
          Ves los puntos de la última vez que cargó. Revisa tu conexión y
          recarga la página.
        </ErrorEnPantalla>
      ) : null}
      <Ranking
        rol={rol}
        seccion={seccion}
        vista={vista}
        items={items}
        movimientos={movimientos}
        ahora={ahora}
        enlaces={enlaces}
      />
      {/* Bajo 1024 el feed no se ve: la región viva es esta (D096); ≥ 1024 sale del árbol */}
      <div className="lg:hidden">
        <RankAnnouncer eventos={eventos} />
      </div>
    </div>
  );
}
