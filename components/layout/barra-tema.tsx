"use client";
// Color de la barra del sistema (PWA instalada y Chrome en Android): el `--accent` vigente, en
// claro y en oscuro (D358). `viewport.themeColor` del layout pinta el primer color; aquí se
// reemplaza por el del token ya resuelto, y se vuelve a leer cuando cambian `data-theme` /
// `data-accent` en `<html>` (Perfil, el perfil de otro dispositivo) o el tema del sistema.
// Se lee el token y no una tabla de hex: si `globals.css` cambia, la barra lo sigue sola.
//
// Al navegar, Next vuelve a escribir las etiquetas `theme-color` del viewport (con el azul de
// marca): por eso también se observa `<head>` y se repintan en cuanto aparecen o cambian (D358).
import { useEffect } from "react";

const SELECTOR = 'meta[name="theme-color"]';

function pintarBarra() {
  const color = getComputedStyle(document.documentElement)
    .getPropertyValue("--accent")
    .trim();
  if (!color) return;
  // Next emite una etiqueta por `media` (claro y oscuro): el token ya es el del tema efectivo,
  // así que las dos llevan el mismo color. Solo se escribe si cambia: si no, el observador de
  // `<head>` se dispararía con su propia escritura sin fin.
  for (const m of document.querySelectorAll<HTMLMetaElement>(SELECTOR))
    if (m.content !== color) m.content = color;
}

/** ¿El cambio toca una etiqueta `theme-color`? (nueva, quitada o con otro `content`). */
function tocaBarra(cambios: MutationRecord[]): boolean {
  const esMeta = (n: Node) =>
    n instanceof HTMLMetaElement && n.name === "theme-color";
  return cambios.some(
    (c) =>
      esMeta(c.target) ||
      [...c.addedNodes].some(esMeta) ||
      [...c.removedNodes].some(esMeta),
  );
}

export function BarraTema() {
  useEffect(() => {
    pintarBarra();
    const raiz = new MutationObserver(pintarBarra);
    raiz.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-accent"],
    });
    const cabeza = new MutationObserver((cambios) => {
      if (tocaBarra(cambios)) pintarBarra();
    });
    cabeza.observe(document.head, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["content"],
    });
    const sistema = matchMedia("(prefers-color-scheme: dark)");
    sistema.addEventListener("change", pintarBarra);
    // Volver a la app (otra app o pestaña del navegador en medio): por si algo la repintó
    const alVolver = () => {
      if (document.visibilityState === "visible") pintarBarra();
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      raiz.disconnect();
      cabeza.disconnect();
      sistema.removeEventListener("change", pintarBarra);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, []);
  return null;
}
