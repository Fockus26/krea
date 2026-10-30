// Avatares DiceBear 9.x (HANDOFF §2.5, D010). Lógica pura: el SVG lo pide el navegador por URL.

export const DICEBEAR_ESTILOS = [
  "adventurer-neutral",
  "fun-emoji",
  "bottts-neutral",
  "notionists-neutral",
] as const;

export type DicebearEstilo = (typeof DICEBEAR_ESTILOS)[number];

const BASE = "https://api.dicebear.com/9.x";

export function esEstiloDicebear(valor: unknown): valor is DicebearEstilo {
  return (
    typeof valor === "string" &&
    (DICEBEAR_ESTILOS as readonly string[]).includes(valor)
  );
}

/** `{estilo, seed}` es lo que se guarda en el perfil. Lanza si el estilo no es uno de los 4. */
export function avatarUrl({
  estilo,
  seed,
}: {
  estilo: DicebearEstilo;
  seed: string;
}): string {
  if (!esEstiloDicebear(estilo))
    throw new Error(`Estilo de DiceBear no válido: ${String(estilo)}`);
  return `${BASE}/${estilo}/svg?seed=${encodeURIComponent(seed)}`;
}
