import type { Metadata } from "next";
import { Suspense } from "react";
import { PantallaNotFound } from "@/components/estados/pantallas";
import { sesionDePantalla } from "@/lib/acciones/sesion";

// Next ya añade `noindex` al 404; el título lo completa la plantilla del layout («· KREA»)
export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: false },
};

/** La sesión real de la cookie (D213): rol y usuario de la cabecera y las acciones. */
async function NotFoundConSesion() {
  const s = await sesionDePantalla();
  return <PantallaNotFound sesion={s?.rol ?? null} usuario={s?.usuario} />;
}

/**
 * 404 de toda la app (HANDOFF §5b): direcciones que no existen y `notFound()` de las rutas
 * dinámicas. Está en la raíz, así que reemplaza al shell (sin barras de navegación). La sesión
 * sale de la cookie en el servidor (D213); mientras se lee, la supuesta por la dirección (D160).
 */
export default function NotFound() {
  return (
    <Suspense fallback={<PantallaNotFound />}>
      <NotFoundConSesion />
    </Suspense>
  );
}
