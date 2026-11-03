import type { Metadata } from "next";
import { PantallaNotFound } from "@/components/estados/pantallas";

// Next ya añade `noindex` al 404; el título lo completa la plantilla del layout («· KREA»)
export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: false },
};

/**
 * 404 de toda la app (HANDOFF §5b): direcciones que no existen y `notFound()` de las rutas
 * dinámicas. Está en la raíz, así que reemplaza al shell (sin barras de navegación). La sesión
 * la supone por la dirección hasta la fase 07 (D160).
 */
export default function NotFound() {
  return <PantallaNotFound />;
}
