import type { Rol } from "@/lib/layout";
import { isActive, type NavItem, navItems } from "@/lib/nav";

/*
 * Transición entre páginas (D278). Puro: las barras de navegación lo usan para poner el tipo de
 * la View Transition en `<Link transitionTypes>`; el CSS (`globals.css`, «Transición entre
 * páginas») traduce cada tipo a un deslizamiento. Sin tipo, la navegación es un fundido corto
 * (abrir un detalle, volver, atrás del navegador) o nada (misma página, `refresh()`).
 */

/** La página nueva entra desde la derecha / desde la izquierda. */
export type TipoTransicion = "desliz-der" | "desliz-izq";

/**
 * Pestañas del rol en el orden de la barra lateral y, al final, las que solo están en la hoja
 * Menú (Perfil del profe). La barra inferior y el Menú son subconjuntos con el mismo orden
 * relativo, así que un solo índice sirve para las tres superficies. Incluye las del admin: el
 * orden no cambia por tenerlas o no.
 */
function pestanas(rol: Rol): readonly NavItem[] {
  const vistas = new Set<string>();
  return [
    ...navItems(rol, "lateral", { admin: true }),
    ...navItems(rol, "menu", { admin: true }),
  ].filter((item) => {
    if (vistas.has(item.id)) return false;
    vistas.add(item.id);
    return true;
  });
}

/** Índice de la pestaña a la que pertenece `pathname`, o −1 si no es de ninguna. */
export function indicePestana(
  rol: Rol,
  pathname: string | null | undefined,
): number {
  return pestanas(rol).findIndex((item) => isActive(item, pathname));
}

/**
 * Tipo de transición al ir de `desde` a `hacia` desde una pestaña: la página nueva entra por el
 * lado en que está su pestaña. `null` si es la misma pestaña (volver a Notas desde un detalle:
 * fundido) o si alguna de las dos rutas no es de una pestaña.
 */
export function tipoTransicion(
  rol: Rol,
  desde: string | null | undefined,
  hacia: string,
): TipoTransicion | null {
  const a = indicePestana(rol, desde);
  const b = indicePestana(rol, hacia);
  if (a < 0 || b < 0 || a === b) return null;
  return b > a ? "desliz-der" : "desliz-izq";
}

/** Para `<Link transitionTypes>`: la lista con el tipo, o `undefined` (navegación sin tipo). */
export function tiposTransicion(
  rol: Rol,
  desde: string | null | undefined,
  hacia: string,
): string[] | undefined {
  const t = tipoTransicion(rol, desde, hacia);
  return t ? [t] : undefined;
}
