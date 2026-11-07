// Vista Tarjetas / Lista de Tareas y Equipos del profesor (X4, D313). Puro: qué vista vale y con
// qué clave se recuerda en `localStorage` (este navegador, una por pantalla). Lo que no sea una
// vista conocida —nada guardado, un valor viejo o tocado a mano— es la de siempre: Tarjetas.

export const VISTAS = ["tarjetas", "lista"] as const;
export type Vista = (typeof VISTAS)[number];

export const VISTA_INICIAL: Vista = "tarjetas";

export const CLAVE_VISTA_TAREAS = "krea.vista.tareas";
export const CLAVE_VISTA_EQUIPOS = "krea.vista.equipos";

export function vistaDe(valor: unknown): Vista {
  return VISTAS.find((v) => v === valor) ?? VISTA_INICIAL;
}

/* Textos. PROVISIONAL (CONTENT_CHECKLIST fila 164) */
export const VISTA_LABEL = "Vista";
export const VISTA_TEXTO: Record<Vista, string> = {
  tarjetas: "Tarjetas",
  lista: "Lista",
};
