// Lista de tareas del profe al eliminar una (D243). Puro, para probarlo sin DOM: la tarjeta que
// sale se queda en su sitio hasta que termina su animación, y el foco va a su vecina.

/** La tarjeta que se está eliminando y su sitio en la lista visible al pedirlo. */
export type Quitando<T extends { id: string }> = {
  tarea: T;
  indice: number;
  /** La acción ya respondió bien: la tarjeta anima su salida. */
  hecha: boolean;
};

/**
 * Inserta la tarjeta que sale en su sitio si el servidor ya la quitó (`refresh()` llega con la
 * respuesta de la acción): así no desaparece de golpe antes de animar su salida.
 */
export function conLaQueSale<T extends { id: string }>(
  visibles: readonly T[],
  q: Quitando<T> | null,
): readonly T[] {
  if (!q || visibles.some((t) => t.id === q.tarea.id)) return visibles;
  const i = Math.max(0, Math.min(q.indice, visibles.length));
  return [...visibles.slice(0, i), q.tarea, ...visibles.slice(i)];
}

/** A quién va el foco cuando se va `id`: la siguiente, si no la anterior; `null` si no queda otra. */
export function vecinaAlQuitar<T extends { id: string }>(
  visibles: readonly T[],
  id: string,
): T | null {
  const i = visibles.findIndex((t) => t.id === id);
  if (i < 0) return null;
  return visibles[i + 1] ?? visibles[i - 1] ?? null;
}
