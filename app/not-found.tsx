import type { Metadata } from "next";
import { PantallaNotFoundConSesion } from "@/components/estados/pantallas";

// Next ya añade `noindex` al 404; el título lo completa la plantilla del layout («· KREA»)
export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: false },
};

/**
 * 404 de toda la app (HANDOFF §5b): direcciones que no existen y `notFound()` de las rutas
 * dinámicas. Está en la raíz, así que reemplaza al shell (sin barras de navegación). Next prepara
 * este archivo en todas las rutas, no solo en los 404: la sesión se pide desde el cliente al
 * montar, para no leerla en cada visita (D219). Mientras llega, la supuesta por la dirección (D160).
 */
export default function NotFound() {
  return <PantallaNotFoundConSesion />;
}
