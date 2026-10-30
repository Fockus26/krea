// Tema y acento del usuario (D001, D015): las claves son las que lee el script anti-parpadeo del
// layout raíz. Perfil los guarda además en el perfil (fase 07); `localStorage` evita el parpadeo.

export type Tema = "light" | "dark" | "system";
export type Acento = "azul" | "rojo" | "verde" | "morado";

export const CLAVE_TEMA = "krea-theme";
export const CLAVE_ACENTO = "krea-accent";

export const ACENTOS: ReadonlyArray<{ valor: Acento; texto: string }> = [
  { valor: "azul", texto: "Azul" },
  { valor: "rojo", texto: "Rojo" },
  { valor: "verde", texto: "Verde" },
  { valor: "morado", texto: "Morado" },
];

export function esTema(v: unknown): v is Tema {
  return v === "light" || v === "dark" || v === "system";
}

export function esAcento(v: unknown): v is Acento {
  return ACENTOS.some((a) => a.valor === v);
}

/** Valor guardado o el de defecto; nunca lanza (modo privado). */
export function leerPreferencia(clave: string, defecto: string): string {
  try {
    return localStorage.getItem(clave) ?? defecto;
  } catch {
    return defecto;
  }
}

/** `null` borra la clave (Sistema = sin `data-theme`). */
export function guardarPreferencia(clave: string, valor: string | null) {
  try {
    if (valor === null) localStorage.removeItem(clave);
    else localStorage.setItem(clave, valor);
  } catch {
    // Sin almacenamiento (modo privado): el cambio vale solo para esta pestaña
  }
}

/** Aplica el tema en `<html>` y lo guarda. */
export function aplicarTema(tema: Tema) {
  const raiz = document.documentElement;
  if (tema === "system") raiz.removeAttribute("data-theme");
  else raiz.setAttribute("data-theme", tema);
  guardarPreferencia(CLAVE_TEMA, tema === "system" ? null : tema);
}

/** Aplica el acento en `<html>` y lo guarda. */
export function aplicarAcento(acento: Acento) {
  document.documentElement.setAttribute("data-accent", acento);
  guardarPreferencia(CLAVE_ACENTO, acento);
}
