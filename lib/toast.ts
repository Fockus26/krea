// Posición del toast respecto de las barras pegadas abajo (D131). Puro: sin DOM.

/**
 * Alto que publica la barra de acción: el mayor de los medidos (px, redondeado hacia arriba) o
 * `null` si no hay ninguna visible (alto 0: oculta o aún sin medir).
 */
export function alturaMayor(alturas: Iterable<number>): number | null {
  let mayor = 0;
  for (const alto of alturas) {
    if (Number.isFinite(alto) && alto > mayor) mayor = alto;
  }
  return mayor > 0 ? Math.ceil(mayor) : null;
}
