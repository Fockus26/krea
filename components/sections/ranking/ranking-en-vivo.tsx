"use client";

import { onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
import { ErrorEnPantalla, SesionVencida } from "@/components/estados/errores";
import { RankAnnouncer } from "@/components/krea/rank-announcer";
import { tokenEnVivo } from "@/lib/acciones/en-vivo";
import { firebaseCliente } from "@/lib/firebase/cliente";
import {
  COL,
  type RankingSeccion,
  type SeccionId,
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
import { Ranking } from "./ranking";

/** Cada cuánto se refresca «hace N min» del feed. */
const RELOJ_MS = 30_000;

/**
 * Ranking en vivo (D011, D190): pinta primero lo que leyó el servidor y se suscribe con
 * `onSnapshot` a `ranking/{seccion}` con el SDK del navegador. Si el navegador no tiene la sesión
 * de Firebase de esta cuenta (otra pestaña cerró, contraseña cambiada), pide un token propio al
 * servidor (`tokenEnVivo`). Los chips de puesto son lo que cambió desde que se abrió la página;
 * el feed (≥ 1024) y `RankAnnouncer` (< 1024, D096) salen de la diferencia entre instantáneas.
 */
export function RankingEnVivo({
  uid,
  rol = "estudiante",
  seccion,
  vista,
  inicial,
  tu,
  info,
  enlaces,
}: {
  uid: string;
  /** El profesor: sin fila «tú» (`tu` vacío) y con el selector de sección (`enlaces.seccion`, D322). */
  rol?: "estudiante" | "profesor";
  seccion: SeccionId;
  vista: Vista;
  inicial: RankingSeccion;
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

  useEffect(() => {
    const fb = firebaseCliente();
    if (!fb) {
      setCortado(true);
      return;
    }
    let fin = false;
    let pedido = false;
    let dejar: (() => void) | null = null;
    const dejarAuth = onAuthStateChanged(fb.auth, async (user) => {
      if (fin) return;
      dejar?.();
      dejar = null;
      if (!user || user.uid !== uid) {
        // Un solo intento por montaje: si falla, el aviso y lo del servidor
        if (pedido) {
          setCortado(true);
          return;
        }
        pedido = true;
        try {
          const r = await tokenEnVivo();
          if (fin) return;
          if (!r.ok) {
            // Sin sesión en el servidor: no es la red, hay que entrar de nuevo (D171)
            if (r.error === "sin-sesion") setSesionCerrada(true);
            else setCortado(true);
            return;
          }
          await signInWithCustomToken(fb.auth, r.token);
        } catch {
          if (!fin) setCortado(true);
        }
        return;
      }
      dejar = onSnapshot(
        doc(fb.db, COL.ranking, seccion),
        (snap) => {
          const r = zRankingSeccion.safeParse(snap.data());
          if (!r.success) return;
          setCortado(false);
          setRanking(r.data);
        },
        () => setCortado(true),
      );
    });
    return () => {
      fin = true;
      dejarAuth();
      dejar?.();
    };
  }, [uid, seccion]);

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
