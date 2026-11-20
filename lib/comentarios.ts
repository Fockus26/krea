// Comentarios opcionales de Evaluar (D445, D446, D448). Puro, sin React: la rejilla de emojis,
// insertar uno donde está el cursor sin pasar del máximo y el texto de «Copiar comentarios».

/**
 * Emojis comunes de aula para el botón «Emoji» (D448): lista fija, sin dependencia. El nombre es
 * el `aria-label` de cada botón. PROVISIONAL (CONTENT_CHECKLIST fila 252).
 */
export const EMOJIS_AULA: ReadonlyArray<{ emoji: string; nombre: string }> = [
  { emoji: "👏", nombre: "Aplausos" },
  { emoji: "🎉", nombre: "Celebración" },
  { emoji: "⭐", nombre: "Estrella" },
  { emoji: "🌟", nombre: "Estrella brillante" },
  { emoji: "💯", nombre: "Cien puntos" },
  { emoji: "👍", nombre: "Pulgar arriba" },
  { emoji: "💪", nombre: "Bíceps" },
  { emoji: "🔥", nombre: "Fuego" },
  { emoji: "✨", nombre: "Destellos" },
  { emoji: "🏆", nombre: "Trofeo" },
  { emoji: "🚀", nombre: "Cohete" },
  { emoji: "🙌", nombre: "Manos en alto" },
  { emoji: "💡", nombre: "Idea" },
  { emoji: "🧠", nombre: "Cerebro" },
  { emoji: "🎨", nombre: "Paleta de pintor" },
  { emoji: "✏️", nombre: "Lápiz" },
  { emoji: "📚", nombre: "Libros" },
  { emoji: "📝", nombre: "Nota" },
  { emoji: "✅", nombre: "Hecho" },
  { emoji: "👀", nombre: "Ojos" },
  { emoji: "🤔", nombre: "Pensativo" },
  { emoji: "😊", nombre: "Cara sonriente" },
  { emoji: "😮", nombre: "Sorpresa" },
  { emoji: "❤️", nombre: "Corazón" },
];

/**
 * Inserta `inserto` en `texto` entre `inicio` y `fin` (la selección del campo; la reemplaza) y
 * devuelve el texto y dónde queda el cursor. `null` si no cabe en `max`: cuenta unidades UTF-16
 * (`String.length`), igual que `maxLength` y el contador, así que un emoji cuenta 2 (D446).
 * Posiciones fuera de rango se acotan al texto.
 */
export function insertarEnCursor(
  texto: string,
  inserto: string,
  inicio: number,
  fin: number,
  max: number,
): { texto: string; cursor: number } | null {
  const a = Math.max(0, Math.min(inicio, texto.length));
  const b = Math.max(a, Math.min(fin, texto.length));
  const nuevo = texto.slice(0, a) + inserto + texto.slice(b);
  if (nuevo.length > max) return null;
  return { texto: nuevo, cursor: a + inserto.length };
}

/**
 * Texto de «Copiar comentarios» del error al guardar (D171): «Pregunta n: …» por cada uno con
 * texto y, al final, «Comentario general: …» (D445). Vacío si no hay ninguno.
 */
export function comentariosParaCopiar(
  comentarios: readonly (string | undefined)[],
  general = "",
): string {
  const lineas = comentarios.flatMap((c, i) => {
    const t = c?.trim();
    return t ? [`Pregunta ${i + 1}: ${t}`] : [];
  });
  const g = general.trim();
  if (g) lineas.push(`Comentario general: ${g}`);
  return lineas.join("\n");
}
