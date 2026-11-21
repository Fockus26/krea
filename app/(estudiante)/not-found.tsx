import type { Metadata } from "next";
import { PantallaNotFound } from "@/components/estados/pantallas";

export const metadata: Metadata = {
  title: "Página no encontrada",
};

/**
 * 404 de las rutas dinámicas con sesión (D504): se pinta dentro del shell, que ya trae cabecera,
 * navegación y `<main id="contenido">`; la pantalla de la raíz los repetía. Las direcciones que no
 * existen en absoluto siguen yendo a `app/not-found.tsx`.
 */
export default function NotFound() {
  return <PantallaNotFound sesion="estudiante" enShell />;
}
