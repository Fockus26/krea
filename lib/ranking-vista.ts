// Lógica pura de la sección Ranking (HANDOFF §3 Ranking, §8; D094–D097). Sin React ni reloj:
// lo que depende de la hora recibe `ahora` (con `cacheComponents` el servidor no lee `Date.now()`).

import type { DicebearEstilo } from "./dicebear";
import type { SeccionId } from "./modelo";
import type { RankingPuesto } from "./ranking";
import { formatDecimal } from "./stepper";

export type Vista = "estudiantes" | "equipos";
export type RolRanking = "estudiante" | "profesor";

/** Cuántos puestos van en el podio; el resto va a la lista. */
export const PUESTOS_PODIO = 3;
/** Máximo de filas del feed «Últimos movimientos». */
export const MAX_MOVIMIENTOS = 6;
/** Clave de `localStorage` que recuerda si el `<details>` móvil quedó abierto o cerrado. */
export const AYUDA_CLAVE = "krea-ranking-ayuda";

type ItemBase = RankingPuesto & {
  id: string;
  nombre: string;
  puntos: number;
  subtitulo?: string;
  /** Puestos que subió (+) o bajó (−). PLACEHOLDER hasta la fase 07 (§8 «deltas del ranking»). */
  delta?: number;
  esTu?: boolean;
};

/** Una fila del ranking ya reducida a lo que pintan el podio y la lista. */
export type ItemRanking = ItemBase &
  (
    | { tipo: "estudiante"; estilo: DicebearEstilo; seed: string }
    | { tipo: "equipo"; tema: string; src?: string | null }
  );

/**
 * Parte el ranking (ya ordenado por `rankCompetition`) en podio y lista. El podio son las tres
 * primeras filas por posición; con un empate en el 3.º el empatado cae en la lista con su mismo
 * puesto (D052), nunca se recalcula nada aquí.
 */
export function partirRanking(items: readonly ItemRanking[]): {
  podio: ItemRanking[];
  resto: ItemRanking[];
} {
  return {
    podio: items.slice(0, PUESTOS_PODIO),
    resto: items.slice(PUESTOS_PODIO),
  };
}

/** "Sección 5A · 35 estudiantes" / "Sección 5A · 6 equipos". */
export function eyebrowRanking(
  seccion: SeccionId,
  cantidad: number,
  vista: Vista,
): string {
  const unidad =
    vista === "estudiantes"
      ? cantidad === 1
        ? "estudiante"
        : "estudiantes"
      : cantidad === 1
        ? "equipo"
        : "equipos";
  return `Sección ${seccion} · ${cantidad} ${unidad}`;
}

/** Subtítulo de la fila de equipo: "5 integrantes · capitán Diego Soler" (D075). */
export function subtituloEquipo(
  integrantes: number,
  capitan: string,
  femenino = false,
): string {
  const n = `${integrantes} ${integrantes === 1 ? "integrante" : "integrantes"}`;
  return `${n} · ${femenino ? "capitana" : "capitán"} ${capitan}`;
}

/** Nombre accesible del podio y de la lista según lo que se muestra. */
export function etiquetasRanking(vista: Vista): {
  podio: string;
  lista: string;
} {
  return vista === "estudiantes"
    ? { podio: "Podio de estudiantes", lista: "Ranking de estudiantes" }
    : { podio: "Podio de equipos", lista: "Ranking de equipos" };
}

/** Título (solo para lectores) de la lista bajo el podio: "Puestos 4 a 35". */
export function tituloLista(total: number): string {
  return `Puestos ${PUESTOS_PODIO + 1} a ${total}`;
}

