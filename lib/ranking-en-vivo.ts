// Ranking en vivo (fase 07, D011, D190): del documento `ranking/{seccion}` a las filas de la
// pantalla, y lo que cambió entre dos instantáneas (chips de puesto, feed y anuncios). Puro: lo
// usa el componente cliente que escucha con `onSnapshot` y lo prueban los tests.
import type { RankingSeccion } from "@/lib/modelo";
import type { RankEvento } from "@/lib/rank-row";
import { primerApellido, rankCompetition } from "@/lib/ranking";
import {
  type ItemRanking,
  type Movimiento,
  PUESTOS_PODIO,
  subtituloEquipo,
  type Vista,
} from "@/lib/ranking-vista";
import { estiloDe } from "@/lib/vistas-estudiante";

/** Lo que el ranking no trae y no cambia en vivo: tema y capitán de cada equipo (servidor). */
export type InfoEquipos = Readonly<
  Record<string, { tema: string | null; capitan: string | null }>
>;

export type Tu = { cedula: string | null; equipoId: string | null };

const nombreCorto = (nombres: string, apellidos: string) =>
  `${nombres.trim().split(/\s+/)[0] ?? ""} ${primerApellido(apellidos)}`;

/**
 * Filas de una vista ya ordenadas con `rankCompetition`. `puestosAntes`: los puestos de cuando
 * se abrió la página; el chip de cada fila es lo que subió o bajó desde entonces (sin cambio, sin
 * chip): el documento no guarda puestos anteriores (CONTENT_CHECKLIST fila 128).
 */
export function itemsDeRanking(
  ranking: RankingSeccion,
  vista: Vista,
  tu: Tu,
  info: InfoEquipos,
  puestosAntes?: Readonly<Record<string, number>>,
): ItemRanking[] {
  const delta = (id: string, puesto: number) => {
    const antes = puestosAntes?.[id];
    return antes === undefined || antes === puesto ? undefined : antes - puesto;
  };

  if (vista === "estudiantes") {
    const filas = rankCompetition(
      Object.entries(ranking.alumnos).map(([id, f]) => ({
        ...f,
        id,
        primerApellido: primerApellido(f.apellidos),
      })),
    );
    return filas.map((f) => ({
      tipo: "estudiante",
      id: f.id,
      nombre: nombreCorto(f.nombres, f.apellidos),
      puntos: f.puntos,
      puesto: f.puesto,
      empate: f.empate,
      enRiesgo: f.enRiesgo,
      subtitulo:
        (f.equipoId && ranking.equipos[f.equipoId]?.nombre) || "Sin equipo",
      delta: delta(f.id, f.puesto),
      esTu: f.id === tu.cedula,
      estilo: estiloDe(f.estilo),
      seed: f.semilla ?? f.id,
    }));
  }

  const integrantes = new Map<string, number>();
  for (const a of Object.values(ranking.alumnos)) {
    if (a.equipoId)
      integrantes.set(a.equipoId, (integrantes.get(a.equipoId) ?? 0) + 1);
  }
  const filas = rankCompetition(
    Object.entries(ranking.equipos).map(([id, e]) => ({
      ...e,
      id,
      primerApellido: e.nombre,
    })),
  );
  return filas.map((e) => {
    const capId = info[e.id]?.capitan ?? null;
    const cap = capId ? ranking.alumnos[capId] : undefined;
    const n = integrantes.get(e.id) ?? 0;
    return {
      tipo: "equipo",
      id: e.id,
      nombre: e.nombre,
      puntos: e.puntos,
      puesto: e.puesto,
      empate: e.empate,
      enRiesgo: e.enRiesgo,
      subtitulo: cap
        ? subtituloEquipo(n, nombreCorto(cap.nombres, cap.apellidos))
        : `${n} ${n === 1 ? "integrante" : "integrantes"}`,
      delta: delta(e.id, e.puesto),
      esTu: e.id === tu.equipoId,
      tema: info[e.id]?.tema ?? e.nombre,
      // El logo sale de Storage (W8): mientras, las iniciales
      src: null,
    };
  });
}

/** `id → puesto` de unas filas. */
export function puestosDe(
  items: ReadonlyArray<Pick<ItemRanking, "id" | "puesto">>,
): Record<string, number> {
  return Object.fromEntries(items.map((i) => [i.id, i.puesto]));
}

/**
 * Movimientos entre dos instantáneas (feed «Últimos movimientos», ≥ 1024): una fila por cada
 * cambio de puesto, las subidas primero. `ahora` lo pone quien llama (el cliente).
 */
export function movimientosEntre(
  antes: ReadonlyArray<ItemRanking>,
  despues: ReadonlyArray<ItemRanking>,
  ahora: number,
): Movimiento[] {
  const previo = puestosDe(antes);
  const out: Movimiento[] = [];
  for (const i of despues) {
    const p = previo[i.id];
    if (p === undefined || p === i.puesto) continue;
    out.push({
      id: `${ahora}-${i.id}`,
      tipo: p > i.puesto ? "sube" : "baja",
      nombre: i.nombre,
      puesto: i.puesto,
      cambio: Math.abs(p - i.puesto),
      hace: ahora,
    });
  }
  // Mismo instante: el orden del feed es el de la lista (subidas primero, luego por puesto)
  return out.sort(
    (a, b) =>
      Number(b.tipo === "sube") - Number(a.tipo === "sube") ||
      ("puesto" in a ? a.puesto : 0) - ("puesto" in b ? b.puesto : 0),
  );
}

/**
 * Anuncios para el lector bajo 1024 (`RankAnnouncer`, D096): quién subió, entró al podio o cayó
 * a la zona de riesgo. Las bajadas que son efecto de otra subida no se anuncian.
 */
export function eventosEntre(
  antes: ReadonlyArray<ItemRanking>,
  despues: ReadonlyArray<ItemRanking>,
): RankEvento[] {
  const previo = new Map(antes.map((i) => [i.id, i]));
  const out: RankEvento[] = [];
  for (const i of despues) {
    const p = previo.get(i.id);
    if (!p || p.puesto === i.puesto) continue;
    if (i.puesto < p.puesto) {
      out.push(
        i.puesto <= PUESTOS_PODIO && p.puesto > PUESTOS_PODIO
          ? { tipo: "podio", nombre: i.nombre }
          : { tipo: "sube", nombre: i.nombre, puesto: i.puesto },
      );
    } else if (i.enRiesgo && !p.enRiesgo) {
      out.push({ tipo: "riesgo", nombre: i.nombre });
    }
  }
  return out;
}

/** Cuántos movimientos guarda la página (el feed pinta los 6 más recientes). */
export const MOVIMIENTOS_GUARDADOS = 20;
