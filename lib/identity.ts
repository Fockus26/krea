// Identidad visual sin imagen: color de respaldo del logo de equipo e iniciales (HANDOFF §2.5).

export const TEAM_COLORS = 6;

/** FNV-1a de 32 bits: determinista, sin dependencias y bien repartido en cadenas cortas. */
export function hashString(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Índice 1–6 del token `--team-N` para un equipo: `hash(teamId) % 6 + 1`. */
export function teamColorIndex(teamId: string): 1 | 2 | 3 | 4 | 5 | 6 {
  return ((hashString(teamId) % TEAM_COLORS) + 1) as 1 | 2 | 3 | 4 | 5 | 6;
}

function graphemes(texto: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter("es", { granularity: "grapheme" });
    return Array.from(seg.segment(texto), (s) => s.segment);
  }
  return Array.from(texto);
}

/** Primera letra o dígito visible (grafema completo: "Ñandú" → "Ñ"); si no hay, el primer grafema. */
export function teamInitial(texto: string): string {
  const lista = graphemes(texto.trim());
  const letra = lista.find((g) => /[\p{L}\p{N}]/u.test(g));
  return (letra ?? lista[0] ?? "").toLocaleUpperCase("es");
}

/** Hasta dos iniciales del nombre para el respaldo del avatar: "Mateo Guillermo" → "JE". */
export function initials(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean);
  return palabras
    .slice(0, 2)
    .map((p) => teamInitial(p))
    .join("");
}
