// Eliminar en lote (W22, D298–D300; X4, D314–D315). Puro (sin Firebase): la forma de la entrada,
// el recorrido uno a uno con resultado por id (cédula, tarea o equipo), el troceo del cliente y
// los textos. Lo usan Alumnos, Profesores, Tareas y Equipos; cada pantalla pone su borrado de uno
// (el mismo que el de su diálogo individual).
import { z } from "zod";
import { zCedula } from "@/lib/modelo";

/**
 * Ids por llamada (D299): cada borrado es una transacción con el ranking de la sección, así que
 * van uno tras otro; el cliente parte la selección en trozos de este tamaño.
 */
export const TOPE_LOTE = 25;

/** Lista de ids de `item` sin repetir, 1..TOPE_LOTE. */
export const zIdsLote = (item: z.ZodType<string>) =>
  z
    .array(item)
    .min(1)
    .max(TOPE_LOTE)
    .transform((ids) => [...new Set(ids)]);

/** Lista de cédulas sin repetir, 1..TOPE_LOTE. */
export const zCedulasLote = zIdsLote(zCedula);

export type ResultadoUno<E> = { ok: true } | { ok: false; error: E };
export type ResultadoItem<E> =
  | { id: string; ok: true }
  | { id: string; ok: false; error: E };
export type ResultadoLote<E> =
  | { ok: true; resultados: ResultadoItem<E>[] }
  | { ok: false; error: "invalida" | "red" };

/**
 * Borra uno por uno (en orden) y devuelve el resultado de cada id. Un borrado que lanza no corta
 * el lote: ese id queda con `errorRed` y se sigue con el siguiente.
 */
export async function borrarEnLote<E>(
  ids: readonly string[],
  borrarUno: (id: string) => Promise<ResultadoUno<E>>,
  errorRed: E,
): Promise<ResultadoItem<E>[]> {
  const out: ResultadoItem<E>[] = [];
  for (const id of ids) {
    const r = await borrarUno(id).catch(
      (): ResultadoUno<E> => ({ ok: false, error: errorRed }),
    );
    out.push(r.ok ? { id, ok: true } : { id, ok: false, error: r.error });
  }
  return out;
}

/** Trozos de `n` en el orden original (el cliente llama una vez por trozo). */
export function partirEnLotes<T>(xs: readonly T[], n = TOPE_LOTE): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n));
  return out;
}

/**
 * Llama a `eliminar` trozo a trozo y junta los resultados. Si un trozo entero falla (red,
 * entrada inválida), sus ids quedan con `errorRed` y se sigue con el siguiente.
 */
export async function eliminarPorTrozos<E>(
  ids: readonly string[],
  eliminar: (trozo: string[]) => Promise<ResultadoLote<E>>,
  errorRed: E,
): Promise<ResultadoItem<E>[]> {
  const out: ResultadoItem<E>[] = [];
  for (const trozo of partirEnLotes(ids)) {
    const r = await eliminar(trozo).catch(
      (): ResultadoLote<E> => ({ ok: false, error: "red" }),
    );
    if (r.ok) out.push(...r.resultados);
    else
      out.push(
        ...trozo.map((id) => ({ id, ok: false as const, error: errorRed })),
      );
  }
  return out;
}

/** Los ids que se borraron y los que no (con su error). */
export function separarResultados<E>(resultados: readonly ResultadoItem<E>[]) {
  const ok: string[] = [];
  const fallidos: { id: string; error: E }[] = [];
  for (const r of resultados) {
    if (r.ok) ok.push(r.id);
    else fallidos.push({ id: r.id, error: r.error });
  }
  return { ok, fallidos };
}

/** Estado de «Seleccionar todos»: marcada, a medias o vacía (solo cuenta lo visible). */
export function estadoTodos(
  visibles: readonly string[],
  seleccion: ReadonlySet<string>,
): boolean | "indeterminate" {
  if (visibles.length === 0) return false;
  const n = visibles.filter((c) => seleccion.has(c)).length;
  if (n === 0) return false;
  return n === visibles.length ? true : "indeterminate";
}

/** Marcar «todos»: si ya estaban todos, los desmarca; si no, marca los visibles. */
export function alternarTodos(
  visibles: readonly string[],
  seleccion: ReadonlySet<string>,
): Set<string> {
  return estadoTodos(visibles, seleccion) === true
    ? new Set()
    : new Set(visibles);
}

/** Quita (o pone) una cédula sin mutar la selección. */
export function alternarUno(
  seleccion: ReadonlySet<string>,
  cedula: string,
  marcada: boolean,
): Set<string> {
  const s = new Set(seleccion);
  if (marcada) s.add(cedula);
  else s.delete(cedula);
  return s;
}

/**
 * Shift+clic (D310): pone `marcar` en todo el rango ancla→`id` (ambos incluidos, en el orden de
 * `ids`, que es el visible). Sin ancla, o con el ancla fuera de la lista (filtro o búsqueda
 * nuevos), o si `id` no está en la lista, es `alternarUno`. No muta la selección.
 */
