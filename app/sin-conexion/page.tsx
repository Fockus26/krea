import type { Metadata } from "next";
import { PantallaSinConexion } from "@/components/estados/pantallas";

export const metadata: Metadata = {
  title: "Sin conexión",
  robots: { index: false, follow: false },
};

/**
 * Página «Sin conexión» del service worker (D291): la guarda al instalarse y la sirve cuando no
 * hay red y la página pedida nunca se visitó. Estática y sin sesión (no lleva datos de nadie);
 * «Reintentar» recarga la dirección que se pidió.
 */
export default function SinConexionPage() {
  return <PantallaSinConexion />;
}
