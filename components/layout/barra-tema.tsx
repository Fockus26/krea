"use client";
// Color de la barra del sistema (PWA instalada y Chrome en Android): el `--accent` vigente, en
// claro y en oscuro (D358). `viewport.themeColor` del layout pinta el primer color; aquí se
// reemplaza por el del token ya resuelto, y se vuelve a leer cuando cambian `data-theme` /
// `data-accent` en `<html>` (Perfil, el perfil de otro dispositivo) o el tema del sistema.
// Se lee el token y no una tabla de hex: si `globals.css` cambia, la barra lo sigue sola.
import { useEffect } from "react";

function pintarBarra() {
  const color = getComputedStyle(document.documentElement)
    .getPropertyValue("--accent")
    .trim();
  if (!color) return;
  // Next emite una etiqueta por `media` (claro y oscuro): el token ya es el del tema efectivo,
  // así que las dos llevan el mismo color.
  const metas = document.querySelectorAll<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  for (const m of metas) m.content = color;
}

export function BarraTema() {
  useEffect(() => {
    pintarBarra();
    const observador = new MutationObserver(pintarBarra);
    observador.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-accent"],
    });
    const sistema = matchMedia("(prefers-color-scheme: dark)");
    sistema.addEventListener("change", pintarBarra);
    return () => {
      observador.disconnect();
      sistema.removeEventListener("change", pintarBarra);
    };
  }, []);
  return null;
}