export function alternarRango(
  seleccion: ReadonlySet<string>,
  ids: readonly string[],
  ancla: string | null,
  id: string,
  marcar: boolean,
): Set<string> {
  const a = ancla === null ? -1 : ids.indexOf(ancla);
  const b = ids.indexOf(id);
  if (a === -1 || b === -1) return alternarUno(seleccion, id, marcar);
  const s = new Set(seleccion);
  for (const c of ids.slice(Math.min(a, b), Math.max(a, b) + 1)) {
    if (marcar) s.add(c);
    else s.delete(c);
  }
  return s;
}

/** Ayuda corta junto a la barra. PROVISIONAL (sin fila: copy de apoyo, D311). */
export const AYUDA_RANGO = "Mantén Shift para elegir varios seguidos";

/** Solo las cédulas que siguen en la lista (tras borrar o recargar). */
export function podarSeleccion(
  seleccion: ReadonlySet<string>,
  existentes: readonly string[],
): Set<string> {
  const hay = new Set(existentes);
  return new Set([...seleccion].filter((c) => hay.has(c)));
}

/* Textos. PROVISIONAL (CONTENT_CHECKLIST fila 159): no están en el lienzo */

/**
 * El nombre de lo que se borra y cómo concuerda (D314): `femenino` cambia «Ningún … seleccionado»
 * por «Ninguna … seleccionada»; `cosa` quita la «a» de persona («¿Eliminar 3 tareas?», no «a 3»).
 * Sin ellos, masculino y de persona (alumnos, profesores).
 */
export type Sustantivo = {
  uno: string;
  varios: string;
  femenino?: boolean;
  cosa?: boolean;
};
export const ALUMNOS: Sustantivo = { uno: "alumno", varios: "alumnos" };
export const PROFESORES: Sustantivo = { uno: "profesor", varios: "profesores" };
/* PROVISIONAL (CONTENT_CHECKLIST fila 165) */
export const TAREAS: Sustantivo = {
  uno: "tarea",
  varios: "tareas",
  femenino: true,
  cosa: true,
};
export const EQUIPOS: Sustantivo = {
  uno: "equipo",
  varios: "equipos",
  cosa: true,
};

const cuantos = (n: number, s: Sustantivo) =>
  `${n} ${n === 1 ? s.uno : s.varios}`;
/** «a » ante personas; nada ante cosas. */
const a = (s: Sustantivo) => (s.cosa ? "" : "a ");

/** «3 alumnos seleccionados» / «1 tarea seleccionada» / «Ningún alumno seleccionado». */
export function seleccionadosTexto(n: number, s: Sustantivo): string {
  const sel = s.femenino ? "seleccionada" : "seleccionado";
  if (n === 0) return `${s.femenino ? "Ninguna" : "Ningún"} ${s.uno} ${sel}`;
  return `${cuantos(n, s)} ${n === 1 ? sel : `${sel}s`}`;
}

/** Título del diálogo: «¿Eliminar a 3 alumnos?» / «¿Eliminar 3 tareas?». */
export function eliminarLoteTitulo(n: number, s: Sustantivo): string {
  return `¿Eliminar ${a(s)}${cuantos(n, s)}?`;
}

/** Botón que confirma: «Eliminar 3». */
export function eliminarLoteBoton(n: number): string {
  return `Eliminar ${n}`;
}

/** Toast al terminar sin fallos: «Eliminaste a 3 alumnos» / «Eliminaste 3 equipos». */
export function eliminadosTexto(n: number, s: Sustantivo): string {
  return `Eliminaste ${a(s)}${cuantos(n, s)}`;
}

/** Cabecera del error parcial: «Se eliminaron 2. No se pudo eliminar a 1 alumno:». */
export function fallidosTitulo(
  hechos: number,
  fallidos: number,
  s: Sustantivo,
): string {
  const nadie = s.cosa
    ? `No se eliminó ${s.femenino ? "ninguna" : "ninguno"}.`
    : "No se eliminó a nadie.";
  const parte =
    hechos === 0
      ? nadie
      : `${hechos === 1 ? "Se eliminó 1" : `Se eliminaron ${hechos}`}.`;
  return `${parte} No se pudo eliminar ${a(s)}${cuantos(fallidos, s)}:`;
}

/**
 * Nombre de la casilla de una fila: «Seleccionar a Ana Pérez»; ante cosas, sin «a»
 * («Seleccionar «Fotosíntesis»», «Seleccionar el equipo Los Rayos»).
 */
export const seleccionarLabel = (nombre: string, s: Sustantivo = ALUMNOS) =>
  `Seleccionar ${a(s)}${nombre}`;
export const SELECCIONAR_TODOS_ALUMNOS =
  "Seleccionar a todos los alumnos visibles";
export const SELECCIONAR_TODOS_PROFESORES =
  "Seleccionar a todos los profesores (menos tú)";
/* PROVISIONAL (CONTENT_CHECKLIST fila 165) */
export const SELECCIONAR_TODAS_TAREAS = "Seleccionar todas las tareas visibles";
export const SELECCIONAR_TODOS_EQUIPOS =
  "Seleccionar todos los equipos de la sección";

export const REINTENTAR_LOTE =
  "Siguen seleccionados: vuelve a intentarlo con «Eliminar».";