/** Texto del estado vacío (D312); `null` si hay filas y se pintan podio y lista. */
export function vacioRanking(
  vista: Vista,
  seccion: SeccionId,
  total: number,
): { titulo: string; descripcion: string } | null {
  if (total > 0) return null;
  return vista === "estudiantes"
    ? {
        titulo: `Todavía no hay alumnos en ${seccion}`,
        descripcion:
          "Cuando haya alumnos y notas, aquí verás quién va adelante.",
      }
    : {
        titulo: `Todavía no hay equipos en ${seccion}`,
        descripcion: "Cuando se armen los equipos, aquí verás su posición.",
      };
}

// ---- Feed «Últimos movimientos» ----

/** Tiempo relativo corto en español: "hace 2 min". `ahora` y `antes` son epoch ms. */
export function tiempoRelativo(ahora: number, antes: number): string {
  const seg = Math.max(0, Math.floor((ahora - antes) / 1000));
  if (seg < 60) return "hace un momento";
  const min = Math.floor(seg / 60);
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

export type Movimiento = { id: string; hace: number /* epoch ms */ } & (
  | { tipo: "sube" | "baja"; nombre: string; puesto: number; cambio: number }
  | { tipo: "puntos"; nombre: string; valor: number; motivo: string }
);

/** "Juana Montero subió al puesto 4" / "Mateo Paredes · Participación destacada". */
export function movimientoTexto(m: Movimiento): string {
  if (m.tipo === "puntos") return `${m.nombre} · ${m.motivo}`;
  return `${m.nombre} ${m.tipo === "sube" ? "subió" : "bajó"} al puesto ${m.puesto}`;
}

/** Puntos con signo para el chip: "+2", "−1" (signo tipográfico), "+0,5". */
export function puntosConSigno(valor: number): string {
  return `${valor < 0 ? "−" : "+"}${formatDecimal(Math.abs(valor))}`;
}

/** Texto accesible del chip de puntos: "más 2 puntos", "menos 1 punto" (el signo no va solo en el color). */
export function puntosAccesible(valor: number): string {
  const a = Math.abs(valor);
  return `${valor < 0 ? "menos" : "más"} ${formatDecimal(a)} ${a === 1 ? "punto" : "puntos"}`;
}

/** Los más recientes primero y como mucho `MAX_MOVIMIENTOS`. */
export function ultimosMovimientos(
  movimientos: readonly Movimiento[],
): Movimiento[] {
  return [...movimientos]
    .sort((a, b) => b.hace - a.hace)
    .slice(0, MAX_MOVIMIENTOS);
}

// ---- `<details>` móvil con memoria ----

/** Sin valor guardado (o ilegible) → abierto, como la primera vez. */
export function ayudaAbiertaDe(guardado: string | null): boolean {
  return guardado !== "cerrado";
}

export function ayudaValor(abierto: boolean): "abierto" | "cerrado" {
  return abierto ? "abierto" : "cerrado";
}

// ---- «Cómo se calculan» (copy del lienzo; ejemplos 15 y 8 y chip +2 son de ilustración) ----

export const REGLAS_TITULO = "Cómo se calculan";
export const REGLAS_TITULO_MOVIL = "¿Cómo se calculan los puntos?";
export const MOVIMIENTOS_TITULO = "Últimos movimientos";

export const REGLAS = [
  {
    clave: "suma",
    ejemplo: { tipo: "nota", valor: 15 },
    texto: "Cada nota de 10 o más suma esos mismos puntos.",
  },
  {
    clave: "no-suma",
    ejemplo: { tipo: "nota", valor: 8 },
    texto: "Una nota menor de 10 suma 0.",
  },
  {
    clave: "conducta",
    ejemplo: { tipo: "ajuste", valor: 2 },
    texto:
      "Tus profes suman o restan por conducta, siempre con un motivo. Eso no cambia tu nota.",
  },
] as const;

/** Versión en un párrafo para el `<details>` móvil. */
export const REGLAS_MOVIL =
  "Cada nota de 10 o más suma esos mismos puntos; una nota menor de 10 suma 0. Tus profes también suman o restan por conducta, siempre con un motivo. Eso no cambia tu nota.";
