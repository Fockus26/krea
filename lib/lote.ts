// Eliminar en lote (W22, D298–D300). Puro (sin Firebase): la forma de la entrada, el recorrido
// uno a uno con resultado por cédula, el troceo del cliente y los textos. Lo usan Alumnos y
// Profesores; cada pantalla pone su borrado de uno (el mismo que el de su diálogo individual).
import { z } from "zod";
import { zCedula } from "@/lib/modelo";

/**
 * Cédulas por llamada (D299): cada borrado es una transacción con el ranking de la sección, así
 * que van una tras otra; el cliente parte la selección en trozos de este tamaño.
 */
export const TOPE_LOTE = 25;

/** Lista de cédulas sin repetir, 1..TOPE_LOTE. */
export const zCedulasLote = z
  .array(zCedula)
  .min(1)
  .max(TOPE_LOTE)
  .transform((cs) => [...new Set(cs)]);

export type ResultadoUno<E> = { ok: true } | { ok: false; error: E };
export type ResultadoItem<E> =
  | { cedula: string; ok: true }
  | { cedula: string; ok: false; error: E };
export type ResultadoLote<E> =
  | { ok: true; resultados: ResultadoItem<E>[] }
  | { ok: false; error: "invalida" | "red" };

/**
 * Borra una por una (en orden) y devuelve el resultado de cada cédula. Un borrado que lanza no
 * corta el lote: esa cédula queda con `errorRed` y se sigue con la siguiente.
 */
export async function borrarEnLote<E>(
  cedulas: readonly string[],
  borrarUno: (cedula: string) => Promise<ResultadoUno<E>>,
  errorRed: E,
): Promise<ResultadoItem<E>[]> {
  const out: ResultadoItem<E>[] = [];
  for (const cedula of cedulas) {
    const r = await borrarUno(cedula).catch(
      (): ResultadoUno<E> => ({ ok: false, error: errorRed }),
    );
    out.push(
      r.ok ? { cedula, ok: true } : { cedula, ok: false, error: r.error },
    );
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
 * entrada inválida), sus cédulas quedan con `errorRed` y se sigue con el siguiente.
 */
export async function eliminarPorTrozos<E>(
  cedulas: readonly string[],
  eliminar: (trozo: string[]) => Promise<ResultadoLote<E>>,
  errorRed: E,
): Promise<ResultadoItem<E>[]> {
  const out: ResultadoItem<E>[] = [];
  for (const trozo of partirEnLotes(cedulas)) {
    const r = await eliminar(trozo).catch(
      (): ResultadoLote<E> => ({ ok: false, error: "red" }),
    );
    if (r.ok) out.push(...r.resultados);
    else
      out.push(
        ...trozo.map((cedula) => ({
          cedula,
          ok: false as const,
          error: errorRed,
        })),
      );
  }
  return out;
}

/** Las cédulas que se borraron y las que no (con su error). */
export function separarResultados<E>(resultados: readonly ResultadoItem<E>[]) {
  const ok: string[] = [];
  const fallidos: { cedula: string; error: E }[] = [];
  for (const r of resultados) {
    if (r.ok) ok.push(r.cedula);
    else fallidos.push({ cedula: r.cedula, error: r.error });
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

/** Solo las cédulas que siguen en la lista (tras borrar o recargar). */
export function podarSeleccion(
  seleccion: ReadonlySet<string>,
  existentes: readonly string[],
): Set<string> {
  const hay = new Set(existentes);
  return new Set([...seleccion].filter((c) => hay.has(c)));
}

/* Textos. PROVISIONAL (CONTENT_CHECKLIST fila 159): no están en el lienzo */

export type Sustantivo = { uno: string; varios: string };
export const ALUMNOS: Sustantivo = { uno: "alumno", varios: "alumnos" };
export const PROFESORES: Sustantivo = { uno: "profesor", varios: "profesores" };

const cuantos = (n: number, s: Sustantivo) =>
  `${n} ${n === 1 ? s.uno : s.varios}`;

/** «3 alumnos seleccionados» / «1 profesor seleccionado» / «Ningún alumno seleccionado». */
export function seleccionadosTexto(n: number, s: Sustantivo): string {
  if (n === 0) return `Ningún ${s.uno} seleccionado`;
  return `${cuantos(n, s)} ${n === 1 ? "seleccionado" : "seleccionados"}`;
}

/** Título del diálogo: «¿Eliminar a 3 alumnos?». */
export function eliminarLoteTitulo(n: number, s: Sustantivo): string {
  return `¿Eliminar a ${cuantos(n, s)}?`;
}

/** Botón que confirma: «Eliminar 3». */
export function eliminarLoteBoton(n: number): string {
  return `Eliminar ${n}`;
}

/** Toast al terminar sin fallos: «Eliminaste a 3 alumnos». */
export function eliminadosTexto(n: number, s: Sustantivo): string {
  return `Eliminaste a ${cuantos(n, s)}`;
}

/** Cabecera del error parcial: «Se eliminaron 2. No se pudo eliminar a 1 alumno:». */
export function fallidosTitulo(
  hechos: number,
  fallidos: number,
  s: Sustantivo,
): string {
  const parte =
    hechos === 0
      ? "No se eliminó a nadie."
      : `${hechos === 1 ? "Se eliminó 1" : `Se eliminaron ${hechos}`}.`;
  return `${parte} No se pudo eliminar a ${cuantos(fallidos, s)}:`;
}

/** Nombre de la casilla de una fila: «Seleccionar a Ana Pérez». */
export const seleccionarLabel = (nombre: string) => `Seleccionar a ${nombre}`;
export const SELECCIONAR_TODOS_ALUMNOS =
  "Seleccionar a todos los alumnos visibles";
export const SELECCIONAR_TODOS_PROFESORES =
  "Seleccionar a todos los profesores (menos tú)";

export const REINTENTAR_LOTE =
  "Siguen seleccionados: vuelve a intentarlo con «Eliminar».";
